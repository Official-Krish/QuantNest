import type { NodeKind } from "./index";

export type AiProviderName = "gemini" | "openai" | "anthropic";

export type AiModelCapability =
  | "trade-reasoning"
  | "daily-performance-analysis"
  | "strategy-builder";

export interface AiModelRequestOptions {
  provider?: AiProviderName | string;
  model?: string;
}

export interface AiModelDescriptor {
  id: string;
  provider: AiProviderName | string;
  label: string;
  capabilities: AiModelCapability[];
  recommended?: boolean;
}

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
  topSymbols: Array<{
    symbol: string;
    side: string;
    quantity: number;
    avgPrice: number;
  }>;
  historicalContext: Array<{
    symbol: string;
    changePct30d: number | null;
    lastClose: number | null;
  }>;
  sampleFailures: string[];
}

export interface DailyPerformanceAnalysis {
  mistakes: string[];
  suggestions: string[];
  confidence: "Low" | "Medium" | "High";
  confidenceScore: number;
}

export type StrategyBuilderMarket = "Indian" | "Crypto";
export type StrategyBuilderGoal =
  | "alerts"
  | "execution"
  | "reporting"
  | "journaling";
export type StrategyRiskPreference =
  | "conservative"
  | "balanced"
  | "aggressive";

export type StrategyBuilderActionType =
  | "zerodha"
  | "groww"
  | "lighter"
  | "gmail"
  | "discord"
  | "whatsapp"
  | "notion-daily-report"
  | "google-drive-daily-csv";

export interface AiStrategyBuilderRequest {
  prompt: string;
  market: StrategyBuilderMarket;
  goal: StrategyBuilderGoal;
  riskPreference?: StrategyRiskPreference;
  brokerExecution?: boolean;
  allowDirectExecution?: boolean;
  preferredActions?: StrategyBuilderActionType[];
  constraints?: string[];
  model?: AiModelRequestOptions;
  allowedNodeTypes?: Array<NodeKind | Lowercase<NodeKind>>;
}

export interface AiWorkflowDraftNode {
  nodeId: string;
  type: NodeKind | Lowercase<NodeKind> | string;
  data: {
    kind: "action" | "trigger";
    metadata: Record<string, unknown>;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface AiWorkflowDraftEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface AiStrategyMissingInput {
  nodeId: string;
  nodeType: string;
  field: string;
  label: string;
  reason: string;
  required: boolean;
  secret?: boolean;
}

export interface AiStrategyWarning {
  code: string;
  message: string;
}

export interface AiStrategyWorkflowPlan {
  workflowName: string;
  summary: string;
  marketType: StrategyBuilderMarket;
  nodes: AiWorkflowDraftNode[];
  edges: AiWorkflowDraftEdge[];
  assumptions: string[];
  warnings: AiStrategyWarning[];
  missingInputs: AiStrategyMissingInput[];
}

export interface AiStrategyBuilderResponse {
  provider: string;
  model: string;
  plan: AiStrategyWorkflowPlan;
}
