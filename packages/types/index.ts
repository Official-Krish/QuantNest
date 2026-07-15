import type { IndicatorConditionGroup, IndicatorMarket } from "./indicators";

export type NodeKind =
  | "price"
  | "timer"
  | "breakout-retest-trigger"
  | "conditional-trigger"
  | "market-session"
  | "portfolio-pnl-drawdown-trigger"
  | "if"
  | "filter"
  | "recheck"
  | "delay"
  | "merge"
  | "Zerodha"
  | "Groww"
  | "gmail"
  | "slack"
  | "telegram"
  | "whatsapp"
  | "discord"
  | "notion-daily-report"
  | "google-drive-daily-csv"
  | "google-sheets-report"
  | "postgres";

export interface NodeType {
  type: NodeKind;
  data: {
    kind: "action" | "trigger";
    metadata: NodeMetadata;
  };
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

export type NodeMetadata =
  | TradingMetadata
  | TimerNodeMetadata
  | PriceTriggerNodeMetadata
  | BreakoutRetestTriggerMetadata
  | MarketSessionTriggerNodeMetadata
  | PortfolioPnlDrawdownTriggerMetadata
  | NotificationMetadata
  | DelayNodeMetadata
  | MergeNodeMetadata
  | LighterMetadata
  | IfNodeMetadata
  | FilterNodeMetadata
  | RecheckNodeMetadata
  | ConditionalTriggerMetadata
  | NotionDailyReportMetadata
  | GoogleDriveDailyCsvMetadata
  | GoogleSheetsReportMetadata
  | PostgresMetadata
  | Record<string, unknown>;

export interface DelayNodeMetadata {
  durationSeconds: number;
  condition?: boolean;
}

export interface MergeNodeMetadata {
  condition?: boolean;
}

export interface IfNodeMetadata {
  condition?: "above" | "below";
  targetPrice?: number;
  marketType?: "indian" | "web3" | IndicatorMarket;
  asset?:
    | (typeof SUPPORTED_INDIAN_MARKET_ASSETS)[number]
    | (typeof SUPPORTED_WEB3_ASSETS)[number]
    | string;
  timeWindowMinutes?: number;
  startTime?: Date;
  expression?: IndicatorConditionGroup;
}

export interface FilterNodeMetadata {
  condition?: "above" | "below";
  targetPrice?: number;
  marketType?: "indian" | "web3" | IndicatorMarket;
  asset?:
    | (typeof SUPPORTED_INDIAN_MARKET_ASSETS)[number]
    | (typeof SUPPORTED_WEB3_ASSETS)[number]
    | string;
  timeWindowMinutes?: number;
  startTime?: Date;
  expression?: IndicatorConditionGroup;
}

export interface RecheckNodeMetadata {
  durationSeconds: number;
  recheckMode?: "trigger" | "custom";
  condition?: "above" | "below";
  targetPrice?: number;
  marketType?: "indian" | "web3" | IndicatorMarket;
  asset?:
    | (typeof SUPPORTED_INDIAN_MARKET_ASSETS)[number]
    | (typeof SUPPORTED_WEB3_ASSETS)[number]
    | string;
  timeWindowMinutes?: number;
  startTime?: Date;
  expression?: IndicatorConditionGroup;
}

export interface ConditionalTriggerMetadata {
  condition?: "above" | "below";
  targetPrice?: number;
  marketType?: "indian" | "web3" | IndicatorMarket;
  asset?:
    | (typeof SUPPORTED_INDIAN_MARKET_ASSETS)[number]
    | (typeof SUPPORTED_WEB3_ASSETS)[number]
    | string;
  timeWindowMinutes?: number;
  startTime?: Date;
  expression?: IndicatorConditionGroup;
}

export interface TimerNodeMetadata {
  time: number;
  marketType: "indian" | "web3";
  asset?: string;
}

export interface PriceTriggerNodeMetadata {
  asset: string;
  targetPrice?: number;
  marketType: "indian" | "web3";
  condition?: "above" | "below";
  mode?: "threshold" | "change";
  changeType?: "absolute" | "percent";
  changeDirection?: "increase" | "decrease";
  changeValue?: number;
  changeWindowMinutes?: number;
}

export interface BreakoutRetestTriggerMetadata {
  asset: string;
  marketType: "indian" | "web3";
  direction: "bullish" | "bearish";
  breakoutLevel: number;
  retestTolerancePct: number;
  confirmationMovePct: number;
  retestWindowMinutes: number;
  confirmationWindowMinutes: number;
}

export interface MarketSessionTriggerNodeMetadata {
  marketType: "indian" | "web3";
  event:
    | "market-open"
    | "market-close"
    | "at-time"
    | "pause-at-time"
    | "session-window";
  triggerTime?: string; // HH:MM format, required for time-based events
  endTime?: string; // HH:MM format, required for session-window events
}

export interface PortfolioPnlDrawdownTriggerMetadata {
  broker: "zerodha" | "groww" | "lighter";
  mode: "daily-loss-cap" | "profit-target" | "drawdown-limit";
  thresholdValue: number;
  thresholdUnit: "absolute" | "percent";
  secretId?: string;
  apiKey?: string;
  accessToken?: string;
  accountIndex?: number;
  apiKeyIndex?: number;
}

export interface TradingMetadata {
  type: "buy" | "sell" | "long" | "short";
  qty: number;
  symbol: (typeof SUPPORTED_INDIAN_MARKET_ASSETS)[number];
  apiKey: string;
  accessToken: string;
  secretId?: string;
  exchange: "NSE" | "BSE";
  condition?: boolean;
  retryPolicy?: RetryPolicyMetadata;
}

export interface NotificationMetadata {
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  webhookUrl?: string;
  slackBotToken?: string;
  slackUserId?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  secretId?: string;
  condition?: boolean;
  retryPolicy?: RetryPolicyMetadata;
}

export interface NotionDailyReportMetadata {
  notionApiKey: string;
  parentPageId: string;
  secretId?: string;
  aiConsent: boolean;
  condition?: boolean;
  retryPolicy?: RetryPolicyMetadata;
}

export interface GoogleDriveDailyCsvMetadata {
  googleClientEmail: string;
  googlePrivateKey: string;
  googleDriveFolderId?: string;
  filePrefix?: string;
  secretId?: string;
  aiConsent?: boolean;
  condition?: boolean;
  retryPolicy?: RetryPolicyMetadata;
}

export interface GoogleSheetsReportMetadata {
  sheetUrl: string;
  sheetId?: string;
  sheetName?: string;
  serviceAccountEmail?: string;
  condition?: boolean;
  retryPolicy?: RetryPolicyMetadata;
}

export interface LighterMetadata {
  type: "long" | "short";
  qty: number;
  symbol: (typeof SUPPORTED_WEB3_ASSETS)[number];
  apiKey: string;
  accountIndex: number;
  apiKeyIndex: number;
  secretId?: string;
  condition?: boolean;
  retryPolicy?: RetryPolicyMetadata;
}

export interface PostgresMetadata {
  connectionString: string;
  tableName: string;
  jsonPayload?: string;
  retryPolicy?: RetryPolicyMetadata;
}

export interface RetryPolicyMetadata {
  enabled?: boolean;
  maxAttempts?: number;
  backoffType?: "fixed" | "exponential";
  delaySeconds?: number;
  onFinalFailure?: "fail-workflow" | "continue";
}

export type WorkflowExecutionMode = "live" | "dry-run";

export const SUPPORTED_MARKETS = ["Indian", "Crypto"];

export const SUPPORTED_INDIAN_MARKET_ASSETS = [
  "CDSL",
  "HDFC",
  "TCS",
  "INFY",
  "RELIANCE",
];
export const assetMapped: Record<string, string> = {
  CDSL: "CDSL.NS",
  HDFC: "HDFCBANK.NS",
  TCS: "TCS.NS",
  INFY: "INFY.NS",
  RELIANCE: "RELIANCE.NS",
};
export const assetCompanyName: Record<string, string> = {
  CDSL: "Central-Depository-Services-(India)-Limited",
  HDFC: "HDFC-Bank-Limited",
  TCS: "Tata-Consultancy-Services-Limited",
  INFY: "Infosys-Limited",
  RELIANCE: "Reliance Industries Limited",
};

export const SUPPORTED_WEB3_ASSETS = ["ETH", "BTC", "SOL"];

export interface ExecutionStep {
  step: number;
  nodeId: string;
  nodeType: string;
  status: "Success" | "Failed";
  message: string;
  attempt?: number;
  maxAttempts?: number;
  retryPolicy?: RetryPolicyMetadata;
  backoffType?: "fixed" | "exponential";
  backoffSeconds?: number;
  terminalFailure?: boolean;
  simulated?: boolean;
  simulatedPayload?: Record<string, unknown>;
}

export interface ExecutionResponseType {
  steps: ExecutionStep[];
  status: "Success" | "Failed" | "InProgress";
}

// ---- Execution Trace types (for debugger) ----

export interface IndicatorSnapshotEntry {
  symbol: string;
  marketType: string;
  timeframe: string;
  indicator: string;
  period?: number;
  value: number | null;
}

export interface TriggerEvaluationSnapshot {
  triggerType: string;
  symbol?: string;
  marketType?: string;
  targetPrice?: number;
  condition?: string;
  evaluatedCondition?: boolean;
  currentPrice?: number | null;
  indicatorSnapshot?: IndicatorSnapshotEntry[];
  expression?: IndicatorConditionGroup;
  crossoverPair?: { left: number | null; right: number | null };
  baselinePrice?: number | null;
  priceChange?: number | null;
  priceChangePercent?: number | null;
  breakoutStage?: string;
  isInRetestZone?: boolean;
  sessionEvent?: string;
  sessionTriggered?: boolean;
}

export interface ExecutionTraceBranchDecision {
  nodeId: string;
  nodeType: string;
  evaluatedCondition: boolean;
  selectedBranch: string | null;
  availableBranches: string[];
}

export interface ExecutionTraceNodeEntry {
  nodeId: string;
  nodeType: string;
  nodeKind: "trigger" | "action";
  status: "Success" | "Failed" | "Skipped";
  triggerSnapshot?: TriggerEvaluationSnapshot;
  branchDecision?: ExecutionTraceBranchDecision;
  resolvedMetadata?: Record<string, unknown>;
  message?: string;
}

export interface ExecutionTrace {
  executionId: string;
  workflowId: string;
  userId: string;
  trigger: TriggerEvaluationSnapshot;
  nodes: ExecutionTraceNodeEntry[];
  branchDecisions: ExecutionTraceBranchDecision[];
  marketDataSnapshot?: Record<string, unknown>;
  startTime: Date;
  endTime?: Date;
}

export * from "./indicators";
