import { GoogleGenAI } from "@google/genai";
import type { EventType, NotificationAiInsight, NotificationDetails } from "../types";
import { indicatorEngine } from "../services/indicator.engine";
import type { IndicatorMarket, IndicatorReference } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";

const apiKey = process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface GeminiInsightResponse {
    reasoning?: string;
    riskFactors?: string;
    confidence?: string;
    confidenceScore?: number;
}

interface DailyPerformanceInput {
    workflowId: string;
    date: string;
    totalOrders: number;
    completedOrders: number;
    rejectedOrders: number;
    totalTrades: number;
    last30DayTradeCount: number;
    dayPositionCount: number;
    netPositionCount: number;
    completionRate: number;
    rejectionRate: number;
    realizedPnl: number;
    unrealizedPnl: number;
    holdingsPnl: number;
    topSymbols: Array<{ symbol: string; side: string; quantity: number; avgPrice: number }>;
    historicalContext: Array<{ symbol: string; changePct30d: number | null; lastClose: number | null }>;
    sampleFailures: string[];
}

export interface DailyPerformanceAnalysis {
    mistakes: string[];
    suggestions: string[];
    confidence: "Low" | "Medium" | "High";
    confidenceScore: number;
}

function normalizeConfidence(value: string | undefined): "Low" | "Medium" | "High" {
    const normalized = (value || "").trim().toLowerCase();
    if (normalized === "low") return "Low";
    if (normalized === "high") return "High";
    return "Medium";
}

function extractJsonBlock(text: string): string {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
        return fenced[1];
    }
    return text.trim();
}

function normalizeInsight(raw: GeminiInsightResponse): NotificationAiInsight | null {
    const reasoning = raw.reasoning?.trim();
    const riskFactors = raw.riskFactors?.trim();
    if (!reasoning || !riskFactors) {
        return null;
    }

    const score = Number(raw.confidenceScore);
    const boundedScore = Number.isFinite(score)
        ? Math.max(1, Math.min(10, Math.round(score)))
        : 5;

    return {
        reasoning,
        riskFactors,
        confidence: normalizeConfidence(raw.confidence),
        confidenceScore: boundedScore,
    };
}

function buildFallbackInsight(eventType: EventType, details: NotificationDetails): NotificationAiInsight {
    const symbol =
        details.symbol ||
        details.aiContext?.symbol ||
        details.aiContext?.connectedSymbols?.[0] ||
        "the selected market";
    const timerHint = details.aiContext?.timerIntervalSeconds
        ? `Scheduled check every ${Math.max(1, Math.round(details.aiContext.timerIntervalSeconds / 60))} minutes.`
        : "Automated workflow check completed.";
    const confidence: "Low" | "Medium" | "High" =
        details.aiContext?.expression ? "Medium" : "Low";
    const confidenceScore = confidence === "Medium" ? 6 : 4;

    const reasoning =
        eventType === "notification"
            ? `${timerHint} Monitoring context for ${symbol} has been evaluated based on your workflow configuration.`
            : `Execution update for ${symbol} was generated from workflow trigger context and latest available market data.`;

    const riskFactors =
        "Limited indicator confirmation is available for this run. Combine with stop-loss rules, market trend checks, and position sizing discipline.";

    return {
        reasoning,
        riskFactors,
        confidence,
        confidenceScore,
    };
}

function buildDefaultReferences(details: NotificationDetails): IndicatorReference[] {
    const marketType: IndicatorMarket = details.aiContext?.marketType || "Indian";
    const symbols = [
        ...(details.aiContext?.connectedSymbols || []),
        details.aiContext?.symbol,
        details.symbol,
    ].filter((symbol): symbol is string => typeof symbol === "string" && symbol.length > 0);

    const uniqueSymbols = [...new Set(symbols)];
    if (!uniqueSymbols.length) {
        const fallbackSymbol = marketType === "Crypto"
            ? SUPPORTED_WEB3_ASSETS[0]
            : SUPPORTED_INDIAN_MARKET_ASSETS[0];
        if (fallbackSymbol) {
            uniqueSymbols.push(fallbackSymbol);
        }
    }
    const refs: IndicatorReference[] = [];

    uniqueSymbols.forEach((symbol) => {
        refs.push(
            { symbol, marketType, timeframe: "5m", indicator: "price" },
            { symbol, marketType, timeframe: "5m", indicator: "volume" },
            { symbol, marketType, timeframe: "5m", indicator: "rsi", params: { period: 14 } },
            { symbol, marketType, timeframe: "5m", indicator: "ema", params: { period: 20 } },
            { symbol, marketType, timeframe: "5m", indicator: "ema", params: { period: 50 } },
            { symbol, marketType, timeframe: "15m", indicator: "ema", params: { period: 20 } },
            { symbol, marketType, timeframe: "15m", indicator: "ema", params: { period: 50 } },
            { symbol, marketType, timeframe: "5m", indicator: "pct_change", params: { period: 3 } },
        );
    });

    return refs;
}

