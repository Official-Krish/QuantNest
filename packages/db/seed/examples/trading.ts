import type { WorkflowExampleSeed } from "../../seed.ts";

export const tradingExampleSeeds: WorkflowExampleSeed[] = [
  {
    slug: "zerodha-breakout-execution",
    title: "Zerodha Breakout Execution With Conditional Branching",
    summary:
      "A momentum workflow that branches into true/false paths before placing a Zerodha buy order and logging the outcome.",
    category: "Execution",
    market: "Indian",
    difficulty: "Advanced",
    setupMinutes: 15,
    sortOrder: 2,
    nodeFlow: ["Price Trigger", "Conditional", "Zerodha", "Notion"],
    trigger: "Fires when price breaks above a key intraday level.",
    logic:
      "Conditional branch checks follow-through metrics like EMA slope, RSI confirmation, or breakout volume before executing.",
    actions: ["Place Zerodha order", "Create trade note in Notion", "Notify on failed branch"],
    outcomes: [
      "Fewer low-quality breakouts",
      "Structured branch-based risk gating",
      "Automatic post-trade documentation",
    ],
    nodes: [
      {
        nodeId: "price-1",
        type: "price",
        data: {
          kind: "trigger",
          metadata: {
            asset: "HDFC",
            targetPrice: 1745,
            marketType: "indian",
            condition: "above",
          },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-2",
        type: "conditional-trigger",
        data: {
          kind: "trigger",
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
                          indicator: "ema",
                          symbol: "HDFC",
                          timeframe: "15m",
                          params: { period: 20 },
                        },
                      },
                      operator: ">",
                      right: {
                        type: "indicator",
                        indicator: {
                          indicator: "ema",
                          symbol: "HDFC",
                          timeframe: "15m",
                          params: { period: 50 },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        position: { x: 300, y: 20 },
      },
      {
        nodeId: "zerodha-1",
        type: "Zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 10,
            symbol: "HDFC",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
            condition: true,
          },
        },
        position: { x: 650, y: 0 },
      },
      {
        nodeId: "notion-1",
        type: "notion-daily-report",
        data: {
          kind: "action",
          metadata: {
            notionApiKey: "secret_demo_key",
            parentPageId: "demo-parent-page-id",
            aiConsent: true,
            condition: true,
          },
        },
        position: { x: 970, y: 0 },
      },
      {
        nodeId: "gmail-2",
        type: "gmail",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trader inbox",
            recipientEmail: "desk@quantnest.dev",
            condition: false,
          },
        },
        position: { x: 650, y: 185 },
      },
    ],
    edges: [
      { id: "e-price-condition-2", source: "price-1", target: "condition-2" },
      {
        id: "e-condition-zerodha-1",
        source: "condition-2",
        sourceHandle: "true",
        target: "zerodha-1",
      },
      { id: "e-zerodha-notion-1", source: "zerodha-1", target: "notion-1" },
      {
        id: "e-condition-gmail-2",
        source: "condition-2",
        sourceHandle: "false",
        target: "gmail-2",
      },
    ],
  },
  {
    slug: "breakout-execution-with-slack-ops",
    title: "Breakout Execution With Slack Ops Alert",
    summary:
      "Execute a breakout trade, branch post-fill logic with IF, notify the desk on Slack, and merge the execution and notification paths into one reporting tail.",
    category: "Execution",
    market: "Indian",
    difficulty: "Advanced",
    setupMinutes: 16,
    sortOrder: 6,
    nodeFlow: ["Price Trigger", "Zerodha", "If", "Slack", "Merge", "Notion"],
    trigger: "Fires when HDFC breaks above a defined entry level.",
    logic:
      "A price trigger starts the trade. Zerodha places the order. A downstream IF node decides whether to escalate to Slack based on follow-through confirmation, then both execution paths merge into the same report sink.",
    actions: ["Place Zerodha order", "Send Slack DM to ops", "Merge post-trade paths", "Create Notion note"],
    outcomes: [
      "Execution plus team visibility",
      "Cleaner downstream reporting after branching",
      "Reusable example for trade + ops workflows",
    ],
    nodes: [
      {
        nodeId: "price-4",
        type: "price",
        data: {
          kind: "trigger",
          metadata: {
            asset: "HDFC",
            targetPrice: 1750,
            marketType: "indian",
            condition: "above",
          },
        },
        position: { x: 0, y: 110 },
      },
      {
        nodeId: "zerodha-4",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 5,
            symbol: "HDFC",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 280, y: 110 },
      },
      {
        nodeId: "if-2",
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
                          indicator: "ema",
                          symbol: "HDFC",
                          timeframe: "15m",
                          params: { period: 20 },
                        },
                      },
                      operator: ">",
                      right: {
                        type: "indicator",
                        indicator: {
                          indicator: "ema",
                          symbol: "HDFC",
                          timeframe: "15m",
                          params: { period: 50 },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        position: { x: 590, y: 45 },
      },
      {
        nodeId: "slack-2",
        type: "slack",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Execution desk",
            slackBotToken: "xoxb-demo-slack-token",
            slackUserId: "U09EXECOPS",
          },
        },
        position: { x: 930, y: 0 },
      },
      {
        nodeId: "delay-5",
        type: "delay",
        data: {
          kind: "action",
          metadata: {
            durationSeconds: 60,
          },
        },
        position: { x: 930, y: 185 },
      },
      {
        nodeId: "merge-2",
        type: "merge",
        data: {
          kind: "action",
          metadata: {},
        },
        position: { x: 1240, y: 95 },
      },
      {
        nodeId: "notion-3",
        type: "notion-daily-report",
        data: {
          kind: "action",
          metadata: {
            notionApiKey: "secret_demo_key",
            parentPageId: "demo-parent-page-id",
            aiConsent: true,
          },
        },
        position: { x: 1530, y: 95 },
      },
    ],
    edges: [
      { id: "e-price-4-zerodha-4", source: "price-4", target: "zerodha-4" },
      { id: "e-zerodha-4-if-2", source: "zerodha-4", target: "if-2" },
      {
        id: "e-if-2-slack-2",
        source: "if-2",
        sourceHandle: "true",
        target: "slack-2",
      },
      {
        id: "e-if-2-delay-5",
        source: "if-2",
        sourceHandle: "false",
        target: "delay-5",
      },
      { id: "e-slack-2-merge-2", source: "slack-2", target: "merge-2", targetHandle: "in-a" },
      { id: "e-delay-5-merge-2", source: "delay-5", target: "merge-2", targetHandle: "in-b" },
      { id: "e-merge-2-notion-3", source: "merge-2", target: "notion-3" },
    ],
  },
  {
    slug: "bearish-breakout-retest-execution",
    title: "Bearish Breakdown Retest To Zerodha Execution",
    summary:
      "Use a bearish breakdown retest structure to avoid weak breakdowns before short-side execution and reporting.",
    category: "Execution",
    market: "Indian",
    difficulty: "Advanced",
    setupMinutes: 14,
    sortOrder: 12,
    nodeFlow: ["Breakout Retest", "Zerodha", "Notion"],
    trigger: "Runs once after bearish breakdown retest confirms lower.",
    logic:
      "CDSL must break below support, retest the level from underneath, then confirm lower before Zerodha executes and Notion logs the trade.",
    actions: ["Wait for bearish confirmation", "Execute Zerodha sell", "Create Notion note"],
    outcomes: [
      "Better downside entry timing",
      "Cleaner short setup confirmation",
      "Trade capture with automatic reporting",
    ],
    nodes: [
      {
        nodeId: "brt-zerodha-1",
        type: "breakout-retest-trigger",
        data: {
          kind: "trigger",
          metadata: {
            asset: "CDSL",
            marketType: "indian",
            direction: "bearish",
            breakoutLevel: 1225,
            retestTolerancePct: 0.4,
            confirmationMovePct: 0.25,
            retestWindowMinutes: 60,
            confirmationWindowMinutes: 20,
          },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "zerodha-brt-1",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "sell",
            qty: 3,
            symbol: "CDSL",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 360, y: 90 },
      },
      {
        nodeId: "notion-brt-1",
        type: "notion-daily-report",
        data: {
          kind: "action",
          metadata: {
            notionApiKey: "secret_demo_key",
            parentPageId: "demo-parent-page-id",
            aiConsent: true,
          },
        },
        position: { x: 680, y: 90 },
      },
    ],
    edges: [
      { id: "e-brt-zerodha-1", source: "brt-zerodha-1", target: "zerodha-brt-1" },
      { id: "e-zerodha-brt-notion-1", source: "zerodha-brt-1", target: "notion-brt-1" },
    ],
  },
];
