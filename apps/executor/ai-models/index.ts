import type {
  EventType,
  NotificationAiInsight,
  NotificationDetails,
} from "../types";
import type { AiModelRequestOptions } from "@quantnest-trading/types/ai";
import type {
  AiReasoningProvider,
  DailyPerformanceAnalysis,
  DailyPerformanceInput,
} from "./types";
import {
  createProvider,
  registerProvider,
  resolveProviderName,
} from "./provider-registry";
import { GeminiReasoningProvider } from "./gemini/gemini";

registerProvider("gemini", GeminiReasoningProvider);

let providerInstance: AiReasoningProvider | null = null;

function getProvider(): AiReasoningProvider {
  if (!providerInstance) {
    providerInstance = createProvider(resolveProviderName());
  }
  return providerInstance;
}

export function getAiReasoningProvider(): AiReasoningProvider {
  return getProvider();
}

export async function generateTradeReasoning(
  eventType: EventType,
  details: NotificationDetails,
  options?: AiModelRequestOptions,
): Promise<NotificationAiInsight> {
  const provider =
    options?.provider || options?.model
      ? createProvider(resolveProviderName(options?.provider), options)
      : getProvider();
  return provider.generateTradeReasoning(eventType, details);
}

export async function generateDailyPerformanceAnalysis(
  input: DailyPerformanceInput,
  options?: AiModelRequestOptions,
): Promise<DailyPerformanceAnalysis> {
  const provider =
    options?.provider || options?.model
      ? createProvider(resolveProviderName(options?.provider), options)
      : getProvider();
  return provider.generateDailyPerformanceAnalysis(input);
}

export type { DailyPerformanceAnalysis, DailyPerformanceInput } from "./types";
export { registerProvider } from "./provider-registry";
