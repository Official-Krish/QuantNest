import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import {
  ExecutionModel,
  ExecutionTraceModel,
  WorkflowModel,
} from "@quantnest-trading/db/client";
import {
  createUserNotification,
  pauseWorkflow,
} from "@quantnest-trading/executor-utils";
import { executeWorkflow } from "../workflow/execute";
import type { WorkflowType } from "../types";
import { EXECUTION_COOLDOWN_MS } from "../config/constants";

export async function canExecute(workflowId: string): Promise<boolean> {
  const lastExecution = await ExecutionModel.findOne({ workflowId })
    .sort({ startTime: -1 })
    .select({ startTime: 1, _id: 0 })
    .lean();

  if (!lastExecution) return true;

  return Date.now() - lastExecution.startTime.getTime() > EXECUTION_COOLDOWN_MS;
}

export async function executeWorkflowSafe(
  workflow: WorkflowType,
  condition?: boolean,
  triggerSnapshot?: TriggerEvaluationSnapshot,
) {
  const executionMode = workflow.executionMode || "live";
  const execution = await ExecutionModel.create({
    workflowId: workflow._id,
    userId: workflow.userId,
    status: "InProgress",
    executionMode,
    steps: [],
    startTime: new Date(),
  });

  try {
    const res = await executeWorkflow(
      workflow.nodes,
      workflow.edges,
      workflow.userId.toString(),
      workflow._id.toString(),
      condition,
      executionMode,
      triggerSnapshot,
    );
    execution.status = res.status;
    execution.set("steps", res.steps);

    if (res.trace && res.trace.nodeEntries.length > 0) {
      await ExecutionTraceModel.create({
        executionId: execution._id,
        workflowId: workflow._id,
        userId: workflow.userId,
        trigger: res.trace.triggerSnapshot || {},
        nodes: res.trace.nodeEntries,
        branchDecisions: res.trace.branchDecisions,
        startTime: execution.startTime,
        endTime: execution.endTime || new Date(),
      }).catch((err) => {
        console.error("Failed to save execution trace:", err);
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Execution error (${workflow.workflowName})`, err);
    execution.status = "Failed";
    execution.set("steps", [
      {
        step: 0,
        nodeId: "",
        nodeType: "",
        status: "Failed",
        message,
      },
    ]);
  } finally {
    execution.endTime = new Date();
    await execution.save();

    if (
      execution.status === "Success" &&
      workflow.triggerType &&
      workflow.triggerType !== "timer"
    ) {
      const persistedWorkflow = await WorkflowModel.findById(workflow._id)
        .select({ status: 1, _id: 0 })
        .lean();
      if (persistedWorkflow?.status !== "paused") {
        await pauseWorkflow(workflow._id.toString());
        await createUserNotification({
          userId: workflow.userId.toString(),
          workflowId: workflow._id.toString(),
          workflowName: workflow.workflowName,
          type: "workflow_auto_paused_after_one_shot_trigger",
          severity: "info",
          title: "Workflow paused after one-time trigger run",
          message: `${workflow.workflowName} ran successfully and was paused automatically because ${workflow.triggerType} workflows are one-shot triggers.`,
          metadata: { triggerType: workflow.triggerType },
          dedupeKey: `workflow-one-shot-paused:${workflow._id}`,
          dedupeWindowHours: 24,
        });
      }
    }

    if (execution.status === "Failed") {
      const recentExecutions = await ExecutionModel.find({
        workflowId: workflow._id,
      })
        .sort({ startTime: -1 })
        .limit(5)
        .select({ status: 1, _id: 0 })
        .lean();

      const nonFailureIndex = recentExecutions.findIndex(
        (item) => item.status !== "Failed",
      );
      const failureCount =
        nonFailureIndex === -1 ? recentExecutions.length : nonFailureIndex;

      if (failureCount >= 3) {
        await createUserNotification({
          userId: workflow.userId.toString(),
          workflowId: workflow._id.toString(),
          workflowName: workflow.workflowName,
          type: "workflow_failed_multiple_times",
          severity: "warning",
          title: "Workflow has failed multiple times",
          message: `${workflow.workflowName} has failed ${failureCount} times in a row.`,
          metadata: { failureCount },
          dedupeKey: `workflow-fail-streak:${workflow._id}:${Math.min(failureCount, 5)}`,
          dedupeWindowHours: 12,
        });
      }

      if (failureCount >= 5) {
        const persistedWorkflow = await WorkflowModel.findById(workflow._id)
          .select({ status: 1, _id: 0 })
          .lean();
        if (persistedWorkflow?.status !== "paused") {
          await pauseWorkflow(workflow._id.toString());
          await createUserNotification({
            userId: workflow.userId.toString(),
            workflowId: workflow._id.toString(),
            workflowName: workflow.workflowName,
            type: "workflow_auto_paused_after_failures",
            severity: "error",
            title: "Workflow auto-paused after repeated failures",
            message: `${workflow.workflowName} was paused automatically after ${failureCount} consecutive failed executions.`,
            metadata: { failureCount },
            dedupeKey: `workflow-auto-paused:${workflow._id}`,
            dedupeWindowHours: 24,
          });
        }
      }
    }
  }
}
