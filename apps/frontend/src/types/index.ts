export type NodeKind = "price-trigger" | "timer-trigger" | "zerodha" | "Groww";

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

export type NodeMetadata = any;

export interface TimerNodeMetadata extends NodeMetadata {
    time: number;
}

export interface PriceTriggerNodeMetadata {
    asset: string;
    targetPrice: number;
    condition: "above" | "below";
}