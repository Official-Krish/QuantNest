import type { AIDecisionResult } from "@quantnest-trading/types";

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  execute(
    config: AIProviderConfig,
    messages: ChatMessage[],
  ): Promise<AIDecisionResult>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
