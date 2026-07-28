import {
  GoogleGenAI,
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
} from "@google/genai";
import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  StreamChunk,
} from "./provider";
import type { ToolDefinition, ToolCall } from "./tools/types";
import { executeToolCalls } from "./tools/registry";

export class GeminiProvider implements AIProvider {
  async execute(
    config: AIProviderConfig,
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<Record<string, unknown>> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    const systemMessage = messages.find((m) => m.role === "system");
    const userMessage = messages.find((m) => m.role === "user");

    let contents: Array<{
      role: string;
      parts: Array<Record<string, unknown>>;
    }> = [];

    if (userMessage?.content) {
      contents = [{ role: "user", parts: [{ text: userMessage.content }] }];
    }

    const hasTools = tools && tools.length > 0;

    const maxTurns = 5;
    for (let turn = 0; turn < maxTurns; turn++) {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: contents as any,
        config: {
          systemInstruction: systemMessage?.content,
          temperature: config.temperature ?? 0.2,
          maxOutputTokens: config.maxTokens ?? 512,
          tools: hasTools
            ? [
                {
                  functionDeclarations: tools!.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters as any,
                  })),
                },
              ]
            : undefined,
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const calls: ToolCall[] = functionCalls.map((fc) => ({
          name: fc.name ?? "unknown",
          args: (fc.args ?? {}) as Record<string, unknown>,
          id: fc.id ?? fc.name ?? "unknown",
        }));

        const results = await executeToolCalls(calls);

        contents.push({
          role: "model",
          parts: calls.map(
            (c) =>
              createPartFromFunctionCall(c.name, c.args) as unknown as Record<
                string,
                unknown
              >,
          ),
        });

        contents.push({
          role: "function",
          parts: results.map(
            (r) =>
              createPartFromFunctionResponse(
                r.id,
                r.name,
                r.result,
              ) as unknown as Record<string, unknown>,
          ),
        });

        continue;
      }

      const text = response.text;
      if (text) {
        try {
          return JSON.parse(text) as Record<string, unknown>;
        } catch {
          return { result: text };
        }
      }

      throw new Error("Gemini response had no text or function calls");
    }

    throw new Error(
      "Gemini reached maximum tool call turns without producing a final answer",
    );
  }

  async streamExecute(
    config: AIProviderConfig,
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void,
    tools?: ToolDefinition[],
  ): Promise<Record<string, unknown>> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    const systemMessage = messages.find((m) => m.role === "system");
    const userMessage = messages.find((m) => m.role === "user");

    let contents: Array<{
      role: string;
      parts: Array<Record<string, unknown>>;
    }> = [];

    if (userMessage?.content) {
      contents = [{ role: "user", parts: [{ text: userMessage.content }] }];
    }

    const hasTools = tools && tools.length > 0;

    const maxTurns = 3;
    for (let turn = 0; turn < maxTurns; turn++) {
      const stream = await ai.models.generateContentStream({
        model: config.model,
        contents: contents as any,
        config: {
          systemInstruction: systemMessage?.content,
          temperature: config.temperature ?? 0.2,
          maxOutputTokens: config.maxTokens ?? 512,
          tools: hasTools
            ? [
                {
                  functionDeclarations: tools!.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters as any,
                  })),
                },
              ]
            : undefined,
        },
      });

      const fullText: string[] = [];

      for await (const chunk of stream) {
        const functionCalls = chunk.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          const calls: ToolCall[] = functionCalls.map((fc) => ({
            name: fc.name ?? "unknown",
            args: (fc.args ?? {}) as Record<string, unknown>,
            id: fc.id ?? fc.name ?? "unknown",
          }));

          const results = await executeToolCalls(calls);

          contents.push({
            role: "model",
            parts: calls.map(
              (c) =>
                createPartFromFunctionCall(c.name, c.args) as unknown as Record<
                  string,
                  unknown
                >,
            ),
          });

          contents.push({
            role: "function",
            parts: results.map(
              (r) =>
                createPartFromFunctionResponse(
                  r.id,
                  r.name,
                  r.result,
                ) as unknown as Record<string, unknown>,
            ),
          });

          break;
        }

        const text = chunk.text;
        if (text) {
          fullText.push(text);
          onChunk({ type: "text", text });
        }
      }

      if (fullText.length > 0) {
        const combined = fullText.join("");
        onChunk({ type: "done" });
        try {
          return JSON.parse(combined) as Record<string, unknown>;
        } catch {
          return { result: combined };
        }
      }
    }

    onChunk({ type: "error", error: "No response generated" });
    throw new Error("Gemini stream produced no output");
  }
}
