import { WorkflowModel } from "@quantnest-trading/db/client";
import { batchCanExecute } from "../services/execution.service";
import { enqueueExecution } from "../jobs/workflow.queue";
import { buildDedupeKey, findWorkflowTrigger } from "../jobs/poller.utils";
import type { WorkflowType } from "../types";
import type {
  BulkWriteUpdate,
  IWorkflowHandler,
  IWorkflowProcessor,
  ProcessResult,
} from "./types";
import pLimit from "p-limit";

const CONCURRENCY = 5;

export abstract class BaseWorkflowProcessor implements IWorkflowProcessor {
  abstract readonly triggerType: string;
  protected abstract readonly handler: IWorkflowHandler;
  protected abstract readonly query: Record<string, unknown>;
  private readonly limit = pLimit(CONCURRENCY);

  async process(now: Date): Promise<ProcessResult> {
    const workflows = await WorkflowModel.find({
      ...ACTIVE_WORKFLOW_QUERY,
      ...this.query,
    }).lean();

    const cooldownMap = await batchCanExecute(
      workflows.map((w) => w._id.toString()),
      now,
    );

    const results = await Promise.allSettled(
      workflows.map((wf) =>
        this.limit(async () => {
          const workflow = wf as unknown as WorkflowType;
          return this.processOne(workflow, now, cooldownMap);
        }),
      ),
    );

    const updates: BulkWriteUpdate[] = [];
    let executed = 0;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const value = result.value;
        updates.push(...value.updates);
        executed += value.executed;
      }
    }

    if (updates.length > 0) {
      await WorkflowModel.bulkWrite(updates);
    }

    return { executed, updates };
  }

  private async processOne(
    workflow: WorkflowType,
    now: Date,
    cooldownMap: Map<string, boolean>,
  ): Promise<{ updates: BulkWriteUpdate[]; executed: number } | null> {
    const trigger = findWorkflowTrigger(workflow);
    if (!trigger) return null;

    const workflowId = workflow._id.toString();
    if (!cooldownMap.get(workflowId)) return null;

    const result = await this.handler.evaluate(workflow, trigger, now);
    const updates: BulkWriteUpdate[] = [];

    const baseUpdate: Record<string, unknown> = {
      lastEvaluatedAt: now,
    };

    if (result.shouldExecute) {
      baseUpdate.lastTriggeredAt = now;
    }

    if (result.extraUpdates) {
      Object.assign(baseUpdate, result.extraUpdates);
    }

    updates.push({
      updateOne: {
        filter: { _id: workflow._id },
        update: { $set: baseUpdate },
      },
    });

    const shouldEnqueue = result.shouldExecute && !result.skipEnqueue;

    if (shouldEnqueue) {
      await enqueueExecution({
        workflowId,
        userId: workflow.userId.toString(),
        triggerSnapshot: result.snapshot as any,
        executionMode: workflow.executionMode,
        dedupeKey: buildDedupeKey(workflowId, now),
        ...(result.condition !== undefined
          ? { condition: result.condition }
          : {}),
      });
    }

    const executed = shouldEnqueue ? 1 : 0;
    return { updates, executed };
  }
}

const ACTIVE_WORKFLOW_QUERY = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};
