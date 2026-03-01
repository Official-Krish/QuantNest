import type { EventType, NotificationAiInsight, NotificationDetails } from "../types";

export interface DailyPerformanceInput {
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

export interface AiReasoningProvider {
    readonly name: string;
    generateTradeReasoning(eventType: EventType, details: NotificationDetails): Promise<NotificationAiInsight>;
    generateDailyPerformanceAnalysis(input: DailyPerformanceInput): Promise<DailyPerformanceAnalysis>;
}
