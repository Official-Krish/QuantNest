export type NodeKind = "price-trigger" | "timer-trigger" | "Zerodha" | "Groww";

export interface NodeType {
    type: NodeKind;
    data: {
        kind: "action" | "trigger";
        metadata: NodeMetadata;
    },
    id: string;
    position: { x: number; y: number }; 
}

export interface EdgeType {
    id: string;
    source: string;
    target: string;
}

export type NodeMetadata = TradingMetadata | TimerNodeMetadata | PriceTriggerNodeMetadata | {};

export interface TimerNodeMetadata {
    time: number;
}

export interface PriceTriggerNodeMetadata {
    asset: string;
    targetPrice: number;
    condition: "above" | "below";
}

export interface TradingMetadata {
    type: "buy" | "sell";
    qty: number;
    symbol: typeof SUPPORTED_ASSETS[number];
}

export const SUPPORTED_ASSETS = ["CDSL", "HDFC", "TCS", "INFY", "RELIANCE"];