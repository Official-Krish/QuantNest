import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  StreamChunk,
} from "./provider";

const BACKEND_URL =
  process.env.QUANTNEST_BACKEND_URL || "http://localhost:3000";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChoice {
  message: { content: string | null };
  finish_reason: string;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  error?: { message: string };
}

export class OpenClawProvider implements AIProvider {
  async execute(
    config: AIProviderConfig,
    messages: ChatMessage[],
  ): Promise<Record<string, unknown>> {
    if (config.userId) {
      return this.executeViaAgent(config, messages);
    }
    return this.executeDirect(config, messages);
  }

  private async executeDirect(
    config: AIProviderConfig,
    messages: ChatMessage[],
  ): Promise<Record<string, unknown>> {
    const baseUrl = (config.baseUrl || "http://127.0.0.1:18789").replace(
      /\/+$/,
      "",
    );
    const url = `${baseUrl}/v1/chat/completions`;

    const openaiMessages: OpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const body: Record<string, unknown> = {
      model: "openclaw/default",
      messages: openaiMessages,
      temperature: config.temperature ?? 0.2,
      max_tokens: config.maxTokens ?? 512,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as OpenAIResponse;

    if (!response.ok || data.error) {
      throw new Error(
        `OpenClaw API error: ${data.error?.message ?? response.statusText}`,
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenClaw returned empty content");
    }

    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return { result: content };
    }
  }

  private async executeViaAgent(
    config: AIProviderConfig,
    messages: ChatMessage[],
  ): Promise<Record<string, unknown>> {
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

    const response = await fetch(
      `${BACKEND_URL}/api/v1/internal/agent-execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: config.userId,
          messages,
          prompt,
          timeout: 30_000,
        }),
        signal: AbortSignal.timeout(60000),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agent API error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      status?: string;
      message?: string;
      data?: unknown;
    };

    if (data.status === "error" || data.status === "failure") {
      throw new Error(data.message || "Agent execution failed");
    }

    const content =
      data.message ||
      (data.data
        ? typeof data.data === "string"
          ? data.data
          : JSON.stringify(data.data)
        : "");

    if (!content) {
      return { result: content };
    }

    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return { result: content };
    }
  }

  async streamExecute(
    config: AIProviderConfig,
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<Record<string, unknown>> {
    if (config.userId) {
      const result = await this.executeViaAgent(config, messages);
      onChunk({ type: "text", text: JSON.stringify(result) });
      onChunk({ type: "done" });
      return result;
    }

    const baseUrl = (config.baseUrl || "http://127.0.0.1:18789").replace(
      /\/+$/,
      "",
    );
    const url = `${baseUrl}/v1/chat/completions`;

    const openaiMessages: OpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const body: Record<string, unknown> = {
      model: "openclaw/default",
      messages: openaiMessages,
      temperature: config.temperature ?? 0.2,
      max_tokens: config.maxTokens ?? 512,
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenClaw API error: ${response.status} ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("OpenClaw stream has no body");

    const decoder = new TextDecoder();
    let buffer = "";
    const fullContent: string[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{
                delta?: { content?: string };
              }>;
            };
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              fullContent.push(text);
              onChunk({ type: "text", text });
            }
          } catch {
            // skip parse errors for incomplete lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const combined = fullContent.join("");
    if (combined) {
      onChunk({ type: "done" });
      try {
        return JSON.parse(combined) as Record<string, unknown>;
      } catch {
        return { result: combined };
      }
    }

    onChunk({ type: "error", error: "No response from OpenClaw" });
    throw new Error("OpenClaw stream produced no output");
  }
}
