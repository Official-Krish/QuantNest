import type { EdgeType, NodeType } from "@quantnest-trading/types";
import type {
  AiModelDescriptor,
  AiStrategyDraftCreateResponse,
  AiStrategyDraftEditRequest,
  AiStrategyDraftSession,
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
  avatarUrl: string;
}

export interface Workflow {
  _id: string;
  workflowName: string;
  nodes: any[];
  edges: any[];
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
  AiStrategyDraftSession,
  AiStrategyDraftCreateResponse,
  AiStrategyDraftEditRequest,
};
