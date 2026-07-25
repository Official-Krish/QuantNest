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
