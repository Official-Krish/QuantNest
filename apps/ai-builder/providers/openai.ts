import OpenAI from "openai";
import type { AiStrategyBuilderRequest, AiStrategyBuilderResponse } from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";
import { normalizeStrategyPlanResponse } from "../services/plan-schema";
import { OPENAI_MODELS } from "../services/model-registry";
import { withTimeout } from "../services/timeout";
import type { StrategyPlannerProvider } from "../types";

export class OpenAIStrategyPlannerProvider implements StrategyPlannerProvider {
  public readonly provider = "openai";
  public readonly models = OPENAI_MODELS;
  private readonly client: OpenAI | null;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generatePlan(
    input: AiStrategyBuilderRequest,
    prompt: string,
  ): Promise<AiStrategyBuilderResponse> {
    if (!this.client) {
      throw new AiBuilderError("PROVIDER_NOT_CONFIGURED", "OpenAI is not configured. Set OPENAI_API_KEY.", 500);
    }

    const modelName =
      input.model?.model && this.models.some((model) => model.id === input.model?.model)
        ? input.model.model
        : this.models.find((model) => model.recommended)?.id ?? this.models[0]?.id;

    if (!modelName) {
      throw new AiBuilderError("MODEL_NOT_CONFIGURED", "No OpenAI models are configured.", 500);
    }

    const response = await withTimeout(
      this.client.responses.create({
        model: modelName,
        input: prompt,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
      30000,
      "OpenAI timed out while generating the workflow plan.",
    );

    const rawText = response.output_text || "{}";
    return normalizeStrategyPlanResponse(rawText, this.provider, modelName, input);
  }
}
