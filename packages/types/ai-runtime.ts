import { z } from "zod";

export const OutputFieldSchema = z.object({
  fieldName: z.string().trim().min(1, "Field name is required"),
  choices: z
    .array(z.string().trim().min(1))
    .min(1, "At least one choice is required"),
});

export const ReasoningStepSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().trim().min(1),
  reasoning: z.string().trim().min(1),
  conclusion: z.string().optional(),
});

export const AIDecisionMetadataSchema = z.object({
  provider: z.enum(["gemini", "openclaw"]).default("gemini"),
  systemPrompt: z.string().default(""),
  outputSchema: z.array(OutputFieldSchema).default([]),
  model: z.string().default("gemini-2.5-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(8192).default(512),
  role: z.string().trim().min(1).default("analyst"),
  contextDepth: z.number().int().min(1).max(10).default(3),
  secretId: z.string().optional(),
  minConfidence: z.number().min(0).max(1).default(0),
  enableTools: z.boolean().default(false),
  approvalRequired: z.boolean().default(false),
  approvalPrompt: z.string().optional(),
  reasoningEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  memoryTtl: z.number().int().min(1).max(8760).default(24),
});

export const AIDecisionResultSchema = z
  .object({
    decision: z.string().trim().min(1, "Decision is required"),
    confidence: z.number().min(0).max(1),
    reason: z.string().trim().min(1, "Reason is required"),
    reasoningSteps: z.array(ReasoningStepSchema).optional(),
  })
  .passthrough();

export const AIClassifyMetadataSchema = z.object({
  provider: z.enum(["gemini", "openclaw"]).default("gemini"),
  systemPrompt: z.string().default(""),
  labels: z.array(z.string().trim().min(1)).default([]),
  model: z.string().default("gemini-2.5-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(8192).default(512),
  contextDepth: z.number().int().min(1).max(10).default(3),
  minConfidence: z.number().min(0).max(1).default(0),
  maxCostPerExecution: z.number().min(0).max(100).default(0),
  monthlyBudget: z.number().min(0).max(10000).default(0),
  approvalRequired: z.boolean().default(false),
  approvalPrompt: z.string().optional(),
  reasoningEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  memoryTtl: z.number().int().min(1).max(8760).default(24),
});

export const AIClassifyResultSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  confidence: z.number().min(0).max(1),
  reasoningSteps: z.array(ReasoningStepSchema).optional(),
});

