import { shouldSkipActionByCondition } from "../execute.context";
import { pushStep } from "./shared";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";

class NoopHandler implements IActionHandler {
  readonly handlerId = "noop" as const;

  async execute(_params: ActionHandlerParams): Promise<void> {}
}

class DelayHandler implements IActionHandler {
  readonly handlerId = "delay" as const;

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, nextCondition, steps, resolvedMetadata } = params;

    try {
      if (
        shouldSkipActionByCondition(
          nextCondition,
          node.data?.metadata?.condition,
        )
      ) {
        return;
      }
      const durationSeconds = Number(
        (resolvedMetadata as any)?.durationSeconds || 0,
      );
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        pushStep(steps, {
          nodeId: node.nodeId,
          nodeType: "Delay Action",
          status: "Failed",
          message: "Delay duration is missing or invalid",
        });
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, durationSeconds * 1000),
      );
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
  }
}

class RecheckHandler implements IActionHandler {
  readonly handlerId = "recheck" as const;

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, nextCondition, steps, resolvedMetadata } = params;

    try {
      if (
        shouldSkipActionByCondition(
          nextCondition,
          node.data?.metadata?.condition,
        )
      ) {
        return;
      }

      const durationSeconds = Number(
        (resolvedMetadata as any)?.durationSeconds || 0,
      );
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        pushStep(steps, {
          nodeId: node.nodeId,
          nodeType: "Recheck Action",
          status: "Failed",
          message: "Recheck duration is missing or invalid",
        });
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, durationSeconds * 1000),
      );
      pushStep(steps, {
        nodeId: node.nodeId,
        nodeType: "Recheck Action",
        status: "Success",
        message: `Waited ${durationSeconds} second${durationSeconds === 1 ? "" : "s"} before re-check`,
      });
    } catch (error: any) {
      pushStep(steps, {
        nodeId: node.nodeId,
        nodeType: "Recheck Action",
        status: "Failed",
        message: error?.message || "Recheck step failed",
      });
    }
  }
}

export const noopHandler: IActionHandler = new NoopHandler();
export const delayHandler: IActionHandler = new DelayHandler();
export const recheckHandler: IActionHandler = new RecheckHandler();
