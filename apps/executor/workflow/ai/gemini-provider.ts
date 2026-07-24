import { GoogleGenAI } from "@google/genai";
import type { AIDecisionResult } from "@quantnest-trading/types";
import { AIDecisionResultSchema } from "@quantnest-trading/types";
import type { AIProvider, AIProviderConfig, ChatMessage } from "./provider";

export class GeminiProvider implements AIProvider {
  async execute(
    config: AIProviderConfig,
    messages: ChatMessage[],
  ): Promise<AIDecisionResult> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    const systemMessage = messages.find((m) => m.role === "system");
    const userMessage = messages.find((m) => m.role === "user");

    const response = await ai.models.generateContent({
      model: config.model,
      contents: userMessage?.content ?? "",
      config: {
        systemInstruction: systemMessage?.content,
        temperature: config.temperature ?? 0.2,
        maxOutputTokens: config.maxTokens ?? 512,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;
    return AIDecisionResultSchema.parse(parsed);
  }
}
