import { z } from "zod";

export const OutputFieldSchema = z.object({
  fieldName: z.string().trim().min(1, "Field name is required"),
  choices: z
    .array(z.string().trim().min(1))
    .min(1, "At least one choice is required"),
});

export const AIDecisionMetadataSchema = z.object({
  systemPrompt: z.string().trim().min(1, "System prompt is required"),
  outputSchema: z.array(OutputFieldSchema).default([]),
  model: z.string().trim().min(1, "Model is required"),
  baseUrl: z.string().url("Must be a valid URL").optional(),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().min(1).max(8192).default(512),
  role: z.string().trim().min(1).default("analyst"),
  contextDepth: z.number().int().min(1).max(10).default(3),
  secretId: z.string().optional(),
});

export const AIDecisionResultSchema = z
  .object({
    decision: z.string().trim().min(1, "Decision is required"),
    confidence: z.number().min(0).max(1),
    reason: z.string().trim().min(1, "Reason is required"),
  })
  .passthrough();

export const AIExecutionContextSchema = z.object({
  workflowId: z.string().trim().min(1),
  executionId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  nodeId: z.string().trim().min(1),
  prompt: z.string(),
  upstreamContext: z.record(z.string(), z.unknown()),
  metadata: AIDecisionMetadataSchema,
});

export type OutputField = z.infer<typeof OutputFieldSchema>;
export type AIDecisionMetadata = z.infer<typeof AIDecisionMetadataSchema>;
export type AIDecisionResult = z.infer<typeof AIDecisionResultSchema>;
export type AIExecutionContext = z.infer<typeof AIExecutionContextSchema>;
