import { Router } from "express";
import { aiStrategySetupStateSchema } from "@quantnest-trading/types/ai";
import { ZodError } from "zod";
import { AiBuilderError, isAiBuilderError } from "../errors";
import { serviceAuthMiddleware } from "../middleware";
import { AnthropicStrategyPlannerProvider } from "../providers/anthropic";
import { GeminiStrategyPlannerProvider } from "../providers/gemini";
import { OpenAIStrategyPlannerProvider } from "../providers/openai";
import { aiDraftStore } from "../services/draft-store";
import { resolvePlannerProvider } from "../services/model-registry";
import {
  parseStrategyBuilderRequest,
  parseStrategyDraftEditRequest,
} from "../services/plan-schema";
import { buildStrategyEditPrompt, buildStrategyPlannerPrompt } from "../services/prompt-builder";
import type { StrategyPlannerProvider } from "../types";

const providers: StrategyPlannerProvider[] = [
  new AnthropicStrategyPlannerProvider(),
  new GeminiStrategyPlannerProvider(),
  new OpenAIStrategyPlannerProvider(),
];

const router = Router();

function requireUserId(userId?: string): string {
  if (!userId) {
    throw new AiBuilderError("USER_CONTEXT_MISSING", "User context is required for AI draft sessions.", 401);
  }
  return userId;
}

async function generatePlanWithRetry(
  provider: StrategyPlannerProvider,
  input: ReturnType<typeof parseStrategyBuilderRequest>,
  prompt: string,
) {
  let attemptPrompt = prompt;
  const crossoverHint = /(cross(?:es|ed|ing)?[_\s-]?(above|below)|crossover)/i.test(input.prompt)
    ? `

Important correction for crossover requests:
- Add a conditional-trigger node with metadata.expression.
- metadata.expression.conditions must include a single inner group for related clauses.
- Use operator exactly "crosses_above" or "crosses_below".
- For crossover clause, both left and right must be indicator operands.
- Canonical shape: {"type":"group","operator":"AND","conditions":[{"type":"group","operator":"AND","conditions":[<clause>, ...]}]}
- Example clause shape:
  {"type":"clause","left":{"type":"indicator","indicator":{"symbol":"HDFC","timeframe":"5m","marketType":"Indian","indicator":"ema","params":{"period":20}}},"operator":"crosses_below","right":{"type":"indicator","indicator":{"symbol":"HDFC","timeframe":"5m","marketType":"Indian","indicator":"ema","params":{"period":50}}}}
`
    : "";
  const volumeSpikeHint = /volume\s*(spike|surge)|spike\s+in\s+volume|high\s+volume|volume\s*above/i.test(input.prompt)
    ? `

Important correction for volume spike requests:
- Add a conditional-trigger node with metadata.expression.
- metadata.expression.conditions must include one group whose conditions include at least one volume clause.
- Use indicator "volume" as left or right operand in at least one clause.
- Example clause shape:
  {"type":"clause","left":{"type":"indicator","indicator":{"symbol":"HDFC","timeframe":"5m","marketType":"Indian","indicator":"volume"}},"operator":">","right":{"type":"value","value":1000000}}
`
    : "";
  const conditionalGroupingHint = `

Conditional grouping DO/DON'T:
- DO use one inner group for flat lists like A AND B AND C, or A OR B.
- DO use multiple inner groups only for parenthesized logic like (A AND B) OR (C AND D).
- DON'T create one inner group per clause for flat conditions.
- Preferred canonical shape: {"type":"group","operator":"AND|OR","conditions":[{"type":"group","operator":"AND|OR","conditions":[<clause>, ...]}]}
`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await provider.generatePlan(input, attemptPrompt);
    } catch (error) {
      if (
        attempt === 0 &&
        isAiBuilderError(error) &&
        ["INVALID_PROVIDER_JSON", "INVALID_GRAPH", "UNSUPPORTED_NODE_TYPE", "PROMPT_MISMATCH"].includes(
          error.code,
        )
      ) {
        attemptPrompt = `${prompt}

Previous output was invalid for this reason: ${error.message}

Correct the structure and regenerate a valid full workflow JSON.${crossoverHint}${volumeSpikeHint}${conditionalGroupingHint}

Regenerate the workflow plan. Return only corrected JSON.`;
        continue;
      }

      throw error;
    }
  }

  throw new AiBuilderError("PLAN_GENERATION_FAILED", "Failed to generate a valid strategy plan.", 502);
}

