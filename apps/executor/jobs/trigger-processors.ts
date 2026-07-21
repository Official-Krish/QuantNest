import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import { WorkflowModel } from "@quantnest-trading/db/client";
import { batchCanExecute } from "../services/execution.service";
import { enqueueExecution } from "./workflow.queue";
import {
  evaluateConditionalMetadata,
  handleBreakoutRetestTrigger,
  handleConditionalTrigger,
  handleMarketSessionTrigger,
  handlePortfolioPnlDrawdownTrigger,
  handlePriceTrigger,
} from "../handlers/trigger.handler";
import type { WorkflowType } from "../types";
import {
  ACTIVE_WORKFLOW_QUERY,
  buildDedupeKey,
  findWorkflowTrigger,
  getTimerIntervalSeconds,
} from "./poller.utils";
import pLimit from "p-limit";

const CONCURRENCY = 5;
const limit = pLimit(CONCURRENCY);

export async function processTimerWorkflows(now: Date): Promise<number> {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "timer",
    nextRunAt: { $lte: now },
  }).lean();

  const updates: any[] = [];
  let executed = 0;

  await Promise.allSettled(
    workflows.map((workflow) =>
      limit(async () => {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (!trigger) return;

        const intervalSeconds = getTimerIntervalSeconds(
          workflow as unknown as WorkflowType,
          trigger,
        );
        if (!intervalSeconds) return;

        updates.push({
          updateOne: {
            filter: { _id: workflow._id },
            update: {
              $set: {
                lastEvaluatedAt: now,
                lastTriggeredAt: now,
                nextRunAt: new Date(now.getTime() + intervalSeconds * 1000),
              },
            },
          },
        });

        await enqueueExecution({
          workflowId: workflow._id.toString(),
          userId: workflow.userId.toString(),
          executionMode: workflow.executionMode,
          dedupeKey: buildDedupeKey(workflow._id.toString(), now),
        });
        executed++;
      }),
    ),
  );

  if (updates.length > 0) {
    await WorkflowModel.bulkWrite(updates);
  }

  return executed;
}

export async function processPriceWorkflows(now: Date): Promise<number> {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "price-trigger",
  }).lean();

  const cooldown = await batchCanExecute(
    workflows.map((w) => w._id.toString()),
    now,
  );
  const updates: any[] = [];
  let executed = 0;

  await Promise.allSettled(
    workflows.map((workflow) =>
      limit(async () => {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (!trigger) return;
        if (!cooldown.get(workflow._id.toString())) return;

        const { shouldExecute, snapshot } = await handlePriceTrigger(
          workflow as unknown as WorkflowType,
          trigger,
        );

        updates.push({
          updateOne: {
            filter: { _id: workflow._id },
            update: {
              $set: {
                lastEvaluatedAt: now,
                ...(shouldExecute ? { lastTriggeredAt: now } : {}),
              },
            },
          },
        });

        if (shouldExecute) {
          await enqueueExecution({
            workflowId: workflow._id.toString(),
            userId: workflow.userId.toString(),
            triggerSnapshot: snapshot,
            executionMode: workflow.executionMode,
            dedupeKey: buildDedupeKey(workflow._id.toString(), now),
          });
          executed++;
        }
      }),
    ),
  );

  if (updates.length > 0) {
    await WorkflowModel.bulkWrite(updates);
  }

  return executed;
}

export async function processBreakoutRetestWorkflows(
  now: Date,
): Promise<number> {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "breakout-retest-trigger",
  }).lean();

  const cooldown = await batchCanExecute(
    workflows.map((w) => w._id.toString()),
    now,
  );
  const updates: any[] = [];
  let executed = 0;

  await Promise.allSettled(
    workflows.map((workflow) =>
      limit(async () => {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (!trigger) return;
        if (!cooldown.get(workflow._id.toString())) return;

        const result = await handleBreakoutRetestTrigger(
          workflow as unknown as WorkflowType,
          trigger,
        );

        updates.push({
          updateOne: {
            filter: { _id: workflow._id },
            update: {
              $set: {
                lastEvaluatedAt: now,
                triggerConfig: {
                  ...(workflow.triggerConfig || {}),
                  runtime: result.runtime,
                },
                ...(result.shouldExecute ? { lastTriggeredAt: now } : {}),
              },
            },
          },
        });

        if (result.shouldExecute) {
          await enqueueExecution({
            workflowId: workflow._id.toString(),
            userId: workflow.userId.toString(),
            triggerSnapshot: result.snapshot,
            executionMode: workflow.executionMode,
            dedupeKey: buildDedupeKey(workflow._id.toString(), now),
          });
          executed++;
        }
      }),
    ),
  );

  if (updates.length > 0) {
    await WorkflowModel.bulkWrite(updates);
  }

  return executed;
}

