import type { ExecutionStep } from "@n8n-trading/types";

export interface Execution {
  _id: string;
  workflowId: string;
  userId: string;
  status: string;
  steps: ExecutionStep[];
  startTime: string;
  endTime?: string;
}

export type ExecutionStatusFilter = "All" | "Success" | "Failed" | "InProgress";

export interface ExecutionMetrics {
  successCount: number;
  failedCount: number;
  inProgressCount: number;
  totalCount: number;
  successRate: number;
  avgDurationMs: number;
}
