import type { IndicatorConditionGroup, IndicatorMarket } from "./indicators";

export type NodeKind = "price" | "timer" | "conditional-trigger" | "Zerodha" | "Groww" | "gmail" | "discord";

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
    sourceHandle?: string;
    targetHandle?: string;
}

export type NodeMetadata = TradingMetadata | TimerNodeMetadata | PriceTriggerNodeMetadata | NotificationMetadata | LighterMetadata | ConditionalTriggerMetadata | {};

export interface ConditionalTriggerMetadata {
    condition?: "above" | "below";
    targetPrice?: number;
    marketType?: "indian" | "web3" | IndicatorMarket;
    asset?: typeof SUPPORTED_INDIAN_MARKET_ASSETS[number] | typeof SUPPORTED_WEB3_ASSETS[number] | string;
    timeWindowMinutes?: number;
    startTime?: Date;
    expression?: IndicatorConditionGroup;
}

export interface TimerNodeMetadata {
    time: number;
    marketType: "indian" | "web3";
    
}

export interface PriceTriggerNodeMetadata {
    asset: string;
    targetPrice: number;
    marketType: "indian" | "web3";
    condition: "above" | "below";
}

export interface TradingMetadata {
    type: "buy" | "sell" | "long" | "short";
    qty: number;
    symbol: typeof SUPPORTED_INDIAN_MARKET_ASSETS[number];
    apiKey: string;
    accessToken: string;
    exchange: "NSE" | "BSE";
    condition?: boolean;
}

export interface NotificationMetadata {
    recipientName: string;
    recipientEmail?: string;
    webhookUrl?: string;
    condition?: boolean;
}

export interface LighterMetadata {
    type: "long" | "short";
    qty: number;
    symbol: typeof SUPPORTED_WEB3_ASSETS[number];
    apiKey: string;
    accountIndex: number;
    apiKeyIndex: number;
    condition?: boolean;
}

export const SUPPORTED_MARKETS = ["Indian", "Crypto"];

export const SUPPORTED_INDIAN_MARKET_ASSETS = ["CDSL", "HDFC", "TCS", "INFY", "RELIANCE"];
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

export const SUPPORTED_WEB3_ASSETS = ["ETH", "BTC", "SOL"];

export interface ExecutionStep {
    step: number;
    nodeId: string;
    nodeType: string;
    status: "Success" | "Failed";
    message: string;
}

export interface ExecutionResponseType {
    steps: ExecutionStep[];
    status: "Success" | "Failed" | "InProgress";
}

export * from "./indicators";
