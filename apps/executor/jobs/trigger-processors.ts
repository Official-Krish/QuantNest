import { WorkflowModel } from "@quantnest-trading/db/client";
import { canExecute, executeWorkflowSafe } from "../services/execution.service";
import {
  evaluateConditionalMetadata,
  handleBreakoutRetestTrigger,
  handleConditionalTrigger,
  handleMarketSessionTrigger,
  handlePriceTrigger,
} from "../handlers/trigger.handler";
import type { WorkflowType } from "../types";
import {
  ACTIVE_WORKFLOW_QUERY,
  findWorkflowTrigger,
  getTimerIntervalSeconds,
} from "./poller.utils";

export async function processTimerWorkflows(now: Date) {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "timer",
    nextRunAt: { $lte: now },
  });

  for (const workflow of workflows) {
    try {
      const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
      if (!trigger) {
        continue;
      }

      const intervalSeconds = getTimerIntervalSeconds(workflow as unknown as WorkflowType, trigger);
      if (!intervalSeconds) {
        continue;
      }

      await WorkflowModel.updateOne(
        { _id: workflow._id },
        {
          $set: {
            lastEvaluatedAt: now,
            lastTriggeredAt: now,
            nextRunAt: new Date(now.getTime() + intervalSeconds * 1000),
          },
        },
      );

      await executeWorkflowSafe(workflow as unknown as WorkflowType);
    } catch (err) {
      console.error(`Timer workflow error (${workflow.workflowName})`, err);
    }
  }
}

export async function processPriceWorkflows(now: Date) {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "price-trigger",
  });

  for (const workflow of workflows) {
    try {
      const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
      if (!trigger) continue;
      if (!(await canExecute(workflow._id.toString()))) continue;

      const shouldExecute = await handlePriceTrigger(workflow as unknown as WorkflowType, trigger);

      await WorkflowModel.updateOne(
        { _id: workflow._id },
        {
          $set: {
            lastEvaluatedAt: now,
            ...(shouldExecute ? { lastTriggeredAt: now } : {}),
          },
        },
      );

      if (shouldExecute) {
        await executeWorkflowSafe(workflow as unknown as WorkflowType);
      }
    } catch (err) {
      console.error(`Price workflow error (${workflow.workflowName})`, err);
    }
  }
}

export async function processBreakoutRetestWorkflows(now: Date) {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "breakout-retest-trigger",
  });

  for (const workflow of workflows) {
    try {
      const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
      if (!trigger) continue;
      if (!(await canExecute(workflow._id.toString()))) continue;

      const result = await handleBreakoutRetestTrigger(
        workflow as unknown as WorkflowType,
        trigger,
      );

      await WorkflowModel.updateOne(
        { _id: workflow._id },
        {
          $set: {
            lastEvaluatedAt: now,
            triggerConfig: {
              ...(workflow.triggerConfig || {}),
              runtime: result.runtime,
            },
            ...(result.shouldExecute ? { lastTriggeredAt: now } : {}),
          },
        },
      );

      if (result.shouldExecute) {
        await executeWorkflowSafe(workflow as unknown as WorkflowType);
      }
    } catch (err) {
      console.error(`Breakout retest workflow error (${workflow.workflowName})`, err);
    }
  }
}

export async function processConditionalWorkflows(now: Date) {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "conditional-trigger",
  });

  for (const workflow of workflows) {
    try {
      const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
      if (!trigger) continue;
      if (!(await canExecute(workflow._id.toString()))) continue;

      const shouldEvaluate = await handleConditionalTrigger(
        trigger.data?.metadata?.timeWindowMinutes,
        trigger.data?.metadata?.startTime ? new Date(trigger.data.metadata.startTime) : undefined,
      );

      await WorkflowModel.updateOne(
        { _id: workflow._id },
        {
          $set: {
            lastEvaluatedAt: now,
          },
        },
      );

      if (!shouldEvaluate) {
        continue;
      }

      const condition = await evaluateConditionalMetadata(trigger.data?.metadata);
      if (!condition) {
        continue;
      }

      await WorkflowModel.updateOne(
        { _id: workflow._id },
        {
          $set: {
            lastTriggeredAt: now,
          },
        },
      );

      await executeWorkflowSafe(workflow as unknown as WorkflowType, condition);
    } catch (err) {
      console.error(`Conditional workflow error (${workflow.workflowName})`, err);
    }
  }
}

export async function processMarketSessionWorkflows(now: Date) {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "market-session",
  });

  for (const workflow of workflows) {
    try {
      const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
      if (!trigger) continue;
      if (!(await canExecute(workflow._id.toString()))) continue;

      const event = String(trigger.data?.metadata?.event || "market-open").toLowerCase() as
        | "market-open"
        | "market-close"
        | "at-time"
        | "pause-at-time"
        | "session-window";

      const shouldExecute = await handleMarketSessionTrigger(
        event,
        workflow.lastTriggeredAt ?? null,
        workflow.lastEvaluatedAt ?? null,
        trigger.data?.metadata?.triggerTime,
        trigger.data?.metadata?.endTime,
        trigger.data?.metadata?.marketType,
      );

      const shouldPauseWorkflow = shouldExecute && event === "pause-at-time";

      await WorkflowModel.updateOne(
        { _id: workflow._id },
        {
          $set: {
            lastEvaluatedAt: now,
            ...(shouldExecute ? { lastTriggeredAt: now } : {}),
            ...(shouldPauseWorkflow ? { status: "paused" } : {}),
          },
        },
      );

      if (shouldExecute) {
        if (shouldPauseWorkflow) {
          continue;
        }
        await executeWorkflowSafe(workflow as unknown as WorkflowType);
      }
    } catch (err) {
      console.error(`Market session workflow error (${workflow.workflowName})`, err);
    }
  }
}
