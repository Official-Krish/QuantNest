import type { AiModelRequestOptions } from "@quantnest-trading/types/ai";
import type { AiReasoningProvider } from "./types";

type ProviderConstructor = new (config?: {
  model?: string;
}) => AiReasoningProvider;

const registry = new Map<string, ProviderConstructor>();

export function registerProvider(
  name: string,
  ctor: ProviderConstructor,
): void {
  registry.set(name.toLowerCase().trim(), ctor);
}

export function createProvider(
  name: string,
  options?: AiModelRequestOptions,
): AiReasoningProvider {
  const normalized = name.toLowerCase().trim();
  const Ctor = registry.get(normalized);
  if (!Ctor) {
    console.warn(
      `Unsupported AI provider "${name}". Falling back to "gemini".`,
    );
    const fallback = registry.get("gemini");
    if (!fallback) throw new Error("No AI providers registered");
    return new fallback({ model: options?.model });
  }
  return new Ctor({ model: options?.model });
}

export function resolveProviderName(provider?: string): string {
  return (provider || process.env.AI_MODEL_PROVIDER || "gemini")
    .trim()
    .toLowerCase();
}
