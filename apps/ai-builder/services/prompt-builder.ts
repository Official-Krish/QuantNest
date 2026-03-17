import type {
  AiStrategyBuilderRequest,
  StrategyBuilderActionType,
} from "@quantnest-trading/types/ai";
import type { NodeKind } from "@quantnest-trading/types";

const DEFAULT_ALLOWED_NODE_TYPES: NodeKind[] = [
  "timer",
  "price",
  "conditional-trigger",
  "Zerodha",
  "Groww",
  "gmail",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
];

const ACTION_METADATA_REFERENCE: Record<StrategyBuilderActionType, string[]> = {
  zerodha: ["type", "qty", "symbol", "apiKey", "accessToken", "exchange"],
  groww: ["type", "qty", "symbol", "accessToken", "exchange"],
  lighter: ["type", "qty", "symbol", "apiKey", "accountIndex", "apiKeyIndex"],
  gmail: ["recipientEmail", "recipientName"],
  discord: ["webhookUrl", "recipientName"],
  whatsapp: ["recipientPhone", "recipientName"],
  "notion-daily-report": ["notionApiKey", "parentPageId", "aiConsent"],
  "google-drive-daily-csv": [
    "googleClientEmail",
    "googlePrivateKey",
    "googleDriveFolderId",
    "filePrefix",
    "aiConsent",
  ],
};

const TRIGGER_METADATA_REFERENCE: Record<string, string[]> = {
  timer: ["time", "marketType", "asset"],
  price: ["asset", "targetPrice", "marketType", "condition"],
  "conditional-trigger": [
    "asset",
    "marketType",
    "condition",
    "targetPrice",
    "timeWindowMinutes",
    "expression",
  ],
};

export function buildStrategyPlannerPrompt(input: AiStrategyBuilderRequest): string {
  const allowedNodeTypes = (input.allowedNodeTypes?.length
    ? input.allowedNodeTypes
    : DEFAULT_ALLOWED_NODE_TYPES
  ).join(", ");

  const preferredActions = input.preferredActions?.length
    ? input.preferredActions.join(", ")
    : "none";

  const constraints = input.constraints?.length
    ? input.constraints.map((item) => `- ${item}`).join("\n")
    : "- none";

  const actionMetadataGuide = Object.entries(ACTION_METADATA_REFERENCE)
    .map(([action, fields]) => `- ${action}: ${fields.join(", ")}`)
    .join("\n");
  const triggerMetadataGuide = Object.entries(TRIGGER_METADATA_REFERENCE)
    .map(([trigger, fields]) => `- ${trigger}: ${fields.join(", ")}`)
    .join("\n");

  return [
    "You are an AI workflow planner for QuantNest Trading.",
    "Return only valid JSON. Do not include markdown fences or extra commentary.",
    "Build a strategy workflow plan using only the supported node types and metadata fields.",
    "Prefer practical, minimal workflows. Do not invent unsupported indicators or node types.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        workflowName: "string",
        summary: "string",
        marketType: input.market,
        nodes: [
          {
            nodeId: "string",
            type: "timer | price | conditional-trigger | Zerodha | Groww | gmail | discord | whatsapp | notion-daily-report | google-drive-daily-csv",
            data: {
              kind: "trigger | action",
              metadata: {},
            },
            position: {
              x: 0,
              y: 0,
            },
          },
        ],
        edges: [
          {
            id: "string",
            source: "nodeId",
            target: "nodeId",
            sourceHandle: "optional string, use true/false for conditional branches when needed",
            targetHandle: "optional string",
          },
        ],
        assumptions: ["string"],
        warnings: [
          {
            code: "string",
            message: "string",
          },
        ],
        missingInputs: [
          {
            nodeId: "string",
            nodeType: "string",
            field: "string",
            label: "string",
            reason: "string",
            required: true,
            secret: true,
          },
        ],
      },
      null,
      2,
    ),
    "",
    "Rules:",
    "- Exactly one trigger node is preferred for V1.",
    "- For a price node, metadata must include asset, targetPrice, marketType, and condition.",
    "- If the prompt says 'below', the price trigger condition must be 'below'. If the prompt says 'above', use 'above'.",
    "- Never default a price trigger targetPrice to 0. Use the exact threshold from the prompt.",
    "- Use conditional-trigger when the strategy mentions thresholds, comparisons, RSI, EMA, or branching.",
    "- For direct execution flows, add broker action nodes only when brokerExecution=true or the prompt clearly requests execution.",
    "- For notification/reporting actions that need credentials, keep placeholder-safe metadata and add entries to missingInputs.",
    "- Do not fabricate secrets or user credentials.",
    "- Positions should be laid out left-to-right in a readable graph.",
    "- Use sourceHandle=true and sourceHandle=false when creating conditional branches.",
    "",
    "Supported node types:",
    allowedNodeTypes,
    "",
    "Trigger metadata fields:",
    triggerMetadataGuide,
    "",
    "Action metadata fields:",
    actionMetadataGuide,
    "",
    "User request:",
    `Prompt: ${input.prompt}`,
    `Market: ${input.market}`,
    `Goal: ${input.goal}`,
    `Risk preference: ${input.riskPreference ?? "not specified"}`,
    `Broker execution allowed: ${String(input.brokerExecution ?? false)}`,
    `Allow direct execution: ${String(input.allowDirectExecution ?? false)}`,
    `Preferred actions: ${preferredActions}`,
    "Constraints:",
    constraints,
  ].join("\n");
}
