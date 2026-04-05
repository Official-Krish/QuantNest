import type { ExecutionStep } from "@quantnest-trading/types";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";
import { shouldSkipActionByCondition } from "../execute.context";

export function pushStep(
  steps: ExecutionStep[],
  step: Omit<ExecutionStep, "step">,
): void {
  steps.push({
    step: steps.length + 1,
    ...step,
  });
}

export type ExecuteActionNodeParams = {
  node: NodeType;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  nextCondition?: boolean;
  steps: ExecutionStep[];
};

export type ActionHandlerParams = ExecuteActionNodeParams & {
  resolvedMetadata: Record<string, unknown>;
  type: string;
};

export type ActionHandler = (params: ActionHandlerParams) => Promise<void>;

export function getNotificationDetailsFallback(
  resolvedMetadata: Record<string, unknown>,
  context: ExecutionContext,
) {
  return {
    symbol: (resolvedMetadata as any)?.symbol || context.details?.symbol,
    exchange: (resolvedMetadata as any)?.exchange || "NSE",
    targetPrice: (resolvedMetadata as any)?.targetPrice,
    aiContext: context.details?.aiContext,
  };
}

export async function executeNotificationAction(
  params: ActionHandlerParams & {
    nodeTypeLabel: string;
    successMessage: string;
    failureType: string;
    failureTitle: string;
    failureMessage: string;
    send: (metadata: Record<string, unknown>, eventType: string, details: any) => Promise<void>;
  },
) {
  const {
    node,
    context,
    nextCondition,
    steps,
    resolvedMetadata,
    nodeTypeLabel,
    successMessage,
    failureType,
    failureTitle,
    failureMessage,
    send,
  } = params;

  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }

    const eventType = context.eventType || "notification";
    const details =
      context.eventType && context.details
        ? context.details
        : getNotificationDetailsFallback(resolvedMetadata, context);

    await send(resolvedMetadata, eventType, details);

    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: nodeTypeLabel,
      status: "Success",
      message: successMessage,
    });
  } catch (error: any) {
    console.error(`${nodeTypeLabel} execution error:`, error);
    if (context.userId) {
      await createUserNotification({
        userId: context.userId,
        workflowId: context.workflowId,
        type: failureType,
        severity: "error",
        title: failureTitle,
        message: failureMessage || error?.message,
        metadata: { nodeId: node.nodeId },
        dedupeKey: `${failureType}:${context.workflowId}:${node.nodeId}`,
        dedupeWindowHours: 2,
      });
    }
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: nodeTypeLabel,
      status: "Failed",
      message: error?.message || failureMessage,
    });
  }
}
