import { WorkflowModel } from "@quantnest-trading/db/client";
import { deriveWorkflowTriggerState } from "@quantnest-trading/executor-utils";
import { indicatorEngine } from "../services/indicator.engine";
import type { NodeType, WorkflowType } from "../types";

export const ACTIVE_WORKFLOW_QUERY = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

export function isTriggerNode(node: NodeType | null | undefined): boolean {
  return String(node?.data?.kind || "").toLowerCase() === "trigger";
}

export function findWorkflowTrigger(workflow: WorkflowType): NodeType | undefined {
  if (workflow.triggerNodeId) {
    const storedTrigger = workflow.nodes.find((node) => {
      const candidateId = String(node?.nodeId || node?.id || "").trim();
      return candidateId === workflow.triggerNodeId;
    });

    if (storedTrigger && isTriggerNode(storedTrigger)) {
      return storedTrigger as NodeType;
    }
  }

  return workflow.nodes.find((node) => isTriggerNode(node)) as NodeType | undefined;
}

export function getConditionalExpression(trigger: NodeType): unknown {
  return trigger.data?.metadata?.expression;
}

export function getTimerIntervalSeconds(workflow: WorkflowType, trigger: NodeType): number | null {
  const interval = Number(workflow.triggerConfig?.intervalSeconds ?? trigger.data?.metadata?.time);
  if (!Number.isFinite(interval) || interval <= 0) {
    return null;
  }
  return interval;
}

export async function backfillWorkflowTriggerState(now: Date) {
  const workflowsMissingTriggerState = await WorkflowModel.find({
    $and: [
      ACTIVE_WORKFLOW_QUERY,
      {
        $or: [
          { triggerType: { $exists: false } },
          { triggerType: null },
          { triggerNodeId: { $exists: false } },
          { triggerNodeId: null },
          { triggerConfig: { $exists: false } },
          { triggerConfig: null },
          {
            $and: [
              { triggerType: "timer" },
              {
                $or: [{ nextRunAt: { $exists: false } }, { nextRunAt: null }],
              },
            ],
          },
        ],
      },
    ],
  }).limit(100);

  for (const workflow of workflowsMissingTriggerState) {
    const nextState = deriveWorkflowTriggerState(workflow.nodes as NodeType[], now);
    if (!nextState.triggerType) {
      continue;
    }

    await WorkflowModel.updateOne({ _id: workflow._id }, { $set: nextState });
  }
}

export async function registerConditionalExpressions() {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "conditional-trigger",
  }).select({ triggerNodeId: 1, triggerConfig: 1, nodes: 1 });

  for (const workflow of workflows) {
    const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
    const expression =
      workflow.triggerConfig?.expression ?? (trigger ? getConditionalExpression(trigger) : undefined);

    if (expression) {
      indicatorEngine.registerExpression(
        expression as Parameters<typeof indicatorEngine.registerExpression>[0],
      );
    }
  }
}
