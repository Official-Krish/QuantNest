export type ApprovalRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export interface ApprovalRequest {
  id: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  executionId?: string;
  status: ApprovalRequestStatus;
  nodeType: string;
  prompt: string;
  proposedAction: Record<string, unknown>;
  metadata: Record<string, unknown>;
  approvedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  createdAt: string;
  dedupeKey?: string;
}
