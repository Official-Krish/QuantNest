import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";

export interface IExecutionJobData {
  workflowId: string;
  userId: string;
  condition?: boolean;
  triggerSnapshot?: TriggerEvaluationSnapshot;
  executionMode?: "live" | "dry-run";
}
