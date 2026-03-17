import type { AiStrategyBuilderRequest } from "@/types/api";

export const AI_ACTION_OPTIONS: NonNullable<AiStrategyBuilderRequest["preferredActions"]> = [
  "zerodha",
  "groww",
  "lighter",
  "gmail",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
];

export const AI_ALLOWED_NODE_TYPES: NonNullable<AiStrategyBuilderRequest["allowedNodeTypes"]> = [
  "timer",
  "price",
  "conditional-trigger",
  "zerodha",
  "groww",
  "gmail",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
];

export const DEFAULT_AI_CONSTRAINTS =
  "Keep the workflow simple\nCollect missing credentials in missingInputs";
