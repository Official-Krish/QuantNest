import type { WorkflowExampleSeed } from "../../seed.ts";

export const alertExampleSeeds: WorkflowExampleSeed[] = [
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
];
