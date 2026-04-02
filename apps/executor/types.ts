import type mongoose from "mongoose";
import type { IndicatorConditionGroup } from "@quantnest-trading/types";

export interface EdgeType {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface NodeType {
    id: string;
    nodeId: string;
    type?: string | null | undefined;
    data?: {
        kind?: "action" | "trigger" | "ACTION" | "TRIGGER" | null | undefined;
        metadata?: any;
    } | null | undefined;
    position?: {
        x: number;
        y: number;
    } | null | undefined;
    Credentials?: any;
}

export type WorkflowType = {
    userId: mongoose.Types.ObjectId;
    workflowName: string;
    status?: "active" | "paused";
    triggerType?: "timer" | "price-trigger" | "conditional-trigger" | "market-session";
    triggerNodeId?: string;
    triggerConfig?: {
        intervalSeconds?: number;
        asset?: string;
        marketType?: string;
        condition?: "above" | "below";
        targetPrice?: number;
        timeWindowMinutes?: number;
        startTime?: string | Date;
        expression?: IndicatorConditionGroup;
        event?: "market-open" | "market-close" | "at-time" | "pause-at-time" | "session-window";
        triggerTime?: string;
        endTime?: string;
        [key: string]: unknown;
    };
    nextRunAt?: Date | null;
    lastTriggeredAt?: Date | null;
    lastEvaluatedAt?: Date | null;
    nodes: mongoose.Types.DocumentArray<{
        id: string;
        nodeId: string;
        type?: string | null | undefined;
        data?: {
            metadata?: any;
            kind?: "action" | "trigger" | "ACTION" | "TRIGGER" | null | undefined;
        } | null | undefined;
        position?: {
            x: number;
            y: number;
        } | null | undefined;
        Credentials?: any;
    }>;
    edges: mongoose.Types.DocumentArray<{
        id: string;
        source: string;
        target: string;
    }>;
    _id: mongoose.Types.ObjectId;
};

export type EventType = "buy" | "sell" | "price_trigger" | "trade_failed"| "Long" | "Short" | "notification";

export interface NotificationAiContext {
    triggerType?: string;
    marketType?: "Indian" | "Crypto";
    symbol?: string;
    connectedSymbols?: string[];
    targetPrice?: number;
    condition?: "above" | "below";
    timerIntervalSeconds?: number;
    evaluatedCondition?: boolean;
    expression?: IndicatorConditionGroup;
}

export interface NotificationAiInsight {
    reasoning: string;
    riskFactors: string;
    confidence: "Low" | "Medium" | "High";
    confidenceScore: number;
}

export interface NotificationDetails {
    symbol?: string;
    quantity?: number;
    price?: number;
    exchange?: string;
    targetPrice?: number;
    condition?: "above" | "below";
    tradeType?: "buy" | "sell";
    failureReason?: string;
    aiContext?: NotificationAiContext;
    aiInsight?: NotificationAiInsight;
}

export interface NotificationContent {
    subject: string;
    message: string;
}
