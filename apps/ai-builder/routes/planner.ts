import { Router } from "express";
import { ZodError } from "zod";
import { AiBuilderError, isAiBuilderError } from "../errors";
import { serviceAuthMiddleware } from "../middleware";
import { AnthropicStrategyPlannerProvider } from "../providers/anthropic";
import { GeminiStrategyPlannerProvider } from "../providers/gemini";
import { OpenAIStrategyPlannerProvider } from "../providers/openai";
import { resolvePlannerProvider } from "../services/model-registry";
import { parseStrategyBuilderRequest } from "../services/plan-schema";
import { buildStrategyPlannerPrompt } from "../services/prompt-builder";
import type { StrategyPlannerProvider } from "../types";

const providers: StrategyPlannerProvider[] = [
  new AnthropicStrategyPlannerProvider(),
  new GeminiStrategyPlannerProvider(),
  new OpenAIStrategyPlannerProvider(),
];

const router = Router();

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

export default router;
