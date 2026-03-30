import { z } from "zod";
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
  | "delay"
  | "if"
  | "filter"
  | "merge"
  | "gmail"
  | "slack"
  | "telegram"
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

export interface AiStrategyValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodeId?: string;
  field?: string;
}

export interface AiStrategyValidationReport {
  canOpenInBuilder: boolean;
  triggerCount: number;
  branchCount: number;
  missingInputsCount: number;
  issues: AiStrategyValidationIssue[];
}

export interface AiStrategyBuilderResponse {
  provider: string;
  model: string;
  plan: AiStrategyWorkflowPlan;
  validation: AiStrategyValidationReport;
}

export interface AiStrategyWorkflowVersion {
  id: string;
  label: string;
  createdAt: string;
  prompt: string;
  instruction?: string;
  response: AiStrategyBuilderResponse;
}

export interface AiStrategyDraftEditEntry {
  id: string;
  instruction: string;
  createdAt: string;
}

export interface AiStrategyConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  kind: "prompt" | "edit" | "result" | "validation" | "system";
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AiStrategySetupState {
  workflowName?: string;
  metadataOverrides?: Record<string, Record<string, unknown>>;
}

export interface AiStrategyDraftSession {
  draftId: string;
  title: string;
  status: "draft" | "needs-inputs" | "ready" | "archived";
  createdAt: string;
  updatedAt: string;
  request: AiStrategyBuilderRequest;
  response: AiStrategyBuilderResponse;
  edits: AiStrategyDraftEditEntry[];
  messages: AiStrategyConversationMessage[];
  workflowVersions: AiStrategyWorkflowVersion[];
  setupState?: AiStrategySetupState;
  setupStateByVersionId?: Record<string, AiStrategySetupState>;
  workflowId?: string;
}

export interface AiStrategyDraftVersionPayload {
  draftId: string;
  version: AiStrategyWorkflowVersion;
  setupState?: AiStrategySetupState;
}

export interface AiStrategyDraftSummary {
  draftId: string;
  title: string;
  status: AiStrategyDraftSession["status"];
  updatedAt: string;
  createdAt: string;
  workflowId?: string;
  lastMessage?: string;
}

export interface AiStrategyDraftCreateResponse {
  draft: AiStrategyDraftSession;
}

export interface AiStrategyDraftEditRequest {
  instruction: string;
  model?: AiModelRequestOptions;
}

export const AI_NODE_KIND_VALUES = [
  "timer",
  "price",
  "conditional-trigger",
  "if",
  "filter",
  "delay",
  "merge",
  "Zerodha",
  "Groww",
  "gmail",
  "slack",
  "telegram",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
] as const;

export const AI_ALLOWED_NODE_TYPE_VALUES = [...AI_NODE_KIND_VALUES, "zerodha", "groww"] as const;

export const AI_PREFERRED_ACTION_VALUES = [
  "zerodha",
  "groww",
  "lighter",
  "delay",
  "if",
  "filter",
  "merge",
  "gmail",
  "slack",
  "telegram",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
] as const;

export const strategyNodeKindSchema = z.enum(AI_NODE_KIND_VALUES);
export const strategyAllowedNodeTypeSchema = z.enum(AI_ALLOWED_NODE_TYPE_VALUES);

export const aiModelRequestOptionsSchema = z.object({
  provider: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
}) satisfies z.ZodType<AiModelRequestOptions>;

export const strategyBuilderRequestSchema = z.object({
  prompt: z.string().trim().min(12, "Prompt must be at least 12 characters."),
  market: z.enum(["Indian", "Crypto"]),
  goal: z.enum(["alerts", "execution", "reporting", "journaling"]),
  riskPreference: z.enum(["conservative", "balanced", "aggressive"]).optional(),
  brokerExecution: z.boolean().optional(),
  allowDirectExecution: z.boolean().optional(),
  preferredActions: z.array(z.enum(AI_PREFERRED_ACTION_VALUES)).optional(),
  constraints: z.array(z.string().trim().min(1)).optional(),
  model: aiModelRequestOptionsSchema.optional(),
  allowedNodeTypes: z.array(strategyAllowedNodeTypeSchema).optional(),
}) satisfies z.ZodType<AiStrategyBuilderRequest>;

export const aiWorkflowDraftNodeSchema = z.object({
  nodeId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  data: z.object({
    kind: z.enum(["trigger", "action"]),
    metadata: z.record(z.string(), z.unknown()).default({}),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
}) satisfies z.ZodType<AiWorkflowDraftNode>;

export const aiWorkflowDraftEdgeSchema = z.object({
  id: z.string().trim().min(1),
  source: z.string().trim().min(1),
  target: z.string().trim().min(1),
  sourceHandle: z.string().trim().min(1).optional(),
  targetHandle: z.string().trim().min(1).optional(),
}) satisfies z.ZodType<AiWorkflowDraftEdge>;

export const aiStrategyMissingInputSchema = z.object({
  nodeId: z.string().trim().min(1),
  nodeType: z.string().trim().min(1),
  field: z.string().trim().min(1),
  label: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  required: z.boolean(),
  secret: z.boolean().optional(),
}) satisfies z.ZodType<AiStrategyMissingInput>;

export const aiStrategyWarningSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
}) satisfies z.ZodType<AiStrategyWarning>;

