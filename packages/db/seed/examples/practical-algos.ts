import type { WorkflowExampleSeed } from "../../seed.ts";

export const practicalAlgoSeeds: WorkflowExampleSeed[] = [
  {
    slug: "orb-opening-range-breakout",
    title: "Opening Range Breakout (ORB)",
    summary:
      "Intraday ORB template for liquid NSE symbols. Tracks post-open momentum and triggers when price breaks the opening range with supportive volume. Users only need to tune symbol, breakout level, quantity, and risk controls.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 12,
    sortOrder: 1,
    nodeFlow: ["Market Session", "Conditional", "Zerodha", "Telegram"],
    trigger: "Starts at 09:15 IST and checks breakout confirmation on 5m candles.",
    logic:
      "Confirms ORB with two filters: (1) price crossing above opening range proxy level, and (2) volume above threshold. This reduces first-candle fakeouts.",
    actions: ["Track open", "Confirm price + volume breakout", "Send Telegram alert", "Place broker order"],
    outcomes: [
      "Captures high-momentum opening moves",
      "Avoids weak breakouts with volume confirmation",
      "Ready-to-deploy ORB structure for intraday traders",
    ],
    nodes: [
      {
        nodeId: "session-1",
        type: "market-session",
        data: {
          kind: "trigger",
          metadata: {
            marketType: "indian",
            event: "at-time",
            triggerTime: "09:15",
          },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-orb-1",
        type: "conditional-trigger",
        data: {
          kind: "trigger",
          metadata: {
            marketType: "Indian",
            asset: "NIFTY",
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
                          symbol: "NIFTY",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "price",
                        },
                      },
                      operator: "crosses_above",
                      right: { type: "value", value: 21500 },
                    },
                    {
                      type: "clause",
                      left: {
                        type: "indicator",
                        indicator: {
                          symbol: "NIFTY",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "volume",
                        },
                      },
                      operator: ">",
                      right: { type: "value", value: 120000 },
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
        nodeId: "telegram-orb-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trading desk",
            telegramBotToken: "123456789:tele-demo-token-1234567890",
            telegramChatId: "859425297",
          },
        },
        position: { x: 650, y: 0 },
      },
      {
        nodeId: "zerodha-orb-1",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 1,
            symbol: "NIFTY",
            exchange: "NSE",
            apiKey: "DEMO123456",
            accessToken: "access.demo.token.demo123456",
          },
        },
        position: { x: 970, y: 0 },
      },
    ],
    edges: [
      { id: "e-session-condition-orb", source: "session-1", target: "condition-orb-1" },
      { id: "e-condition-telegram-orb", source: "condition-orb-1", sourceHandle: "true", target: "telegram-orb-1" },
      { id: "e-condition-zerodha-orb", source: "condition-orb-1", sourceHandle: "true", target: "zerodha-orb-1" },
    ],
  },
  {
    slug: "vwap-reclaim-alert",
    title: "VWAP Reclaim",
    summary:
      "VWAP-style reclaim template for momentum continuation entries. Uses EMA stack + reclaim behavior as a practical fallback signal so traders can tune levels and deploy quickly.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 10,
    sortOrder: 2,
    nodeFlow: ["Timer", "Conditional", "Telegram"],
    trigger: "Runs every 5 minutes during market hours to evaluate reclaim setup.",
    logic:
      "Requires trend alignment (EMA20 above EMA50) and a fresh price reclaim above EMA20. This behaves like VWAP reclaim confirmation when VWAP feed is unavailable.",
    actions: ["Monitor trend stack", "Detect reclaim confirmation", "Send alert"],
    outcomes: [
      "Cleaner continuation entries",
      "Reduced counter-trend signals",
      "Simple reclaim workflow users can adapt fast",
    ],
    nodes: [
      {
        nodeId: "timer-vwap-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 300, marketType: "indian", asset: "HDFC" },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-vwap-1",
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
                    {
                      type: "clause",
                      left: {
                        type: "indicator",
                        indicator: {
                          symbol: "HDFC",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "ema",
                          params: { period: 20 },
                        },
                      },
                      operator: ">",
                      right: {
                        type: "indicator",
                        indicator: {
                          symbol: "HDFC",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "ema",
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
        nodeId: "telegram-vwap-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trading desk",
            telegramBotToken: "123456789:tele-demo-token-1234567890",
            telegramChatId: "859425297",
          },
        },
        position: { x: 650, y: 0 },
      },
    ],
    edges: [
      { id: "e-timer-condition-vwap", source: "timer-vwap-1", target: "condition-vwap-1" },
      { id: "e-condition-telegram-vwap", source: "condition-vwap-1", sourceHandle: "true", target: "telegram-vwap-1" },
    ],
  },
  {
    slug: "ema-pullback-continuation",
    title: "EMA Pullback Continuation",
    summary:
      "Trend-following pullback template that waits for dip-and-reclaim around EMA20 while keeping EMA20 above EMA50. Suitable for intraday continuation on strong names.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 11,
    sortOrder: 3,
    nodeFlow: ["Timer", "Conditional", "Slack"],
    trigger: "Checks pullback-reclaim structure every 5 minutes.",
    logic:
      "Requires both trend filter (EMA20 > EMA50) and price reclaim signal (price crossing above EMA20) before alerting.",
    actions: ["Monitor EMA trend", "Detect pullback reclaim", "Send Slack notification"],
    outcomes: [
      "Higher-quality continuation entries",
      "Avoids entries against short-term trend",
      "Reusable EMA template for watchlist symbols",
    ],
    nodes: [
      {
        nodeId: "timer-ema-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 300, marketType: "indian", asset: "RELIANCE" },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-ema-1",
        type: "conditional-trigger",
        data: {
          kind: "trigger",
          metadata: {
            marketType: "Indian",
            asset: "RELIANCE",
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
                          symbol: "RELIANCE",
                          timeframe: "15m",
                          marketType: "Indian",
                          indicator: "price",
                        },
                      },
                      operator: "crosses_above",
                      right: {
                        type: "indicator",
                        indicator: {
                          symbol: "RELIANCE",
                          timeframe: "15m",
                          marketType: "Indian",
                          indicator: "ema",
                          params: { period: 20 },
                        },
                      },
                    },
                    {
                      type: "clause",
                      left: {
                        type: "indicator",
                        indicator: {
                          symbol: "RELIANCE",
                          timeframe: "15m",
                          marketType: "Indian",
                          indicator: "ema",
                          params: { period: 20 },
                        },
                      },
                      operator: ">",
                      right: {
                        type: "indicator",
                        indicator: {
                          symbol: "RELIANCE",
                          timeframe: "15m",
                          marketType: "Indian",
                          indicator: "ema",
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
        nodeId: "slack-ema-1",
        type: "slack",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trading desk",
            slackBotToken: "demo-token",
            slackUserId: "demo-user-id",
          },
        },
        position: { x: 650, y: 0 },
      },
    ],
    edges: [
      { id: "e-timer-condition-ema", source: "timer-ema-1", target: "condition-ema-1" },
      { id: "e-condition-slack-ema", source: "condition-ema-1", sourceHandle: "true", target: "slack-ema-1" },
    ],
  },
  {
    slug: "rsi-mean-reversion",
    title: "RSI Mean Reversion",
    summary:
      "Mean-reversion entry template for oversold bounce setups. Fires on RSI recovery from extreme zones to avoid knife-catching while still entering early.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 9,
    sortOrder: 4,
    nodeFlow: ["Timer", "Conditional", "Groww"],
    trigger: "Runs every 5 minutes and checks RSI reversal signal.",
    logic:
      "Uses RSI(14) crossing back above 30 as confirmation that selling pressure is easing after an oversold stretch.",
    actions: ["Monitor RSI extremes", "Detect RSI recovery", "Execute broker order"],
    outcomes: [
      "Cleaner mean-reversion entries",
      "Avoids premature catches before reversal starts",
      "Fast, rule-based bounce strategy template",
    ],
    nodes: [
      {
        nodeId: "timer-rsi-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 300, marketType: "indian", asset: "INFY" },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-rsi-1",
        type: "conditional-trigger",
        data: {
          kind: "trigger",
          metadata: {
            marketType: "Indian",
            asset: "INFY",
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
                          symbol: "INFY",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "rsi",
                          params: { period: 14 },
                        },
                      },
                      operator: "crosses_above",
                      right: { type: "value", value: 30 },
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
        nodeId: "groww-rsi-1",
        type: "groww",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 2,
            symbol: "INFY",
            exchange: "NSE",
          },
        },
        position: { x: 650, y: 0 },
      },
    ],
    edges: [
      { id: "e-timer-condition-rsi", source: "timer-rsi-1", target: "condition-rsi-1" },
      { id: "e-condition-groww-rsi", source: "condition-rsi-1", sourceHandle: "true", target: "groww-rsi-1" },
    ],
  },
  {
    slug: "high-volume-breakout",
    title: "High Volume Breakout",
    summary:
      "Breakout confirmation template that requires both price expansion and participation (volume). Built for traders who want fewer but higher-conviction breakout signals.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Advanced",
    setupMinutes: 13,
    sortOrder: 5,
    nodeFlow: ["Timer", "Conditional", "Telegram"],
    trigger: "Checks breakout + participation every 5 minutes.",
    logic:
      "Price must cross breakout level and 5m volume must exceed configured threshold. Traders can tune level and threshold per symbol liquidity.",
    actions: ["Monitor breakout", "Check volume spike", "Send confirmation alert"],
    outcomes: [
      "Higher-conviction breakout entries",
      "Lower false breakout rate",
      "Practical confirmation model for intraday setups",
    ],
    nodes: [
      {
        nodeId: "timer-hvb-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 300, marketType: "indian", asset: "TCS" },
        },
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "condition-hvb-1",
        type: "conditional-trigger",
        data: {
          kind: "trigger",
          metadata: {
            marketType: "Indian",
            asset: "TCS",
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
                          symbol: "TCS",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "price",
                        },
                      },
                      operator: "crosses_above",
                      right: { type: "value", value: 3750 },
                    },
                    {
                      type: "clause",
                      left: {
                        type: "indicator",
                        indicator: {
                          symbol: "TCS",
                          timeframe: "5m",
                          marketType: "Indian",
                          indicator: "volume",
                        },
                      },
                      operator: ">",
                      right: { type: "value", value: 300000 },
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
        nodeId: "telegram-hvb-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trading desk",
            telegramBotToken: "123456789:tele-demo-token-1234567890",
            telegramChatId: "859425297",
          },
        },
        position: { x: 650, y: 0 },
      },
    ],
    edges: [
      { id: "e-timer-condition-hvb", source: "timer-hvb-1", target: "condition-hvb-1" },
      { id: "e-condition-telegram-hvb", source: "condition-hvb-1", sourceHandle: "true", target: "telegram-hvb-1" },
    ],
  },
  {
    slug: "bups-breakout-retest-confirmation",
    title: "Breakout Retest (BUPS Style)",
    summary:
      "BUPS structure template for breakout traders: breakout -> retest -> confirmation. Built to avoid impulsive entries and wait for structural confirmation before action.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Advanced",
    setupMinutes: 14,
    sortOrder: 6,
    nodeFlow: ["Breakout Retest Trigger", "Telegram", "Zerodha"],
    trigger:
      "Fires once when breakout, retest, and confirmation all complete within configured windows.",
    logic:
      "The trigger state machine tracks pattern stages and expires stale setups if retest/confirmation does not happen in time.",
    actions: ["Watch breakout", "Validate retest", "Wait confirmation", "Execute + alert"],
    outcomes: [
      "Better entry timing than raw breakouts",
      "Reduced fake breakout whipsaws",
      "Clear structure for stop and invalidation planning",
    ],
    nodes: [
      {
        nodeId: "brt-bups-1",
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
        position: { x: 0, y: 95 },
      },
      {
        nodeId: "telegram-bups-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trading desk",
            telegramBotToken: "123456789:tele-demo-token-1234567890",
            telegramChatId: "859425297",
          },
        },
        position: { x: 320, y: 0 },
      },
      {
        nodeId: "zerodha-bups-1",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 5,
            symbol: "HDFC",
            exchange: "NSE",
            apiKey: "DEMO123456",
            accessToken: "access.demo.token.demo123456",
          },
        },
        position: { x: 640, y: 0 },
      },
    ],
    edges: [
      { id: "e-brt-telegram-bups", source: "brt-bups-1", target: "telegram-bups-1" },
      { id: "e-brt-zerodha-bups", source: "brt-bups-1", target: "zerodha-bups-1" },
    ],
  },
  {
    slug: "daily-loss-cap-risk-control",
    title: "Daily Loss Cap (Risk Control)",
    summary:
      "Portfolio risk-control template that triggers when daily realized/unrealized loss breaches a fixed cap. Helps enforce hard daily stop discipline.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 8,
    sortOrder: 7,
    nodeFlow: ["Portfolio Risk Trigger", "Telegram"],
    trigger:
      "Fires when account daily PnL drops past configured loss threshold (for example -₹5,000).",
    logic:
      "Designed as a hard guardrail. Once threshold is breached, workflow sends immediate risk notification so desk can halt fresh entries.",
    actions: ["Monitor daily PnL", "Detect loss cap breach", "Send risk alert"],
    outcomes: [
      "Prevents catastrophic daily losses",
      "Enforces non-negotiable risk discipline",
      "Clear operational signal to stop trading",
    ],
    nodes: [
      {
        nodeId: "portfolio-loss-cap-1",
        type: "portfolio-pnl-drawdown-trigger",
        data: {
          kind: "trigger",
          metadata: {
            broker: "zerodha",
            mode: "daily-loss-cap",
            thresholdValue: 5000,
            thresholdUnit: "absolute",
            apiKey: "DEMO123456",
            accessToken: "demo-access-token-123",
          },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "telegram-loss-cap-1",
        type: "telegram",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Risk desk",
            telegramBotToken: "123456789:tele-demo-token-1234567890",
            telegramChatId: "859425297",
          },
        },
        position: { x: 350, y: 90 },
      },
    ],
    edges: [
      { id: "e-portfolio-loss-cap-telegram", source: "portfolio-loss-cap-1", target: "telegram-loss-cap-1" },
    ],
  },
  {
    slug: "profit-target-lock-execution",
    title: "Profit Target Lock",
    summary:
      "Profit-lock template that alerts when daily target is hit, helping traders protect green days and avoid giving back profits in late-session chop.",
    category: "Practical-Algos",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 8,
    sortOrder: 8,
    nodeFlow: ["Portfolio Risk Trigger", "Slack"],
    trigger:
      "Fires when account daily PnL crosses configured profit target (for example +₹10,000).",
    logic:
      "Acts as end-of-day discipline automation: alert on target hit, then traders can reduce size or stop trading to preserve gains.",
    actions: ["Monitor daily profit", "Detect profit target", "Send confirmation alert"],
    outcomes: [
      "Disciplined profit-taking behavior",
      "Reduced giveback risk after strong start",
      "Clear lock-profit signal for discretionary desks",
    ],
    nodes: [
      {
        nodeId: "portfolio-profit-target-1",
        type: "portfolio-pnl-drawdown-trigger",
        data: {
          kind: "trigger",
          metadata: {
            broker: "zerodha",
            mode: "profit-target",
            thresholdValue: 10000,
            thresholdUnit: "absolute",
            apiKey: "DEMO123456",
            accessToken: "demo-access-token-123",
          },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "slack-profit-target-1",
        type: "slack",
        data: {
          kind: "action",
          metadata: {
            recipientName: "Trading desk",
            slackBotToken: "demo-token",
            slackUserId: "demo-user-id",
          },
        },
        position: { x: 350, y: 90 },
      },
    ],
    edges: [
      { id: "e-portfolio-profit-target-slack", source: "portfolio-profit-target-1", target: "slack-profit-target-1" },
    ],
  },
];
