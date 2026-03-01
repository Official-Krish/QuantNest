import { GoogleGenAI } from "@google/genai";
import type { EventType, NotificationAiInsight, NotificationDetails } from "../../types";
import type {
    AiReasoningProvider,
    DailyPerformanceAnalysis,
    DailyPerformanceInput,
} from "../types";
import { buildFallbackDailyPerformanceAnalysis, buildFallbackInsight } from "../fallbacks";
import { normalizeDailyPerformanceAnalysis, extractJsonBlock, normalizeInsight } from "../normalization";
import { buildDailyPerformancePrompt, buildTradeReasoningPrompt } from "../prompts";
import { buildDefaultReferences, buildIndicatorSnapshot } from "../indicatorContext";
import type { RawInsightResponse } from "../normalization";

export class GeminiReasoningProvider implements AiReasoningProvider {
    public readonly name = "gemini";
    private readonly modelName: string;
    private readonly ai: GoogleGenAI | null;

    constructor(config?: { apiKey?: string; model?: string }) {
        const apiKey = config?.apiKey ?? process.env.GOOGLE_API_KEY;
        this.modelName = config?.model ?? process.env.GOOGLE_GENAI_MODEL ?? "gemini-2.5-flash";
        this.ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
    }

    async generateTradeReasoning(eventType: EventType, details: NotificationDetails): Promise<NotificationAiInsight> {
        if (!this.ai) {
            return buildFallbackInsight(eventType, details);
        }

        try {
            const defaultReferences = buildDefaultReferences(details);
            const indicatorSnapshot = await buildIndicatorSnapshot(details, defaultReferences);

            const payload = {
                eventType,
                symbol: details.symbol,
                quantity: details.quantity,
                exchange: details.exchange,
                targetPrice: details.targetPrice,
                condition: details.condition,
                triggerContext: details.aiContext || {},
                indicatorSnapshot,
            };
            const prompt = buildTradeReasoningPrompt(payload);

            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });

            const jsonText = extractJsonBlock(response.text || "{}");
            const parsed = JSON.parse(jsonText) as RawInsightResponse;
            return normalizeInsight(parsed) || buildFallbackInsight(eventType, details);
        } catch (error) {
            console.error("Gemini reasoning generation failed:", error);
            return buildFallbackInsight(eventType, details);
        }
    }

    async generateDailyPerformanceAnalysis(input: DailyPerformanceInput): Promise<DailyPerformanceAnalysis> {
        const fallback = buildFallbackDailyPerformanceAnalysis(input);
        if (!this.ai) {
            return fallback;
        }

        try {
            const prompt = buildDailyPerformancePrompt(input);

            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });

            const raw = JSON.parse(extractJsonBlock(response.text || "{}")) as Partial<DailyPerformanceAnalysis>;
            return normalizeDailyPerformanceAnalysis(raw, fallback);
        } catch (error) {
            console.error("Gemini daily performance generation failed:", error);
            return fallback;
        }
    }
}
