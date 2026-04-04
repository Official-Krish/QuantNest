import mongoose from "mongoose";
import { getNodeRegistryEntry } from "@quantnest-trading/node-registry";
import { WorkflowExampleModel } from "./index";

type WorkflowExampleNode = {
  nodeId: string;
  type: string;
  data: {
    kind: "action" | "trigger";
    metadata: Record<string, unknown>;
  };
  position: { x: number; y: number };
};

type WorkflowExampleEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type WorkflowExampleSeed = {
  slug: string;
  title: string;
  summary: string;
  category: "Execution" | "Reporting" | "Alerts" | "AI";
  market: "Indian" | "Crypto" | "Cross-market";
  difficulty: "Starter" | "Intermediate" | "Advanced";
  setupMinutes: number;
  nodeFlow: string[];
  trigger: string;
  logic: string;
  actions: string[];
  outcomes: string[];
  nodes: WorkflowExampleNode[];
  edges: WorkflowExampleEdge[];
  sortOrder: number;
};

export const WORKFLOW_EXAMPLE_SEEDS: WorkflowExampleSeed[] = [
  {
    slug: "rsi-volume-reversal-alert",
    title: "RSI Reversal Alert With AI Reasoning",
    summary:
      "Watch for short-term oversold conditions with volume confirmation, then send a structured AI-backed alert to Gmail or Discord.",
    category: "Alerts",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 8,
    sortOrder: 1,
    nodeFlow: ["Timer", "Conditional", "Gmail"],
    trigger: "Runs every 5 minutes during market hours.",
    logic:
      "RSI(14) below 30 on 5m plus volume spike above average. Optional higher-timeframe EMA alignment improves quality.",
    actions: ["Send Gmail alert", "Send Discord alert", "Attach AI reasoning"],
    outcomes: [
      "Fast pullback awareness",
      "Cleaner signal context for non-screen time",
      "Reduced false positives with volume confirmation",
    ],
    nodes: [
      {
        nodeId: "timer-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 300, marketType: "indian", asset: "CDSL" },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-1",
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
                          indicator: "rsi",
                          symbol: "CDSL",
                          timeframe: "5m",
                          params: { period: 14 },
                        },
                      },
                      operator: "<",
                      right: { type: "value", value: 30 },
                    },
                    {
                      left: {
                        type: "indicator",
                        indicator: {
                          indicator: "volume",
                          symbol: "CDSL",
                          timeframe: "5m",
                          params: {},
                        },
                      },
                      operator: ">",
                      right: { type: "value", value: 1.8 },
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
        nodeId: "gmail-1",
        type: "gmail",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trader inbox",
            recipientEmail: "alerts@quantnest.dev",
            condition: true,
          },
        },
        position: { x: 650, y: 0 },
      },
      {
        nodeId: "discord-1",
        type: "discord",
        data: {
          kind: "action",
          metadata: {
            webhookUrl: "https://discord.com/api/webhooks/example/token",
            condition: false,
          },
        },
        position: { x: 650, y: 185 },
      },
    ],
    edges: [
      { id: "e-timer-condition-1", source: "timer-1", target: "condition-1" },
      {
        id: "e-condition-gmail-1",
        source: "condition-1",
        sourceHandle: "true",
        target: "gmail-1",
      },
      {
        id: "e-condition-discord-1",
        source: "condition-1",
        sourceHandle: "false",
        target: "discord-1",
      },
    ],
  },
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
    slug: "daily-performance-report",
    title: "Daily Performance Report To Notion",
    summary:
      "Generate an end-of-day report for Zerodha-connected workflows with AI commentary, trade review, and structured journal output.",
    category: "Reporting",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 12,
    sortOrder: 3,
    nodeFlow: ["Timer", "Zerodha", "Notion"],
    trigger: "Runs once after market close.",
    logic:
      "Collects daily trade activity, summarizes wins and mistakes, and produces a clean AI-assisted report inside Notion.",
    actions: ["Fetch trade history", "Generate AI review", "Create Notion report page"],
    outcomes: [
      "Daily trade journaling without manual effort",
      "Consistent review discipline",
      "Historical performance visibility",
    ],
    nodes: [
      {
        nodeId: "timer-2",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 86400, marketType: "indian", asset: "HDFC" },
        },
        position: { x: 0, y: 80 },
      },
      {
        nodeId: "zerodha-2",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "sell",
            qty: 1,
            symbol: "HDFC",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 300, y: 80 },
      },
      {
        nodeId: "notion-2",
        type: "notion-daily-report",
        data: {
          kind: "action",
          metadata: {
            notionApiKey: "secret_demo_key",
            parentPageId: "demo-parent-page-id",
            aiConsent: true,
          },
        },
        position: { x: 620, y: 80 },
      },
    ],
    edges: [
      { id: "e-timer-zerodha-2", source: "timer-2", target: "zerodha-2" },
      { id: "e-zerodha-notion-2", source: "zerodha-2", target: "notion-2" },
    ],
  },
  {
    slug: "drive-csv-export",
    title: "Daily Google Drive Trade Export",
    summary:
      "Export today’s trades to CSV, enrich them with AI observations, and push the file to a configured Google Drive folder.",
    category: "AI",
    market: "Cross-market",
    difficulty: "Intermediate",
    setupMinutes: 10,
    sortOrder: 4,
    nodeFlow: ["Timer", "Zerodha", "Google Drive"],
    trigger: "Runs once daily after the reporting window opens.",
    logic:
      "Collects the day’s fills, appends AI confidence and improvement notes, and uploads a timestamped CSV.",
    actions: ["Build CSV", "Attach AI insights", "Upload to Google Drive"],
    outcomes: [
      "Portable daily records",
      "Ops-friendly archive format",
      "Shared review data for teams",
    ],
    nodes: [
      {
        nodeId: "timer-3",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 86400, marketType: "indian", asset: "CDSL" },
        },
        position: { x: 0, y: 80 },
      },
      {
        nodeId: "zerodha-3",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "sell",
            qty: 1,
            symbol: "CDSL",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 300, y: 80 },
      },
      {
        nodeId: "drive-1",
        type: "google-drive-daily-csv",
        data: {
          kind: "action",
          metadata: {
            googleClientEmail: "quantnest-bot@demo.iam.gserviceaccount.com",
            googlePrivateKey:
              "-----BEGIN PRIVATE KEY-----demo-----END PRIVATE KEY-----",
            googleDriveFolderId: "drive-folder-id",
            filePrefix: "quantnest-daily",
            aiConsent: true,
          },
        },
        position: { x: 640, y: 80 },
      },
    ],
    edges: [
      { id: "e-timer-zerodha-3", source: "timer-3", target: "zerodha-3" },
      { id: "e-zerodha-drive-1", source: "zerodha-3", target: "drive-1" },
    ],
  },
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
    slug: "price-telegram-alert",
    title: "Price Trigger Telegram Alert",
    summary:
      "Trigger a one-shot Telegram alert when price crosses a threshold, without requiring a broker execution node downstream.",
    category: "Alerts",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 5,
    sortOrder: 8,
    nodeFlow: ["Price Trigger", "Telegram"],
    trigger: "Runs once when price crosses the target, then pauses automatically.",
    logic:
      "A price trigger watches HDFC below a threshold and sends a Telegram bot message to the selected chat as soon as the level is crossed.",
    actions: ["Watch a live threshold", "Send Telegram alert", "Auto-pause after success"],
    outcomes: [
      "Simple one-shot alerting flow",
      "Good starter example for Telegram setup",
      "Clear separation between trigger asset and notification destination",
    ],
    nodes: [
      {
        nodeId: "price-telegram-1",
        type: "price",
        data: {
          kind: "trigger",
          metadata: {
            asset: "HDFC",
            targetPrice: 1000,
            marketType: "indian",
            condition: "below",
          },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "telegram-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Krish",
            telegramBotToken: "123456789:telegram-demo-token",
            telegramChatId: "859425297",
          },
        },
        position: { x: 350, y: 90 },
      },
    ],
    edges: [
      { id: "e-price-telegram-1", source: "price-telegram-1", target: "telegram-1" },
    ],
  },
  {
    slug: "google-sheets-execution-report",
    title: "Google Sheets Execution Report",
    summary:
      "Append each run summary to Google Sheets so teams can review execution activity in one shared sheet.",
    category: "Reporting",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 6,
    sortOrder: 9,
    nodeFlow: ["Timer", "Zerodha", "Google Sheets Report"],
    trigger: "Runs on a fixed interval and writes a reporting row after execution.",
    logic:
      "Timer starts the workflow, Zerodha action executes, and Google Sheets Report appends execution context to the configured spreadsheet tab.",
    actions: ["Execute Zerodha action", "Append row to Google Sheets"],
    outcomes: [
      "Shared live reporting sheet",
      "Low-friction daily monitoring",
      "No manual copy-paste logging",
    ],
    nodes: [
      {
        nodeId: "timer-gs-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 900, marketType: "indian", asset: "HDFC" },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "zerodha-gs-1",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 1,
            symbol: "HDFC",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 320, y: 90 },
      },
      {
        nodeId: "sheets-1",
        type: "google-sheets-report",
        data: {
          kind: "action",
          metadata: {
            sheetUrl: "https://docs.google.com/spreadsheets/d/1exampleSheetId1234567890abcdef/edit?gid=0#gid=0",
            sheetName: "Execution Logs",
            serviceAccountEmail: "quantnest@your-project.iam.gserviceaccount.com",
          },
        },
        position: { x: 680, y: 90 },
      },
    ],
    edges: [
      { id: "e-timer-gs-1-zerodha-gs-1", source: "timer-gs-1", target: "zerodha-gs-1" },
      { id: "e-zerodha-gs-1-sheets-1", source: "zerodha-gs-1", target: "sheets-1" },
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
  {
    slug: "bullish-breakout-retest-telegram",
    title: "Bullish Breakout Retest Telegram Alert",
    summary:
      "Wait for a breakout, pullback retest, and confirmation before sending a Telegram alert.",
    category: "Alerts",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 8,
    sortOrder: 11,
    nodeFlow: ["Breakout Retest", "Telegram"],
    trigger: "Runs once after breakout, retest, and bullish confirmation.",
    logic:
      "HDFC must break above the level, revisit it within a tolerance band, and then confirm higher before the Telegram message is sent.",
    actions: ["Watch breakout structure", "Wait for retest", "Send Telegram confirmation alert"],
    outcomes: [
      "Fewer fake breakout alerts",
      "Cleaner confirmation-based entries",
      "Simple template for price-action traders",
    ],
    nodes: [
      {
        nodeId: "brt-telegram-1",
        type: "breakout-retest-trigger",
        data: {
          kind: "trigger",
          metadata: {
            asset: "HDFC",
            marketType: "indian",
            direction: "bullish",
            breakoutLevel: 1750,
            retestTolerancePct: 0.35,
            confirmationMovePct: 0.2,
            retestWindowMinutes: 45,
            confirmationWindowMinutes: 20,
          },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "telegram-brt-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Krish",
            telegramBotToken: "123456789:telegram-demo-token",
            telegramChatId: "859425297",
          },
        },
        position: { x: 360, y: 90 },
      },
    ],
    edges: [
      { id: "e-brt-telegram-1", source: "brt-telegram-1", target: "telegram-brt-1" },
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

function assertWorkflowExampleSeeds(seeds: WorkflowExampleSeed[]) {
  for (const example of seeds) {
    const nodeIds = new Set<string>();

    for (const node of example.nodes) {
      if (nodeIds.has(node.nodeId)) {
        throw new Error(
          `Workflow example "${example.slug}" has duplicate nodeId "${node.nodeId}".`,
        );
      }

      nodeIds.add(node.nodeId);

      const registryEntry = getNodeRegistryEntry(node.type);
      if (!registryEntry) {
        throw new Error(
          `Workflow example "${example.slug}" uses unsupported node type "${node.type}".`,
        );
      }

      if (registryEntry.kind !== node.data.kind) {
        throw new Error(
          `Workflow example "${example.slug}" uses node "${node.nodeId}" as kind "${node.data.kind}", but registry defines "${registryEntry.kind}".`,
        );
      }
    }

    for (const edge of example.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(
          `Workflow example "${example.slug}" has edge "${edge.id}" with missing source "${edge.source}".`,
        );
      }

      if (!nodeIds.has(edge.target)) {
        throw new Error(
          `Workflow example "${example.slug}" has edge "${edge.id}" with missing target "${edge.target}".`,
        );
      }
    }
  }
}

assertWorkflowExampleSeeds(WORKFLOW_EXAMPLE_SEEDS);

export async function seedWorkflowExamples() {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/myapp";

  await mongoose.connect(mongoUrl);

  try {
    await WorkflowExampleModel.bulkWrite(
      WORKFLOW_EXAMPLE_SEEDS.map((example) => ({
        updateOne: {
          filter: { slug: example.slug },
          update: { $set: example } as any,
          upsert: true,
        },
      })),
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.main) {
  seedWorkflowExamples()
    .then(() => {
      console.log(`Seeded ${WORKFLOW_EXAMPLE_SEEDS.length} workflow examples.`);
    })
    .catch((error) => {
      console.error("Failed to seed workflow examples:", error);
      process.exit(1);
    });
}