export async function processConditionalWorkflows(now: Date): Promise<number> {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "conditional-trigger",
  }).lean();

  const cooldown = await batchCanExecute(
    workflows.map((w) => w._id.toString()),
    now,
  );
  const updates: any[] = [];
  let executed = 0;

  await Promise.allSettled(
    workflows.map((workflow) =>
      limit(async () => {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (!trigger) return;
        if (!cooldown.get(workflow._id.toString())) return;

        const { shouldEvaluate } = await handleConditionalTrigger(
          trigger.data?.metadata?.timeWindowMinutes,
          trigger.data?.metadata?.startTime
            ? new Date(trigger.data.metadata.startTime)
            : undefined,
        );

        if (!shouldEvaluate) return;

        const { evaluatedCondition, snapshot } =
          await evaluateConditionalMetadata(trigger.data?.metadata);
        if (!evaluatedCondition) return;

        updates.push({
          updateOne: {
            filter: { _id: workflow._id },
            update: {
              $set: {
                lastEvaluatedAt: now,
                lastTriggeredAt: now,
              },
            },
          },
        });

        await enqueueExecution({
          workflowId: workflow._id.toString(),
          userId: workflow.userId.toString(),
          condition: evaluatedCondition,
          triggerSnapshot: snapshot as TriggerEvaluationSnapshot,
          executionMode: workflow.executionMode,
          dedupeKey: buildDedupeKey(workflow._id.toString(), now),
        });
        executed++;
      }),
    ),
  );

  if (updates.length > 0) {
    await WorkflowModel.bulkWrite(updates);
  }

  return executed;
}

export async function processMarketSessionWorkflows(
  now: Date,
): Promise<number> {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "market-session",
  }).lean();

  const cooldown = await batchCanExecute(
    workflows.map((w) => w._id.toString()),
    now,
  );
  const updates: any[] = [];
  let executed = 0;

  await Promise.allSettled(
    workflows.map((workflow) =>
      limit(async () => {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (!trigger) return;
        if (!cooldown.get(workflow._id.toString())) return;

        const event = String(
          trigger.data?.metadata?.event || "market-open",
        ).toLowerCase() as
          | "market-open"
          | "market-close"
          | "at-time"
          | "pause-at-time"
          | "session-window";

        const { shouldExecute, snapshot } = await handleMarketSessionTrigger(
          event,
          workflow.lastTriggeredAt ?? null,
          workflow.lastEvaluatedAt ?? null,
          trigger.data?.metadata?.triggerTime,
          trigger.data?.metadata?.endTime,
          trigger.data?.metadata?.marketType,
        );

        const shouldPauseWorkflow = shouldExecute && event === "pause-at-time";

        updates.push({
          updateOne: {
            filter: { _id: workflow._id },
            update: {
              $set: {
                lastEvaluatedAt: now,
                ...(shouldExecute ? { lastTriggeredAt: now } : {}),
                ...(shouldPauseWorkflow ? { status: "paused" } : {}),
              },
            },
          },
        });

        if (shouldExecute && !shouldPauseWorkflow) {
          await enqueueExecution({
            workflowId: workflow._id.toString(),
            userId: workflow.userId.toString(),
            triggerSnapshot: snapshot,
            executionMode: workflow.executionMode,
            dedupeKey: buildDedupeKey(workflow._id.toString(), now),
          });
          executed++;
        }
      }),
    ),
  );

  if (updates.length > 0) {
    await WorkflowModel.bulkWrite(updates);
  }

  return executed;
}

export async function processPortfolioPnlDrawdownWorkflows(
  now: Date,
): Promise<number> {
  const workflows = await WorkflowModel.find({
    ...ACTIVE_WORKFLOW_QUERY,
    triggerType: "portfolio-pnl-drawdown-trigger",
  }).lean();

  const cooldown = await batchCanExecute(
    workflows.map((w) => w._id.toString()),
    now,
  );
  const updates: any[] = [];
  let executed = 0;

  await Promise.allSettled(
    workflows.map((workflow) =>
      limit(async () => {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (!trigger) return;
        if (!cooldown.get(workflow._id.toString())) return;

        const result = await handlePortfolioPnlDrawdownTrigger(
          workflow as unknown as WorkflowType,
          trigger,
        );

        updates.push({
          updateOne: {
            filter: { _id: workflow._id },
            update: {
              $set: {
                lastEvaluatedAt: now,
                triggerConfig: {
                  ...(workflow.triggerConfig || {}),
                  runtime: result.runtime,
                  lastMeasurement: {
                    mode: result.mode,
                    measuredValue: result.measuredValue,
                    measuredUnit: result.measuredUnit,
                    metrics: result.metrics,
                  },
                },
                ...(result.shouldExecute ? { lastTriggeredAt: now } : {}),
              },
            },
          },
        });

        if (result.shouldExecute) {
          await enqueueExecution({
            workflowId: workflow._id.toString(),
            userId: workflow.userId.toString(),
            triggerSnapshot: result.snapshot,
            executionMode: workflow.executionMode,
            dedupeKey: buildDedupeKey(workflow._id.toString(), now),
          });
          executed++;
        }
      }),
    ),
  );

  if (updates.length > 0) {
    await WorkflowModel.bulkWrite(updates);
  }

  return executed;
}
