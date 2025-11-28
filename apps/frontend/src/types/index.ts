export type NodeKind = "price-trigger" | "timer-trigger" | "zerodha" | "Groww";

export interface NodeType {
    data: {
        type: "action" | "trigger";
        kind: NodeKind;
        metadata: NodeMetadata;
        label: string;
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