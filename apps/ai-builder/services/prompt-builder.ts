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
            type: "timer | price | conditional-trigger | if | filter | delay | merge | zerodha | groww | lighter | gmail | slack | telegram | discord | whatsapp | notion-daily-report | google-drive-daily-csv | google-sheets-report",
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
    "- Never include both market-session and conditional-trigger in the same workflow. Choose one trigger only.",
    "- Minimize nodes: avoid unnecessary relay nodes or empty conditions. Each node must add business logic.",
    "- Broker selection rules: ALWAYS respect explicit broker names in user prompt first (e.g., 'Zerodha', 'Groww', 'Lighter'). If no explicit broker is mentioned, use market-based defaults: For Indian market use Zerodha/Groww; For Crypto/web3 market use Lighter. Never mix brokers in a single workflow UNLESS the user explicitly mentions different brokers for different actions (e.g., 'buy on Zerodha, sell on Groww').",
    "- Broker credential efficiency: When multiple trading actions (BUY, SELL, etc.) use the same broker, ALL actions must use that broker to avoid asking the user for redundant credentials. Example: 'Buy on Zerodha and Sell on Zerodha' not 'Buy on Zerodha and Sell on Groww' unless explicitly stated.",
    "- When prompt mentions constraints like 'Use Lighter broker only' or 'Only BTC/USD pair', strictly enforce them in node generation.",
    "",
    "TRIGGER NODES:",
    "- For a price node, metadata must include asset and marketType. Use either threshold mode (condition + targetPrice) or change mode (changeDirection + changeType + changeValue + changeWindowMinutes).",
    "- For conditional-trigger expressions, supported comparators are: >, >=, <, <=, ==, !=, crosses_above, crosses_below.",
    "- Use crosses_above/crosses_below only when both left and right operands are indicators (for crossover events like EMA20 crossing EMA50).",
    "- Never return an empty conditional-trigger expression; include at least one clause inside expression.conditions.",
    "- If prompt asks for crossover, expression must include a clause with operator crosses_above or crosses_below.",
    "- For conditional-trigger with multiple conditions, use single expression with AND/OR operators, not separate filter nodes.",
    "- For market-session: if single time point (e.g., 'at 3:20'), use event='at-time'. If range (e.g., '7 PM to 2 AM'), use event='session-window'.",
    "- market-session trigger metadata must include: marketType ('indian' or 'web3'), event, triggerTime (HH:MM), and endTime (if session-window).",
    "- Always align marketType: use 'indian' for Indian requests, 'web3' for Crypto/Bitcoin requests.",
    "",
    "BRANCHING LOGIC:",
    "- Use 'if' node ONLY for true/false branching with two distinct downstream paths (sourceHandle='true' and sourceHandle='false').",
    "- Use 'filter' node for single-path gating (pass/block execution without branching).",
    "- Do NOT use filter nodes to replace conditional-trigger conditions when the trigger itself is conditional-trigger.",
    "- If market-session is the trigger and extra indicator checks are needed, model those checks in downstream if/filter action nodes (not a second trigger).",
    "- If user says 'check if price > X then action Y, else action Z', use single if-node with both branches (not separate filters).",
    "- Combine multiple conditions (RSI + Volume) into single expression with AND operator, not multiple sequential filters.",
    "",
    "ACTION SEQUENCE RULES:",
    "- Use 'delay' when the user explicitly asks to wait (e.g., 'wait 2 minutes', 'wait 5 minutes before next').",
    "- Use 'merge' to rejoin parallel branches after if-node branching.",
    "- Sequential actions (Slack → Order → WhatsApp) should create a linear chain with edges source → target.",
    "- Parallel actions (send both Slack AND Gmail at same time) should connect from same parent to multiple children without merge.",
    "- For notification flows, action order matters: typically alert first, then execute, then confirm.",
    "",
    "INDICATORS & EXPRESSIONS:",
    "- When user asks for filter on RSI, EMA, MACD, volume: build full expression object with indicator operand, not just asset.",
    "- For 'RSI(14) on 5m for HDFC < 50': create clause with indicator={symbol:'HDFC', timeframe:'5m', indicator:'rsi', params:{period:14}}, operator:'<', value: 50.",
    "- Supported indicator names: price, volume, ema, sma, rsi, pct_change, macd, macd_signal, macd_histogram.",
    "- Never use indicator names that are not in supported list.",
    "",
    "VALUE & ASSET RULES:",
    "- If prompt says 'below 1500', use condition='below' and targetPrice=1500 exactly (never 0 or approximate).",
    "- If prompt specifies asset (HDFC, BTC), use the exact symbol from prompt.",
    "- If no asset specified, add to missingInputs array.",
    "- If prompt mentions BTC/USD but market is 'Crypto', resolve asset='BTC' and pair='USD'.",
    "",
    "MARKET TIMING PRESETS:",
    "- Indian: first 5m→09:20, first 15m→09:30, avoid first 10m→09:25, avoid 12:00-13:30→13:30, stop 15:00→pause-at-time 15:00, close by 15:20→at-time 15:20.",
    "- Crypto US session: 19:00 IST to 02:00 IST as event='session-window'.",
    "",
    "EDGE CASES:",
    "- If prompt has both timing and condition (e.g., 'at 14:30 if RSI > 70'): use market-session as the only trigger, then apply condition logic with downstream if/filter action nodes.",
    "- If user asks to close position after profit/loss: add explicit 'exit' or broker SELL order, not just condition.",
    "- Use sourceHandle='true' and sourceHandle='false' ONLY for if-node branches.",
    "",
    "CREDENTIALS & MISSING INPUTS:",
    "- For notification/reporting actions needing credentials (Slack token, Gmail email, etc.), add to missingInputs array.",
    "- Do not fabricate credentials; use placeholder metadata and document what's needed.",
    "- For Lighter broker execution, add to missingInputs: api_key, api_secret fields if not provided.",
    "",
    "GRAPH LAYOUT:",
    "- Positions should be laid out left-to-right, top-to-bottom in readable order.",
    "- Trigger node at x=0. First action x=200. Subsequent actions x+=200. Branches at y+=100 per branch.",
    "- Keep action nodes reachable from at least one trigger path (no orphaned nodes).",
    "",
    "Few-shot examples (follow these patterns):",
    "Example 1 - Crypto session with RSI gate and linear actions:",
    "User prompt: Bitcoin US session 7 PM to 2 AM IST: if RSI(14) on 1h timeframe is above 70, send Slack 'Bitcoin overbought detected'. Then execute Lighter SHORT 0.5 BTC with 10% stop loss. Wait 2 minutes, then send WhatsApp 'SHORT position opened'.",
    "Expected structure: one market-session trigger + one downstream filter (or if) with full expression + slack -> lighter -> delay -> whatsapp. Do not add a second trigger.",
    JSON.stringify(
      {
        workflowName: "Bitcoin Session Overbought Short",
        marketType: "Crypto",
        nodes: [
          {
            nodeId: "n1",
            type: "market-session",
            data: {
              kind: "trigger",
              metadata: {
                marketType: "web3",
                event: "session-window",
                triggerTime: "19:00",
                endTime: "02:00",
              },
            },
            position: { x: 0, y: 0 },
          },
          {
            nodeId: "n2",
            type: "filter",
            data: {
              kind: "action",
              metadata: {
                marketType: "Crypto",
                asset: "BTC",
                expression: {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      type: "group",
                      operator: "AND",
                      conditions: [
                        {
                          type: "clause",
                          left: {
                            type: "indicator",
                            indicator: {
                              symbol: "BTC",
                              timeframe: "1h",
                              marketType: "Crypto",
                              indicator: "rsi",
                              params: { period: 14 },
                            },
                          },
                          operator: ">",
                          right: { type: "value", value: 70 },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            position: { x: 200, y: 0 },
          },
          { nodeId: "n3", type: "slack", data: { kind: "action", metadata: {} }, position: { x: 400, y: 0 } },
          { nodeId: "n4", type: "lighter", data: { kind: "action", metadata: { type: "short", qty: 0.5, symbol: "BTC" } }, position: { x: 600, y: 0 } },
          { nodeId: "n5", type: "delay", data: { kind: "action", metadata: { durationSeconds: 120 } }, position: { x: 800, y: 0 } },
          { nodeId: "n6", type: "whatsapp", data: { kind: "action", metadata: {} }, position: { x: 1000, y: 0 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
          { id: "e3", source: "n3", target: "n4" },
          { id: "e4", source: "n4", target: "n5" },
          { id: "e5", source: "n5", target: "n6" },
        ],
      },
      null,
      2,
    ),
    "",
    "Example 2 - Practical intraday execution chain:",
    "User prompt: When RELIANCE drops below 2850, buy 5 units on Groww, wait 5 minutes, send Gmail confirmation, then write the trade to Google Sheets.",
    "Expected structure: one price trigger (below 2850) -> groww -> delay(300s) -> gmail -> google-sheets-report.",
    JSON.stringify(
      {
        workflowName: "Reliance Dip Execution",
        marketType: "Indian",
        nodes: [
          { nodeId: "n1", type: "price", data: { kind: "trigger", metadata: { asset: "RELIANCE", marketType: "indian", condition: "below", targetPrice: 2850 } }, position: { x: 0, y: 0 } },
          { nodeId: "n2", type: "groww", data: { kind: "action", metadata: { type: "buy", qty: 5, symbol: "RELIANCE", exchange: "NSE" } }, position: { x: 200, y: 0 } },
          { nodeId: "n3", type: "delay", data: { kind: "action", metadata: { durationSeconds: 300 } }, position: { x: 400, y: 0 } },
          { nodeId: "n4", type: "gmail", data: { kind: "action", metadata: {} }, position: { x: 600, y: 0 } },
          { nodeId: "n5", type: "google-sheets-report", data: { kind: "action", metadata: {} }, position: { x: 800, y: 0 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
          { id: "e3", source: "n3", target: "n4" },
          { id: "e4", source: "n4", target: "n5" },
        ],
      },
      null,
      2,
    ),
    "",
    "Example 3 - Expanded branching with merge and reporting:",
    "User prompt: If EMA20 crosses above EMA50 on HDFC 5m, on true branch send Telegram and place Zerodha BUY. On false branch send Discord warning. Then merge both branches and write a Google Sheets report.",
    "Expected structure: one conditional-trigger (with crosses_above) -> true and false branches -> merge -> google-sheets-report.",
    JSON.stringify(
      {
        workflowName: "EMA Crossover Branch and Audit",
        marketType: "Indian",
        nodes: [
          {
            nodeId: "n1",
            type: "conditional-trigger",
            data: {
              kind: "trigger",
              metadata: {
                marketType: "Indian",
                asset: "HDFC",
                expression: {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      type: "group",
                      operator: "AND",
                      conditions: [
                        {
                          type: "clause",
                          left: {
                            type: "indicator",
                            indicator: { symbol: "HDFC", timeframe: "5m", marketType: "Indian", indicator: "ema", params: { period: 20 } },
                          },
                          operator: "crosses_above",
                          right: {
                            type: "indicator",
                            indicator: { symbol: "HDFC", timeframe: "5m", marketType: "Indian", indicator: "ema", params: { period: 50 } },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            position: { x: 0, y: 0 },
          },
          { nodeId: "n2", type: "telegram", data: { kind: "action", metadata: {} }, position: { x: 240, y: -120 } },
          { nodeId: "n3", type: "zerodha", data: { kind: "action", metadata: { type: "buy", qty: 10, symbol: "HDFC", exchange: "NSE" } }, position: { x: 460, y: -120 } },
          { nodeId: "n4", type: "discord", data: { kind: "action", metadata: {} }, position: { x: 240, y: 120 } },
          { nodeId: "n5", type: "merge", data: { kind: "action", metadata: {} }, position: { x: 680, y: 0 } },
          { nodeId: "n6", type: "google-sheets-report", data: { kind: "action", metadata: {} }, position: { x: 900, y: 0 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2", sourceHandle: "true" },
          { id: "e2", source: "n2", target: "n3" },
          { id: "e3", source: "n1", target: "n4", sourceHandle: "false" },
          { id: "e4", source: "n3", target: "n5" },
          { id: "e5", source: "n4", target: "n5" },
          { id: "e6", source: "n5", target: "n6" },
        ],
      },
      null,
      2,
    ),
    "",
    "Example 4 - Multi-condition trigger with pre-execution volume gate:",
    "User prompt: Trigger when RSI(14) on 5m is below 30 AND price crosses above EMA(20) on 5m. Then place Zerodha BUY qty 10. Before execution, verify volume is above 2,000,000 else skip. After buy, send Slack entry alert, wait 5 minutes, then place Zerodha SELL to close.",
    "Expected structure: one conditional-trigger for RSI+EMA conditions -> filter(volume > 2000000) -> zerodha(BUY) -> slack -> delay(300s) -> zerodha(SELL).",
    JSON.stringify(
      {
        workflowName: "RSI EMA Reversal with Volume Guard",
        marketType: "Indian",
        nodes: [
          {
            nodeId: "n1",
            type: "conditional-trigger",
            data: {
              kind: "trigger",
              metadata: {
                marketType: "Indian",
                asset: "HDFC",
                expression: {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      type: "group",
                      operator: "AND",
                      conditions: [
                        {
                          type: "clause",
                          left: {
                            type: "indicator",
                            indicator: {
                              symbol: "HDFC",
                              timeframe: "5m",
                              marketType: "Indian",
                              indicator: "rsi",
                              params: { period: 14 },
                            },
                          },
                          operator: "<",
                          right: { type: "value", value: 30 },
                        },
                        {
                          type: "clause",
                          left: {
                            type: "indicator",
                            indicator: {
                              symbol: "HDFC",
                              timeframe: "5m",
                              marketType: "Indian",
                              indicator: "price",
                            },
                          },
                          operator: "crosses_above",
                          right: {
                            type: "indicator",
                            indicator: {
                              symbol: "HDFC",
                              timeframe: "5m",
                              marketType: "Indian",
                              indicator: "ema",
                              params: { period: 20 },
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            position: { x: 0, y: 0 },
          },
          {
            nodeId: "n2",
            type: "filter",
            data: {
              kind: "action",
              metadata: {
                marketType: "Indian",
                asset: "HDFC",
                expression: {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      type: "group",
                      operator: "AND",
                      conditions: [
                        {
                          type: "clause",
                          left: {
                            type: "indicator",
                            indicator: {
                              symbol: "HDFC",
                              timeframe: "5m",
                              marketType: "Indian",
                              indicator: "volume",
                            },
                          },
                          operator: ">",
                          right: { type: "value", value: 2000000 },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            position: { x: 240, y: 0 },
          },
          { nodeId: "n3", type: "zerodha", data: { kind: "action", metadata: { type: "buy", qty: 10, symbol: "HDFC", exchange: "NSE" } }, position: { x: 460, y: 0 } },
          { nodeId: "n4", type: "slack", data: { kind: "action", metadata: {} }, position: { x: 680, y: 0 } },
          { nodeId: "n5", type: "delay", data: { kind: "action", metadata: { durationSeconds: 300 } }, position: { x: 900, y: 0 } },
          { nodeId: "n6", type: "zerodha", data: { kind: "action", metadata: { type: "sell", qty: 10, symbol: "HDFC", exchange: "NSE" } }, position: { x: 1120, y: 0 } },
        ],
        edges: [
          { id: "e1", source: "n1", target: "n2" },
          { id: "e2", source: "n2", target: "n3" },
          { id: "e3", source: "n3", target: "n4" },
          { id: "e4", source: "n4", target: "n5" },
          { id: "e5", source: "n5", target: "n6" },
        ],
      },
      null,
      2,
    ),
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
    ...(input.conversationHistory?.length
      ? [
          "PRIOR CONVERSATION CONTEXT (compacted):",
          "---",
          ...input.conversationHistory
            .map((turn) => {
              const compactedContent =
                turn.content.length > (turn.role === "user" ? 200 : 100)
                  ? `${turn.content.substring(0, turn.role === "user" ? 200 : 100)}...`
                  : turn.content;
              return `${turn.role === "user" ? "User" : "AI"}: ${compactedContent}`;
            })
            .slice(-8), // Keep only last 8 turns (4 exchanges) to stay compact
          "---",
          "",
        ]
      : []),
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
