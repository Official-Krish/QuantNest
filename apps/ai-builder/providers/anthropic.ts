import Anthropic from "@anthropic-ai/sdk";
import type { AiStrategyBuilderRequest, AiStrategyBuilderResponse } from "@quantnest-trading/types/ai";
import { normalizeStrategyPlanResponse } from "../services/plan-schema";
import { ANTHROPIC_MODELS } from "../services/model-registry";
import type { StrategyPlannerProvider } from "../types";

export class AnthropicStrategyPlannerProvider implements StrategyPlannerProvider {
  public readonly provider = "anthropic";
  public readonly models = ANTHROPIC_MODELS;
  private readonly client: Anthropic | null;

  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async generatePlan(
    input: AiStrategyBuilderRequest,
    prompt: string,
  ): Promise<AiStrategyBuilderResponse> {
    if (!this.client) {
      throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY.");
    }

    const modelName =
      input.model?.model && this.models.some((model) => model.id === input.model?.model)
        ? input.model.model
        : this.models.find((model) => model.recommended)?.id ?? this.models[0]?.id;

    if (!modelName) {
      throw new Error("No Anthropic models are configured.");
    }

    const response = await this.client.messages.create({
      model: modelName,
      max_tokens: 4096,
      system:
        "You are an AI workflow planner for QuantNest Trading. Return only valid JSON with no markdown fences.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = response.content
      .filter((block: Anthropic.ContentBlock): block is Anthropic.TextBlock => block.type === "text")
      .map((block: Anthropic.TextBlock) => block.text)
      .join("\n")
      .trim() || "{}";

    return normalizeStrategyPlanResponse(rawText, this.provider, modelName, input);
  }
}
