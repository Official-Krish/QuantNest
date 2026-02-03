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
            id: "discord",
            title: "Discord",
            description: "Send Discord webhook notifications for workflow events",
        },
    ]
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