export const AIExtractMetadataSchema = z.object({
  provider: z.enum(["gemini", "openclaw"]).default("gemini"),
  systemPrompt: z.string().default(""),
  fields: z.array(z.string().trim().min(1)).default([]),
  model: z.string().default("gemini-2.5-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(8192).default(512),
  contextDepth: z.number().int().min(1).max(10).default(3),
  maxCostPerExecution: z.number().min(0).max(100).default(0),
  monthlyBudget: z.number().min(0).max(10000).default(0),
  approvalRequired: z.boolean().default(false),
  approvalPrompt: z.string().optional(),
  reasoningEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  memoryTtl: z.number().int().min(1).max(8760).default(24),
});

export const AIExtractResultSchema = z.record(z.string(), z.unknown());

export const AIGenerateMetadataSchema = z.object({
  provider: z.enum(["gemini", "openclaw"]).default("gemini"),
  systemPrompt: z.string().default(""),
  model: z.string().default("gemini-2.5-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(8192).default(512),
  contextDepth: z.number().int().min(1).max(10).default(3),
  enableTools: z.boolean().default(false),
  maxCostPerExecution: z.number().min(0).max(100).default(0),
  monthlyBudget: z.number().min(0).max(10000).default(0),
  approvalRequired: z.boolean().default(false),
  approvalPrompt: z.string().optional(),
  reasoningEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  memoryTtl: z.number().int().min(1).max(8760).default(24),
});

export const AIGenerateResultSchema = z.object({
  summary: z.string().trim().min(1, "Summary is required"),
  analysis: z.string().optional(),
  reasoningSteps: z.array(ReasoningStepSchema).optional(),
});

export const PipelineRiskLimitsSchema = z
  .object({
    maxOrderAmount: z.number().nonnegative().optional(),
    maxQty: z.number().nonnegative().optional(),
    maxSlippageBps: z.number().int().nonnegative().optional(),
    maxDailyExposure: z.number().nonnegative().optional(),
    requireApprovalAbove: z.number().nonnegative().optional(),
    approvalPrompt: z.string().max(500).optional(),
  })
  .partial();

export const AIAgentPipelineMetadataSchema = z.object({
  provider: z.enum(["gemini", "openclaw"]).default("gemini"),
  systemPrompt: z.string().default(""),
  model: z.string().default("gemini-2.5-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(8192).default(1024),
  contextDepth: z.number().int().min(1).max(10).default(3),
  enableTools: z.boolean().default(true),
  reasoningEnabled: z.boolean().default(false),
  memoryEnabled: z.boolean().default(false),
  memoryTtl: z.number().int().min(1).max(8760).default(24),
  secretId: z.string().optional(),
  maxCostPerExecution: z.number().min(0).max(100).default(0),
  monthlyBudget: z.number().min(0).max(10000).default(0),
  approvalRequired: z.boolean().default(false),
  approvalPrompt: z.string().optional(),
  executionMode: z
    .enum(["auto", "require-approval"])
    .default("require-approval"),
  symbol: z.string().trim().min(1, "Symbol is required"),
  qty: z.number().positive("Quantity is required"),
  side: z.enum(["buy", "sell"]),
  broker: z.enum(["zerodha", "groww", "lighter", "solana-swap"]),
  brokerSecretId: z.string().optional(),
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  network: z.enum(["mainnet-beta"]).default("mainnet-beta"),
  fromToken: z.string().optional(),
  toToken: z.string().optional(),
  slippageBps: z.number().int().min(0).default(100),
  accountIndex: z.number().int().min(0).optional(),
  apiKeyIndex: z.number().int().min(0).optional(),
  minConfidence: z.number().min(0).max(1).default(0),
  riskLimits: PipelineRiskLimitsSchema.optional(),
});

export const AIPipelineStageSchema = z
  .object({
    approved: z.boolean().default(false),
    confidence: z.number().min(0).max(1).default(0),
    reason: z.string().default(""),
  })
  .passthrough();

export const AIPipelineExecutionSchema = z
  .object({
    status: z.enum(["executed", "simulated", "blocked", "skipped", "failed"]),
    broker: z.string().optional(),
    symbol: z.string().optional(),
    qty: z.number().optional(),
    side: z.string().optional(),
    notional: z.number().optional(),
    message: z.string().default(""),
  })
  .passthrough();

export const AIAgentPipelineResultSchema = z
  .object({
    research: AIPipelineStageSchema,
    strategy: AIPipelineStageSchema,
    risk: AIPipelineStageSchema,
    execution: AIPipelineExecutionSchema,
    review: AIPipelineStageSchema,
  })
  .passthrough();

export type OutputField = z.infer<typeof OutputFieldSchema>;
export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;
export type AIDecisionMetadata = z.infer<typeof AIDecisionMetadataSchema>;
export type AIDecisionResult = z.infer<typeof AIDecisionResultSchema>;
export type AIClassifyMetadata = z.infer<typeof AIClassifyMetadataSchema>;
export type AIClassifyResult = z.infer<typeof AIClassifyResultSchema>;
export type AIExtractMetadata = z.infer<typeof AIExtractMetadataSchema>;
export type AIExtractResult = z.infer<typeof AIExtractResultSchema>;
export type AIGenerateMetadata = z.infer<typeof AIGenerateMetadataSchema>;
export type AIGenerateResult = z.infer<typeof AIGenerateResultSchema>;
export type PipelineRiskLimits = z.infer<typeof PipelineRiskLimitsSchema>;
export type AIAgentPipelineMetadata = z.infer<
  typeof AIAgentPipelineMetadataSchema
>;
export type AIPipelineStage = z.infer<typeof AIPipelineStageSchema>;
export type AIPipelineExecution = z.infer<typeof AIPipelineExecutionSchema>;
export type AIAgentPipelineResult = z.infer<typeof AIAgentPipelineResultSchema>;
