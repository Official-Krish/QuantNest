import { Router } from "express";
import { ZodError } from "zod";
import { isAiBuilderError } from "../errors";
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
    const result = await provider.generatePlan(input, prompt);

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
