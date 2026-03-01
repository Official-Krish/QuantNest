import type { EventType, NotificationAiInsight, NotificationDetails } from "../types";
import { GeminiReasoningProvider } from "./gemini/gemini";
import type {
    AiReasoningProvider,
    DailyPerformanceAnalysis,
    DailyPerformanceInput,
} from "./types";

export interface AiModelRequestOptions {
    provider?: string;
    model?: string;
}

function resolveProviderName(provider?: string): string {
    return (provider || process.env.AI_MODEL_PROVIDER || "gemini").trim().toLowerCase();
}

function createProvider(name: string, options?: AiModelRequestOptions): AiReasoningProvider {
    switch (name) {
        case "gemini":
            return new GeminiReasoningProvider({ model: options?.model });
        default:
            console.warn(
                `Unsupported AI provider "${name}". Falling back to "gemini".`
            );
            return new GeminiReasoningProvider({ model: options?.model });
    }
}

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
    options?: AiModelRequestOptions
): Promise<NotificationAiInsight> {
    const provider = options?.provider || options?.model
        ? createProvider(resolveProviderName(options?.provider), options)
        : getProvider();
    return provider.generateTradeReasoning(eventType, details);
}

export async function generateDailyPerformanceAnalysis(
    input: DailyPerformanceInput,
    options?: AiModelRequestOptions
): Promise<DailyPerformanceAnalysis> {
    const provider = options?.provider || options?.model
        ? createProvider(resolveProviderName(options?.provider), options)
        : getProvider();
    return provider.generateDailyPerformanceAnalysis(input);
}

export type { DailyPerformanceAnalysis, DailyPerformanceInput } from "./types";
