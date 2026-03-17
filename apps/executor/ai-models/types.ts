import type { EventType, NotificationAiInsight, NotificationDetails } from "../types";
import type {
    DailyPerformanceAnalysis,
    DailyPerformanceInput,
} from "@quantnest-trading/types/ai";

export interface AiReasoningProvider {
    readonly name: string;
    generateTradeReasoning(eventType: EventType, details: NotificationDetails): Promise<NotificationAiInsight>;
    generateDailyPerformanceAnalysis(input: DailyPerformanceInput): Promise<DailyPerformanceAnalysis>;
}

export type { DailyPerformanceAnalysis, DailyPerformanceInput };
