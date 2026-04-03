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
    "- summary must be user-facing and conversational (2-3 sentences), not a dry template.",
    "- In summary, explicitly mention: (1) what triggers the workflow, (2) what key action happens, and (3) any important guard/condition if present.",
    "- Avoid repetitive openings like 'Sends a ...' for every response; vary phrasing naturally.",
    "- For edit requests, summary should mention what changed compared with the previous draft.",
    "- Use exactly one trigger node per workflow.",
    "- For a price node, metadata must include asset and marketType. Use either threshold mode (condition + targetPrice) or change mode (changeDirection + changeType + changeValue + changeWindowMinutes).",
    "- For conditional-trigger expressions, supported comparators are: >, >=, <, <=, ==, !=, crosses_above, crosses_below.",
    "- Use crosses_above/crosses_below only when both left and right operands are indicators (for crossover events like EMA20 crossing EMA50).",
    "- Never return an empty conditional-trigger expression; include at least one clause inside expression.conditions.",
    "- If prompt asks for crossover, expression must include a clause with operator crosses_above or crosses_below.",
    "- Use 'if' for downstream branching logic after a trigger or action step.",
    "- Use 'filter' to gate downstream execution with a condition but without creating true/false branches.",
    "- When the user asks for a filter on RSI, EMA, MACD, volume, or any indicator comparison, the filter node must include a full expression object. Do not output a filter with only marketType, asset, or empty metadata.",
    "- For requests like 'RSI(14) on 5 minute timeframe for HDFC is less than 50', build exactly one filter condition with left operand indicator='rsi', symbol='HDFC', timeframe='5m', params.period=14, operator='<', and right operand value=50.",
    "- Filter nodes are gates only: they must continue execution when the condition passes and block execution when it fails.",
    "- Use 'delay' when the user asks to wait before continuing to the next action.",
    "- Use 'merge' to join parallel or branched paths back into a single downstream step.",
    "- If the prompt says 'below', the price trigger condition must be 'below'. If the prompt says 'above', use 'above'.",
    "- Never default a price trigger targetPrice to 0. Use the exact threshold from the prompt.",
    "- Use conditional-trigger when the strategy mentions thresholds, comparisons, RSI, EMA, MACD, or branching.",
    "- For indicator trigger requests (RSI/EMA/MACD), prefer conditional-trigger with expression clauses.",
    "- For volume spike requests, use conditional-trigger with a volume clause (for example: volume > numeric threshold).",
    "- For market-session timing requests that describe a single start time or a close/pause time (e.g., 'Close workflow at 3:20'), use market-session trigger nodes with event='at-time' or event='pause-at-time' and triggerTime in HH:MM format.",
    "- For market-session timing requests that describe a start and end window (e.g., 'Only trade between 9:20 and 2:30', 'Trade from 9:20 to 15:20'), use market-session trigger nodes with event='session-window', triggerTime for the start time, and endTime for the stop time.",
    "- For crypto US session requests that describe a start and stop window, use market-session trigger nodes with event='session-window', triggerTime for the start time, and endTime for the stop time.",
    "- market-session trigger metadata must include: marketType ('indian' or 'web3'), event ('market-open', 'market-close', 'at-time', 'pause-at-time', or 'session-window'), triggerTime (HH:MM format when event is time-based), and endTime when event='session-window'.",
    "- Always align marketType with request market: use 'indian' for Indian requests and 'web3' for Crypto requests.",
    "- If prompt includes both timing and condition checks (for example: 'at 14:30 if BTC is below 60000'), use market-session as the single trigger and model the condition as a downstream filter/if node.",
    "- Example RSI filter shape: { type: 'filter', data: { kind: 'action', metadata: { marketType: 'Indian', asset: 'HDFC', expression: { type: 'group', operator: 'AND', conditions: [{ type: 'group', operator: 'AND', conditions: [{ type: 'clause', left: { type: 'indicator', indicator: { symbol: 'HDFC', timeframe: '5m', indicator: 'rsi', marketType: 'Indian', params: { period: 14 } } }, operator: '<', right: { type: 'value', value: 50 } }] }] } } } }.",
    "- Indian preset intent mapping: after first 5 minutes -> at-time 09:20; after first 15 minutes/opening range -> at-time 09:30; avoid first 10 minutes -> at-time 09:25; avoid 12:00-13:30 -> at-time 13:30; stop taking new trades after 15:00 -> pause-at-time 15:00; close all positions by 15:20 -> at-time 15:20 plus appropriate action nodes; trade only during a fixed Indian session window -> event='session-window' with start and end times.",
    "- Crypto preset intent mapping: trade only during US session -> market-session event='session-window' with a start around 19:00 IST and stop around 02:00 IST, then use downstream filter/if logic for strategy conditions.",
    "- Quick presets are supported when they map to one of the allowed market-session events; the execution engine supports market-open, market-close, at-time, pause-at-time, and session-window.",
    "- If prompt says pause workflow at a given time, use market-session event='pause-at-time' with triggerTime in HH:MM.",
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