export const aiStrategyWorkflowPlanSchema = z.object({
  workflowName: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(12).max(500),
  marketType: z.enum(["Indian", "Crypto"]),
  nodes: z.array(aiWorkflowDraftNodeSchema).min(1).max(16),
  edges: z.array(aiWorkflowDraftEdgeSchema).max(24),
  assumptions: z.array(z.string().trim().min(1)).max(12),
  warnings: z.array(aiStrategyWarningSchema),
  missingInputs: z.array(aiStrategyMissingInputSchema),
}) satisfies z.ZodType<AiStrategyWorkflowPlan>;

export const aiStrategyValidationIssueSchema = z.object({
  severity: z.enum(["error", "warning"]),
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  nodeId: z.string().trim().min(1).optional(),
  field: z.string().trim().min(1).optional(),
}) satisfies z.ZodType<AiStrategyValidationIssue>;

export const aiStrategyValidationReportSchema = z.object({
  canOpenInBuilder: z.boolean(),
  triggerCount: z.number().int().min(0),
  branchCount: z.number().int().min(0),
  missingInputsCount: z.number().int().min(0),
  issues: z.array(aiStrategyValidationIssueSchema),
}) satisfies z.ZodType<AiStrategyValidationReport>;

export const aiStrategyBuilderResponseSchema = z.object({
  provider: z.string().trim().min(1),
  model: z.string().trim().min(1),
  plan: aiStrategyWorkflowPlanSchema,
  validation: aiStrategyValidationReportSchema,
}) satisfies z.ZodType<AiStrategyBuilderResponse>;

export const aiStrategyDraftEditEntrySchema = z.object({
  id: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
}) satisfies z.ZodType<AiStrategyDraftEditEntry>;

export const aiStrategyWorkflowVersionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  instruction: z.string().trim().min(1).optional(),
  response: aiStrategyBuilderResponseSchema,
}) satisfies z.ZodType<AiStrategyWorkflowVersion>;

export const aiStrategyConversationMessageSchema = z.object({
  id: z.string().trim().min(1),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  kind: z.enum(["prompt", "edit", "result", "validation", "system"]),
  createdAt: z.string().trim().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
}) satisfies z.ZodType<AiStrategyConversationMessage>;

export const aiStrategySetupStateSchema = z.object({
  workflowName: z.string().trim().min(1).optional(),
  metadataOverrides: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
}) satisfies z.ZodType<AiStrategySetupState>;

export const aiStrategyDraftSessionSchema = z.object({
  draftId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  status: z.enum(["draft", "needs-inputs", "ready", "archived"]),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  request: strategyBuilderRequestSchema,
  response: aiStrategyBuilderResponseSchema,
  edits: z.array(aiStrategyDraftEditEntrySchema),
  messages: z.array(aiStrategyConversationMessageSchema),
  workflowVersions: z.array(aiStrategyWorkflowVersionSchema).default([]),
  setupState: z.preprocess(
    (value) => (value === null ? undefined : value),
    aiStrategySetupStateSchema.optional(),
  ),
  setupStateByVersionId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.record(z.string(), aiStrategySetupStateSchema).optional(),
  ),
  workflowId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
}) satisfies z.ZodType<AiStrategyDraftSession>;

export const aiStrategyDraftVersionPayloadSchema = z.object({
  draftId: z.string().trim().min(1),
  version: aiStrategyWorkflowVersionSchema,
  setupState: z.preprocess(
    (value) => (value === null ? undefined : value),
    aiStrategySetupStateSchema.optional(),
  ),
}) satisfies z.ZodType<AiStrategyDraftVersionPayload>;

export const aiStrategyDraftSummarySchema = z.object({
  draftId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  status: z.enum(["draft", "needs-inputs", "ready", "archived"]),
  updatedAt: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  workflowId: z.string().trim().min(1).optional(),
  lastMessage: z.string().optional(),
}) satisfies z.ZodType<AiStrategyDraftSummary>;

export const aiStrategyDraftCreateResponseSchema = z.object({
  draft: aiStrategyDraftSessionSchema,
}) satisfies z.ZodType<AiStrategyDraftCreateResponse>;

export const aiStrategyDraftEditRequestSchema = z.object({
  instruction: z.string().trim().min(4),
  model: aiModelRequestOptionsSchema.optional(),
}) satisfies z.ZodType<AiStrategyDraftEditRequest>;
