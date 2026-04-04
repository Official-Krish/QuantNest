import { shouldSkipActionByCondition } from "../execute.context";
import { pushStep, type ActionHandler } from "./shared";

export const noopActionHandler: ActionHandler = async () => {};

export const delayActionHandler: ActionHandler = async ({
  node,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }
    const durationSeconds = Number((resolvedMetadata as any)?.durationSeconds || 0);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      pushStep(steps, {
        nodeId: node.nodeId,
        nodeType: "Delay Action",
        status: "Failed",
        message: "Delay duration is missing or invalid",
      });
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Delay Action",
      status: "Success",
      message: `Waited ${durationSeconds} second${durationSeconds === 1 ? "" : "s"}`,
    });
  } catch (error: any) {
    pushStep(steps, {
      nodeId: node.nodeId,
      nodeType: "Delay Action",
      status: "Failed",
      message: error?.message || "Delay step failed",
    });
  }
};