router.get("/models", serviceAuthMiddleware, (_req, res) => {
  res.status(200).json({
    success: true,
    models: providers.flatMap((provider) => provider.models),
  });
});

router.post("/strategy/plan", serviceAuthMiddleware, async (req, res) => {
  try {
    const input = parseStrategyBuilderRequest(req.body);
    const { provider } = resolvePlannerProvider(providers, input.model);
    const prompt = buildStrategyPlannerPrompt(input);
    const result = await generatePlanWithRetry(provider, input, prompt);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Invalid planner request.",
        errors: error,
      });
      return;
    }

    if (isAiBuilderError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to generate strategy plan.";
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message,
    });
  }
});

router.post("/strategy/drafts", serviceAuthMiddleware, async (req, res) => {
  try {
    const userId = requireUserId(req.userId);
    const input = parseStrategyBuilderRequest(req.body);
    const { provider } = resolvePlannerProvider(providers, input.model);
    const prompt = buildStrategyPlannerPrompt(input);
    const response = await generatePlanWithRetry(provider, input, prompt);
    const draft = await aiDraftStore.create(userId, input, response);

    res.status(200).json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Invalid planner request.",
        errors: error.flatten(),
      });
      return;
    }

    if (isAiBuilderError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to create AI draft.";
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message,
    });
  }
});

router.post("/strategy/drafts/:draftId/edit", serviceAuthMiddleware, async (req, res) => {
  try {
    const userId = requireUserId(req.userId);
    const edit = parseStrategyDraftEditRequest(req.body);
    const existing = await aiDraftStore.get(userId, String(req.params.draftId));
    
    const conversationHistory = existing.messages
      .filter((msg) => (msg.role === "user" || msg.role === "assistant") && (msg.kind === "prompt" || msg.kind === "edit" || msg.kind === "result"))
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
    
    const input = {
      ...existing.request,
      model: edit.model ?? existing.request.model,
      conversationHistory, 
    };
    const { provider } = resolvePlannerProvider(providers, input.model);
    const prompt = buildStrategyEditPrompt(input, existing.response.plan, edit.instruction);
    const response = await generatePlanWithRetry(provider, input, prompt);
    const draft = await aiDraftStore.update(userId, existing.draftId, input, response, edit.instruction);

    res.status(200).json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Invalid draft edit request.",
        errors: error.flatten(),
      });
      return;
    }

    if (isAiBuilderError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to edit AI draft.";
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message,
    });
  }
});

router.get("/strategy/drafts/:draftId/versions/:versionId", serviceAuthMiddleware, async (req, res) => {
  try {
    const userId = requireUserId(req.userId);
    const payload = await aiDraftStore.getVersion(
      userId,
      String(req.params.draftId),
      String(req.params.versionId),
    );

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    if (isAiBuilderError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to load AI draft version.";
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message,
    });
  }
});

router.put("/strategy/drafts/:draftId/setup", serviceAuthMiddleware, async (req, res) => {
  try {
    const userId = requireUserId(req.userId);
    const versionId = typeof req.query.versionId === "string" ? req.query.versionId.trim() : "";
    const setupState = aiStrategySetupStateSchema.parse(req.body);
    const draft = await aiDraftStore.updateSetupState(
      userId,
      String(req.params.draftId),
      setupState,
      versionId || undefined,
    );

    res.status(200).json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Invalid draft setup payload.",
        errors: error,
      });
      return;
    }

    if (isAiBuilderError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to save draft setup.";
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message,
    });
  }
});

export default router;
