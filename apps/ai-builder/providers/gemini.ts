import { GoogleGenAI } from "@google/genai";
import type { AiStrategyBuilderRequest, AiStrategyBuilderResponse } from "@quantnest-trading/types/ai";
import { normalizeStrategyPlanResponse } from "../services/plan-schema";
import { GEMINI_MODELS } from "../services/model-registry";
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
      throw new Error("Gemini is not configured. Set GOOGLE_API_KEY.");
    }

    const modelName =
      input.model?.model && this.models.some((model) => model.id === input.model?.model)
        ? input.model.model
        : this.models.find((model) => model.recommended)?.id ?? this.models[0]?.id;

    if (!modelName) {
      throw new Error("No Gemini models are configured.");
    }

    const response = await this.client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return normalizeStrategyPlanResponse(response.text ?? "{}", this.provider, modelName, input);
  }
}
