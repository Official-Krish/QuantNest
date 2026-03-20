import { Router } from "express";
import { ZodError, z } from "zod";
import { AiBuilderError, isAiBuilderError } from "../errors";
import { serviceAuthMiddleware } from "../middleware";
import { AnthropicStrategyPlannerProvider } from "../providers/anthropic";
import { GeminiStrategyPlannerProvider } from "../providers/gemini";
import { OpenAIStrategyPlannerProvider } from "../providers/openai";
import { aiDraftStore } from "../services/draft-store";
import { resolvePlannerProvider } from "../services/model-registry";
import { parseStrategyBuilderRequest } from "../services/plan-schema";
import { buildStrategyEditPrompt, buildStrategyPlannerPrompt } from "../services/prompt-builder";
import type { StrategyPlannerProvider } from "../types";

const providers: StrategyPlannerProvider[] = [
  new AnthropicStrategyPlannerProvider(),
  new GeminiStrategyPlannerProvider(),
  new OpenAIStrategyPlannerProvider(),
];

const router = Router();

const draftEditSchema = z.object({
  instruction: z.string().trim().min(4),
  model: z
    .object({
      provider: z.string().trim().min(1).optional(),
      model: z.string().trim().min(1).optional(),
    })
    .optional(),
});

async function generatePlanWithRetry(
  provider: StrategyPlannerProvider,
  input: ReturnType<typeof parseStrategyBuilderRequest>,
  prompt: string,
) {
  let attemptPrompt = prompt;

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
    const input = parseStrategyBuilderRequest(req.body);
    const { provider } = resolvePlannerProvider(providers, input.model);
    const prompt = buildStrategyPlannerPrompt(input);
    const response = await generatePlanWithRetry(provider, input, prompt);
    const draft = aiDraftStore.create(input, response);

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

router.get("/strategy/drafts/:draftId", serviceAuthMiddleware, async (req, res) => {
  try {
    const draft = aiDraftStore.get(String(req.params.draftId));
    res.status(200).json({
      success: true,
      data: { draft },
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

    const message = error instanceof Error ? error.message : "Failed to load AI draft.";
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message,
    });
  }
});

router.post("/strategy/drafts/:draftId/edit", serviceAuthMiddleware, async (req, res) => {
  try {
    const edit = draftEditSchema.parse(req.body);
    const existing = aiDraftStore.get(String(req.params.draftId));
    const input = {
      ...existing.request,
      model: edit.model ?? existing.request.model,
    };
    const { provider } = resolvePlannerProvider(providers, input.model);
    const prompt = buildStrategyEditPrompt(input, existing.response.plan, edit.instruction);
    const response = await generatePlanWithRetry(provider, input, prompt);
    const draft = aiDraftStore.update(existing.draftId, input, response, edit.instruction);

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

export default router;
