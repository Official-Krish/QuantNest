export type NodeKind = "price" | "timer" | "Zerodha" | "Groww";

export interface NodeType {
    type: NodeKind;
    data: {
        kind: "action" | "trigger";
        metadata: NodeMetadata;
    },
    nodeId: string;
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
    apiKey: string;
    accessToken: string;
    exchange: "NSE" | "BSE";
}

export const SUPPORTED_ASSETS = ["CDSL", "HDFC", "TCS", "INFY", "RELIANCE"];
export const assetMapped: Record<string, string> = {
    "CDSL": "CDSL",
    "HDFC": "HDFCBANK",
    "TCS": "TCS",
    "INFY": "INFY",
    "RELIANCE": "RELIANCE"
};
export const assetCompanyName: Record<string, string> = {
    "CDSL": "Central-Depository-Services-(India)-Limited",
    "HDFC": "HDFC-Bank-Limited",
    "TCS": "Tata-Consultancy-Services-Limited",
    "INFY": "Infosys-Limited",
    "RELIANCE": "Reliance Industries Limited"
};