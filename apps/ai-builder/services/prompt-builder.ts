import type {
  AiStrategyBuilderRequest,
  AiStrategyWorkflowPlan,
} from "@quantnest-trading/types/ai";
import {
  getActionMetadataReference,
  getAiPromptNodeTypes,
  getTriggerMetadataReference,
} from "@quantnest-trading/node-registry";

const DEFAULT_ALLOWED_NODE_TYPES = getAiPromptNodeTypes();

const ACTION_METADATA_REFERENCE = getActionMetadataReference();

const TRIGGER_METADATA_REFERENCE = getTriggerMetadataReference();

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
            type: "timer | price | conditional-trigger | if | filter | delay | merge | Zerodha | Groww | gmail | slack | telegram | discord | whatsapp | notion-daily-report | google-drive-daily-csv | google-sheets-report",
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
    "- Multiple trigger nodes and branching paths are allowed when they improve the workflow.",
    "- For a price node, metadata must include asset and marketType. Use either threshold mode (condition + targetPrice) or change mode (changeDirection + changeType + changeValue + changeWindowMinutes).",
    "- For conditional-trigger expressions, supported comparators are: >, >=, <, <=, ==, !=, crosses_above, crosses_below.",
    "- Use crosses_above/crosses_below only when both left and right operands are indicators (for crossover events like EMA20 crossing EMA50).",
    "- Never return an empty conditional-trigger expression; include at least one clause inside expression.conditions.",
    "- If prompt asks for crossover, expression must include a clause with operator crosses_above or crosses_below.",
    "- Use 'if' for downstream branching logic after a trigger or action step.",
    "- Use 'filter' to gate downstream execution with a condition but without creating true/false branches.",
    "- Use 'delay' when the user asks to wait before continuing to the next action.",
    "- Use 'merge' to join parallel or branched paths back into a single downstream step.",
    "- If the prompt says 'below', the price trigger condition must be 'below'. If the prompt says 'above', use 'above'.",
    "- Never default a price trigger targetPrice to 0. Use the exact threshold from the prompt.",
    "- Use conditional-trigger when the strategy mentions thresholds, comparisons, RSI, EMA, MACD, or branching.",
    "- For indicator trigger requests (RSI/EMA/MACD), prefer conditional-trigger with expression clauses.",
    "- For volume spike requests, use conditional-trigger with a volume clause (for example: volume > numeric threshold).",
    "- Supported indicator names in expression operands include price, volume, ema, sma, rsi, pct_change, macd, macd_signal, macd_histogram.",
    "- Use sourceHandle=true and sourceHandle=false for conditional branches.",
    "- Keep action nodes reachable from at least one trigger path.",
    "- For direct execution flows, add broker action nodes only when brokerExecution=true or the prompt clearly requests execution.",
    "- For notification/reporting actions that need credentials, keep placeholder-safe metadata and add entries to missingInputs.",
    "- Do not fabricate secrets or user credentials.",
    "- Positions should be laid out left-to-right in a readable graph.",
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

export function buildStrategyEditPrompt(
  request: AiStrategyBuilderRequest,
  currentPlan: AiStrategyWorkflowPlan,
  instruction: string,
): string {
  return [
    buildStrategyPlannerPrompt(request),
    "",
    "Editing mode:",
    "- You are updating an existing workflow draft.",
    "- Apply the user's latest instruction while preserving valid parts of the current workflow.",
    "- Return the full updated workflow JSON, not a diff.",
    "- Keep nodeIds stable when a node still represents the same step.",
    "- Remove obsolete nodes and edges when the new instruction replaces them.",
    "",
    "Current workflow JSON:",
    JSON.stringify(currentPlan, null, 2),
    "",
    "Latest edit instruction:",
    instruction.trim(),
  ].join("\n");
}
