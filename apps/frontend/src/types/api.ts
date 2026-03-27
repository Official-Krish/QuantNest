import type { EdgeType, NodeType } from "@quantnest-trading/types";
import type {
  AiModelDescriptor,
  AiStrategyDraftCreateResponse,
  AiStrategyConversationMessage,
  AiStrategyDraftEditRequest,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategySetupState,
  AiStrategyWorkflowVersion,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
} from "@quantnest-trading/types/ai";

export interface IdResponse {
  message: string;
  workflowId?: string;
  userId?: string;
}

export interface SigninResponse {
  message: string;
  userId: string;
  avatarUrl?: string;
}

export type ProfileMarketPreference = "Indian" | "US" | "Crypto";
export type ProfileBrokerPreference = "Zerodha" | "Groww" | "Lighter" | "Paper Trading";
export type ProfileThemePreference = "Dark" | "Light";

export interface UserProfilePreferences {
  defaultMarket: ProfileMarketPreference;
  defaultBroker: ProfileBrokerPreference;
  theme: ProfileThemePreference;
}

export interface UserProfileNotifications {
  workflowAlerts: boolean;
}

export interface UserProfileIntegration {
  key: string;
  name: string;
  description: string;
  status: "connected" | "available";
  linkedWorkflows: number;
  connectedAccounts?: number;
  managementMode: "workflow-scoped";
}

export interface UserProfileStats {
  totalWorkflows: number;
  totalExecutions: number;
  executionsThisMonth: number;
  connectedIntegrations: number;
}

export interface UserProfileResponse {
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  memberSince: string;
  accountStatus: string;
  preferences: UserProfilePreferences;
  notifications: UserProfileNotifications;
  stats: UserProfileStats;
  integrations: UserProfileIntegration[];
}

export interface Workflow {
  _id: string;
  workflowName: string;
  nodes: any[];
  edges: any[];
  updatedAt?: Date;
  status?: "active" | "paused";
  marketType?: "Indian" | "Crypto";
}

export interface UserNotification {
  _id: string;
  userId: string;
  workflowId?: string;
  workflowName?: string;
  type: string;
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface WorkflowExample {
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
  nodes: NodeType[];
  edges: EdgeType[];
}

export type marketStatus = {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
}

export type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategySetupState,
  AiStrategyWorkflowVersion,
  AiStrategyDraftCreateResponse,
  AiStrategyDraftEditRequest,
};
