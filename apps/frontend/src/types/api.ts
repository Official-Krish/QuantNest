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

export type marketStatus = {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
}
