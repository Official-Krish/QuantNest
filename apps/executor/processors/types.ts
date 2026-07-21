import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import type { NodeType, WorkflowType } from "../types";

export type BulkWriteUpdate = {
  updateOne: {
    filter: Record<string, unknown>;
    update: Record<string, unknown>;
  };
};

export interface ProcessResult {
  executed: number;
  updates: BulkWriteUpdate[];
}

export interface TriggerHandlerResult {
  shouldExecute: boolean;
  snapshot: Partial<TriggerEvaluationSnapshot>;
  extraUpdates?: Record<string, unknown>;
  condition?: boolean;
  skipEnqueue?: boolean;
}

export interface IWorkflowProcessor {
  readonly triggerType: string;
  process(now: Date): Promise<ProcessResult>;
}

export interface IWorkflowHandler {
  evaluate(
    workflow: WorkflowType,
    trigger: NodeType,
    now: Date,
  ): Promise<TriggerHandlerResult>;
}
