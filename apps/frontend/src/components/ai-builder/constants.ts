import type { AiStrategyBuilderRequest } from "@/types/api";

export const AI_ACTION_OPTIONS: NonNullable<AiStrategyBuilderRequest["preferredActions"]> = [
  "zerodha",
  "groww",
  "lighter",
  "delay",
  "if",
  "filter",
  "merge",
  "gmail",
  "slack",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
];

export const AI_ALLOWED_NODE_TYPES: NonNullable<AiStrategyBuilderRequest["allowedNodeTypes"]> = [
  "timer",
  "price",
  "conditional-trigger",
  "if",
  "filter",
  "delay",
  "merge",
  "zerodha",
  "groww",
  "gmail",
  "slack",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
];

export const DEFAULT_AI_CONSTRAINTS =
  "Keep the workflow simple\nCollect missing credentials in missingInputs";

export const AI_EMPTY_STATE_EXAMPLES = [
  "Buy HDFC when price goes below 1000, then notify me on Gmail and log to Notion.",
  "Send me a Slack DM when RELIANCE breaks above a target with the price and reason.",
  "Alert me on Discord when BTC breaks above a key level with confirmation logic.",
  "Create a daily reporting workflow that exports broker activity to Google Drive.",
];

export const AI_EMPTY_STATE_TIPS = [
  "Mention exact trigger values like below 1000 or RSI below 30.",
  "State whether you want alerts only or direct broker execution.",
  "List required outputs, for example Gmail notification plus Notion report.",
];
