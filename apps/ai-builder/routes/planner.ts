import { Router } from "express";
import { ZodError } from "zod";
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

router.get("/models", (_req, res) => {
  res.status(200).json({
    success: true,
    models: providers.flatMap((provider) => provider.models),
  });
});

router.post("/strategy/plan", async (req, res) => {
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
        message: "Invalid planner request.",
        errors: error,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to generate strategy plan.";
    res.status(400).json({
      success: false,
      message,
    });
  }
});

export default router;
