import type { AIProvider } from "./provider";
import { GeminiProvider } from "./gemini-provider";

const providers = new Map<string, AIProvider>();

providers.set("gemini", new GeminiProvider());

export function getAIProvider(providerName: string): AIProvider {
  const provider = providers.get(providerName);
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }
  return provider;
}
