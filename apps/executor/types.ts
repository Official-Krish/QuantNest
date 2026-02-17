import type mongoose from "mongoose";

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

export interface NotificationDetails {
    symbol?: string;
    quantity?: number;
    price?: number;
    exchange?: string;
    targetPrice?: number;
    condition?: "above" | "below";
    tradeType?: "buy" | "sell";
    failureReason?: string;
}

export interface NotificationContent {
    subject: string;
    message: string;
}
