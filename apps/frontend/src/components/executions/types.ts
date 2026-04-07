import type { ExecutionStep } from "@quantnest-trading/types";

export interface Execution {
  _id: string;
  workflowId: string;
  userId: string;
  status: string;
  executionMode?: "live" | "dry-run";
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
