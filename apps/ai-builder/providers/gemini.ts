import { GoogleGenAI } from "@google/genai";
import type { AiStrategyBuilderRequest, AiStrategyBuilderResponse } from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";
import { normalizeStrategyPlanResponse } from "../services/plan-schema";
import { GEMINI_MODELS } from "../services/model-registry";
import { withTimeout } from "../services/timeout";
import type { StrategyPlannerProvider } from "../types";

export class GeminiStrategyPlannerProvider implements StrategyPlannerProvider {
  public readonly provider = "gemini";
  public readonly models = GEMINI_MODELS;
  private readonly client: GoogleGenAI | null;

  constructor(apiKey = process.env.GOOGLE_API_KEY) {
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async generatePlan(
    input: AiStrategyBuilderRequest,
    prompt: string,
  ): Promise<AiStrategyBuilderResponse> {
    if (!this.client) {
      throw new AiBuilderError("PROVIDER_NOT_CONFIGURED", "Gemini is not configured. Set GOOGLE_API_KEY.", 500);
    }

    const modelName =
      input.model?.model && this.models.some((model) => model.id === input.model?.model)
        ? input.model.model
        : this.models.find((model) => model.recommended)?.id ?? this.models[0]?.id;

    if (!modelName) {
      throw new AiBuilderError("MODEL_NOT_CONFIGURED", "No Gemini models are configured.", 500);
    }

    const response = await withTimeout(
      this.client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }),
      30000,
      "Gemini timed out while generating the workflow plan.",
    );

    return normalizeStrategyPlanResponse(response.text ?? "{}", this.provider, modelName, input);
  }
}
