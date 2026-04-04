import type { WorkflowExampleSeed } from "../../seed.ts";

export const flowControlExampleSeeds: WorkflowExampleSeed[] = [
  {
    slug: "slack-escalation-with-merge",
    title: "Slack Escalation With Delay And Merge",
    summary:
      "Evaluate a mid-workflow condition, alert Slack immediately on the true path, wait on the false path, then merge both paths into one final Gmail follow-up.",
    category: "Alerts",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 10,
    sortOrder: 5,
    nodeFlow: ["Timer", "If", "Slack", "Delay", "Merge", "Gmail"],
    trigger: "Runs every 10 minutes during the session.",
    logic:
      "An IF node checks short-term RSI weakness. If true, Slack gets an immediate escalation. If false, the workflow pauses before converging. Both paths merge into one shared confirmation email.",
    actions: ["Send Slack DM", "Pause the fallback path", "Merge branches", "Send final Gmail summary"],
    outcomes: [
      "Immediate escalation on priority conditions",
      "Cleaner branch orchestration with merge",
      "Single downstream follow-up after both paths resolve",
    ],
    nodes: [
      {
        nodeId: "timer-4",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 600, marketType: "indian", asset: "CDSL" },
        },
        position: { x: 0, y: 120 },
      },
      {
        nodeId: "if-1",
        type: "if",
        data: {
          kind: "action",
          metadata: {
            marketType: "Indian",
            expression: {
              operator: "AND",
              conditions: [
                {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      left: {
                        type: "indicator",
                        indicator: {
                          indicator: "rsi",
                          symbol: "CDSL",
                          timeframe: "5m",
                          params: { period: 14 },
                        },
                      },
                      operator: "<",
                      right: { type: "value", value: 30 },
                    },
                  ],
                },
              ],
            },
          },
        },
        position: { x: 280, y: 55 },
      },
      {
        nodeId: "slack-1",
        type: "slack",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Ops desk",
            slackBotToken: "xoxb-demo-slack-token",
            slackUserId: "U09ALERTOPS",
          },
        },
        position: { x: 630, y: 0 },
      },
      {
        nodeId: "delay-4",
        type: "delay",
        data: {
          kind: "action",
          metadata: {
            durationSeconds: 120,
          },
        },
        position: { x: 630, y: 185 },
      },
      {
        nodeId: "merge-1",
        type: "merge",
        data: {
          kind: "action",
          metadata: {},
        },
        position: { x: 960, y: 95 },
      },
      {
        nodeId: "gmail-3",
        type: "gmail",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trader inbox",
            recipientEmail: "ops@quantnest.dev",
          },
        },
        position: { x: 1240, y: 95 },
      },
    ],
    edges: [
      { id: "e-timer-4-if-1", source: "timer-4", target: "if-1" },
      {
        id: "e-if-1-slack-1",
        source: "if-1",
        sourceHandle: "true",
        target: "slack-1",
      },
      {
        id: "e-if-1-delay-4",
        source: "if-1",
        sourceHandle: "false",
        target: "delay-4",
      },
      { id: "e-slack-1-merge-1", source: "slack-1", target: "merge-1", targetHandle: "in-a" },
      { id: "e-delay-4-merge-1", source: "delay-4", target: "merge-1", targetHandle: "in-b" },
      { id: "e-merge-1-gmail-3", source: "merge-1", target: "gmail-3" },
    ],
  },
  {
    slug: "rsi-filter-alert-gate",
    title: "RSI Filter Gate Before Alert",
    summary:
      "Use a filter node to gate notifications so alerts only continue when a live RSI condition passes, without creating a separate true/false branch.",
    category: "Alerts",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 7,
    sortOrder: 7,
    nodeFlow: ["Timer", "Filter", "Slack"],
    trigger: "Runs every 5 minutes during the session.",
    logic:
      "A timer starts the workflow. The filter checks whether RSI(14) on the 5m timeframe is below 30. If the condition passes, the Slack DM is sent. If not, execution stops quietly.",
    actions: ["Evaluate RSI condition", "Gate downstream execution", "Send Slack DM only on pass"],
    outcomes: [
      "Cleaner alert gating without branch clutter",
      "Simple example for mid-workflow filtering",
      "Better signal quality before notifications fire",
    ],
    nodes: [
      {
        nodeId: "timer-5",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 300, marketType: "indian", asset: "CDSL" },
        },
        position: { x: 0, y: 110 },
      },
      {
        nodeId: "filter-1",
        type: "filter",
        data: {
          kind: "action",
          metadata: {
            marketType: "Indian",
            expression: {
              operator: "AND",
              conditions: [
                {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      left: {
                        type: "indicator",
                        indicator: {
                          indicator: "rsi",
                          symbol: "CDSL",
                          timeframe: "5m",
                          params: { period: 14 },
                        },
                      },
                      operator: "<",
                      right: { type: "value", value: 30 },
                    },
                  ],
                },
              ],
            },
          },
        },
        position: { x: 310, y: 60 },
      },
      {
        nodeId: "slack-3",
        type: "slack",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Signal desk",
            slackBotToken: "xoxb-demo-slack-token",
            slackUserId: "U09FILTEROPS",
          },
        },
        position: { x: 650, y: 60 },
      },
    ],
    edges: [
      { id: "e-timer-5-filter-1", source: "timer-5", target: "filter-1" },
      { id: "e-filter-1-slack-3", source: "filter-1", target: "slack-3" },
    ],
  },
  {
    slug: "market-session-trading-window",
    title: "Market Session Trading Window After Opening",
    summary:
      "Trade only after the first 15 minutes of market open when conditions are favorable, with conditional execution based on RSI.",
    category: "Execution",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 8,
    sortOrder: 10,
    nodeFlow: ["Market Session", "If", "Zerodha", "Gmail"],
    trigger: "Fires at 9:30 AM IST after opening range completes.",
    logic:
      "Market-session trigger at 09:30 starts the workflow. An IF node checks for favorable market conditions (RSI > 50). If true, Zerodha executes the trade and sends confirmation to Gmail. If false, the workflow skips and logs no action.",
    actions: ["Trigger at market open + 15m", "Check RSI condition", "Execute trade if conditions met", "Send confirmation email"],
    outcomes: [
      "Avoid opening range volatility",
      "Conditional execution with momentum confirmation",
      "Cleaner trade documentation via email",
    ],
    nodes: [
      {
        nodeId: "market-session-1",
        type: "market-session",
        data: {
          kind: "trigger",
          metadata: {
            marketType: "indian",
            event: "at-time",
            triggerTime: "09:30",
          },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "if-market-1",
        type: "if",
        data: {
          kind: "action",
          metadata: {
            marketType: "Indian",
            expression: {
              operator: "AND",
              conditions: [
                {
                  type: "group",
                  operator: "AND",
                  conditions: [
                    {
                      left: {
                        type: "indicator",
                        indicator: {
                          indicator: "rsi",
                          symbol: "NIFTY 50",
                          timeframe: "5m",
                          params: { period: 14 },
                        },
                      },
                      operator: ">",
                      right: { type: "value", value: 50 },
                    },
                  ],
                },
              ],
            },
          },
        },
        position: { x: 320, y: 20 },
      },
      {
        nodeId: "zerodha-market-1",
        type: "Zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 1,
            symbol: "NIFTY 50",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
            condition: true,
          },
        },
        position: { x: 650, y: 20 },
      },
      {
        nodeId: "gmail-market-1",
        type: "gmail",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trader inbox",
            recipientEmail: "trader@quantnest.dev",
            condition: true,
          },
        },
        position: { x: 970, y: 20 },
      },
    ],
    edges: [
      { id: "e-market-if-market-1", source: "market-session-1", target: "if-market-1" },
      {
        id: "e-if-market-1-zerodha-market-1",
        source: "if-market-1",
        sourceHandle: "true",
        target: "zerodha-market-1",
      },
      { id: "e-zerodha-gmail-market-1", source: "zerodha-market-1", target: "gmail-market-1" },
    ],
  },
];
