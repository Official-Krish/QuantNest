import type { EventType, NotificationAiInsight, NotificationDetails } from "../types";
import type { DailyPerformanceAnalysis, DailyPerformanceInput } from "./types";

export function buildFallbackInsight(eventType: EventType, details: NotificationDetails): NotificationAiInsight {
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

export function buildFallbackDailyPerformanceAnalysis(input: DailyPerformanceInput): DailyPerformanceAnalysis {
    const hasHealthyCompletion = input.completionRate >= 70 && input.rejectionRate <= 10;
    return {
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
}
