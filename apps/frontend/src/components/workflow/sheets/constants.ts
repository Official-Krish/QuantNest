export const SUPPORTED_ACTIONS = {
    "Indian": [
        {
            id: "zerodha",
            title: "Zerodha",
            description: "Execute an order on Zerodha",
        },
        {
            id: "groww",
            title: "Groww",
            description: "Execute an order on Groww",
        },
    ],
    "Crypto": [
        {
            id: "lighter",
            title: "Lighter",
            description: "Execute a trade on Lighter",
        },
    ],
    "Notification":[ 
        {
            id: "gmail",
            title: "Gmail",
            description: "Send email notifications for workflow events",
        },
        {
            id: "slack",
            title: "Slack",
            description: "Send Slack direct messages for workflow events",
        },
        {
            id: "discord",
            title: "Discord",
            description: "Send Discord webhook notifications for workflow events",
        },
        {
            id: "whatsapp",
            title: "WhatsApp",
            description: "Send WhatsApp notifications for workflow events",
        }
    ],
    "Reporting": [
        {
            id: "notion-daily-report",
            title: "Notion Daily Report",
            description: "Create a daily AI performance report page in Notion (Zerodha only)",
        },
        {
            id: "google-drive-daily-csv",
            title: "Google Drive Daily CSV",
            description: "After 3:30 PM IST, export Zerodha trades + AI insights to Google Drive once per day",
        },
    ],
    "Flow": [
        {
            id: "conditional-trigger",
            title: "Conditional Trigger",
            description: "Branch this workflow using AND/OR condition groups",
        },
        {
            id: "if",
            title: "If",
            description: "Evaluate a condition mid-workflow and branch into true or false paths",
        },
        {
            id: "delay",
            title: "Delay",
            description: "Wait for a fixed duration before continuing to the next node",
        },
        {
            id: "merge",
            title: "Merge",
            description: "Join multiple branches back into one shared downstream path",
        },
    ],
};

export const SUPPORTED_TRIGGERS = [
  {
    id: "timer",
    title: "Timer",
    description: "Run this trigger every X seconds/minutes/hours/days",
  },
  {
    id: "price-trigger",
    title: "Price Trigger",
    description:
      "Run this trigger when a stock price crosses a certain threshold for an asset",
  },
  {
    id: "conditional-trigger",
    title: "Conditional Trigger",
    description:
      "Run this trigger when a custom condition is met based on data from previous nodes",
  }
];

export const EXCHANGES = [
  { value: "NSE", label: "NSE" },
  { value: "BSE", label: "BSE" },
  { value: "NFO", label: "NFO" },
  { value: "CDS", label: "CDS" },
  { value: "BCD", label: "BCD" },
  { value: "BFO", label: "BFO" },
  { value: "MCX", label: "MCX" },
] as const;
