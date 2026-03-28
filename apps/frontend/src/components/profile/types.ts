export type ProfileTab = "account" | "secrets" | "billing" | "notifications" | "danger";
export type MarketPreference = "Indian" | "US" | "Crypto";
export type ThemePreference = "Dark" | "Light";
export type BrokerPreference = "Zerodha" | "Groww" | "Lighter" | "Paper Trading";

export type IntegrationItem = {
  key: string;
  name: string;
  description: string;
  status: "connected" | "available";
  linkedWorkflows: number;
  connectedAccounts?: number;
  managementMode: "workflow-scoped";
};
