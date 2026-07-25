import type { ToolDefinition } from "./tools/types";

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export type StreamChunk = {
  type: "text" | "error" | "done";
  text?: string;
  error?: string;
};

export interface AIProvider {
  execute(
    config: AIProviderConfig,
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<Record<string, unknown>>;

  streamExecute?(
    config: AIProviderConfig,
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void,
    tools?: ToolDefinition[],
  ): Promise<Record<string, unknown>>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