export async function generateTradeReasoning(eventType: EventType, details: NotificationDetails): Promise<NotificationAiInsight> {
    if (!ai) {
        return buildFallbackInsight(eventType, details);
    }

    try {
        let indicatorSnapshot: unknown[] = [];
        const defaultReferences = buildDefaultReferences(details);

        if (details.aiContext?.expression) {
            indicatorEngine.registerExpression(details.aiContext.expression);
            indicatorEngine.registerReferences(defaultReferences);
            await indicatorEngine.refreshSubscribedSymbols();
            const expressionSnapshot = await indicatorEngine.getExpressionSnapshot(details.aiContext.expression);
            const defaultSnapshot = await indicatorEngine.getSnapshotForReferences(defaultReferences);
            const merged = new Map<string, unknown>();
            [...expressionSnapshot, ...defaultSnapshot].forEach((entry: any) => {
                merged.set(
                    `${entry.marketType}:${entry.symbol}:${entry.timeframe}:${entry.indicator}:${entry.period || ""}`,
                    entry,
                );
            });
            indicatorSnapshot = [...merged.values()];
        } else if (defaultReferences.length) {
            indicatorEngine.registerReferences(defaultReferences);
            await indicatorEngine.refreshSubscribedSymbols();
            indicatorSnapshot = await indicatorEngine.getSnapshotForReferences(defaultReferences);
        }

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

        const prompt = [
            "You are a trading assistant for notifications.",
            "Given the JSON payload, explain setup briefly and responsibly.",
            "Return STRICT JSON only with keys:",
            "{\"reasoning\":\"string\",\"riskFactors\":\"string\",\"confidence\":\"Low|Medium|High\",\"confidenceScore\":1-10}",
            "Constraints:",
            "- Keep reasoning + riskFactors concise; total under 120 words.",
            "- Mention key indicators only if present in payload.",
            "- Be factual. No guarantees.",
            "",
            JSON.stringify(payload),
        ].join("\n");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const jsonText = extractJsonBlock(response.text!);
        const parsed = JSON.parse(jsonText) as GeminiInsightResponse;
        return normalizeInsight(parsed) || buildFallbackInsight(eventType, details);
    } catch (error) {
        console.error("Gemini reasoning generation failed:", error);
        return buildFallbackInsight(eventType, details);
    }
}

export async function generateDailyPerformanceAnalysis(
    input: DailyPerformanceInput,
): Promise<DailyPerformanceAnalysis> {
    const hasHealthyCompletion = input.completionRate >= 70 && input.rejectionRate <= 10;
    const fallback: DailyPerformanceAnalysis = {
        mistakes: input.sampleFailures.length
            ? input.sampleFailures.slice(0, 3)
            : ["Review rejected orders and low-conviction entries from the last 30 days."],
        suggestions: [
            "Tighten entry filters for symbols with repeated rejections or low follow-through.",
            "Reduce size on setups where realised PnL has been inconsistent.",
            "Align trades with higher timeframe direction before opening new positions.",
        ],
        confidence: hasHealthyCompletion ? "High" : input.completionRate >= 50 ? "Medium" : "Low",
        confidenceScore: hasHealthyCompletion ? 8 : input.completionRate >= 50 ? 6 : 4,
    };

    if (!ai) {
        return fallback;
    }

    try {
        const prompt = [
            "You are a trading performance analyst.",
            "Given daily workflow stats, return STRICT JSON only.",
            "Schema:",
            "{\"mistakes\":[\"string\"],\"suggestions\":[\"string\"],\"confidence\":\"Low|Medium|High\",\"confidenceScore\":1-10}",
            "Rules:",
            "- Keep each bullet short and practical.",
            "- mistakes max 3 items; suggestions max 3 items.",
            "- No markdown, no extra keys.",
            "",
            JSON.stringify(input),
        ].join("\n");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const raw = JSON.parse(extractJsonBlock(response.text || "{}")) as Partial<DailyPerformanceAnalysis>;
        const mistakes = Array.isArray(raw.mistakes)
            ? raw.mistakes.map((m) => String(m).trim()).filter(Boolean).slice(0, 3)
            : [];
        const suggestions = Array.isArray(raw.suggestions)
            ? raw.suggestions.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
            : [];
        const score = Number(raw.confidenceScore);

        return {
            mistakes: mistakes.length ? mistakes : fallback.mistakes,
            suggestions: suggestions.length ? suggestions : fallback.suggestions,
            confidence: normalizeConfidence(raw.confidence),
            confidenceScore: Number.isFinite(score) ? Math.max(1, Math.min(10, Math.round(score))) : fallback.confidenceScore,
        };
    } catch (error) {
        console.error("Gemini daily performance generation failed:", error);
        return fallback;
    }
}
