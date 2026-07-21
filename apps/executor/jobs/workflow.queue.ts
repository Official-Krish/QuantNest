import { Queue, Worker } from "bullmq";
import { WorkflowModel } from "@quantnest-trading/db/client";
import {
  EXECUTION_QUEUE_NAME,
  createBullConnection,
  defaultJobOptions,
} from "../config/queue";
import { executeWorkflowSafe } from "../services/execution.service";
import type { WorkflowType } from "../types";
import type { IExecutionJobData } from "./workflow.queue.types";
import { findWorkflowTrigger, getTimerIntervalSeconds } from "./poller.utils";

const TIMER_JOB_PREFIX = "timer:";

let executionQueue: Queue<IExecutionJobData> | null = null;
let executionWorker: Worker<IExecutionJobData> | null = null;

export async function initQueue() {
  const connection = createBullConnection();

  executionQueue = new Queue<IExecutionJobData>(EXECUTION_QUEUE_NAME, {
    connection,
    defaultJobOptions,
  });

  executionWorker = new Worker<IExecutionJobData>(
    EXECUTION_QUEUE_NAME,
    async (job) => {
      const { workflowId, condition, triggerSnapshot } = job.data;

      const workflow = await WorkflowModel.findById(workflowId).lean();
      if (!workflow) {
        console.error(
          `[queue] Workflow ${workflowId} not found for job ${job.id}`,
        );
        return;
      }

      const wf = workflow as any;
      if (wf?.status === "paused") {
        return;
      }

      if (wf?.triggerType === "timer") {
        const trigger = findWorkflowTrigger(
          workflow as unknown as WorkflowType,
        );
        if (trigger) {
          const intervalSeconds = getTimerIntervalSeconds(
            workflow as unknown as WorkflowType,
            trigger,
          );
          if (intervalSeconds) {
            await WorkflowModel.updateOne(
              { _id: workflowId },
              {
                $set: {
                  lastTriggeredAt: new Date(),
                  nextRunAt: new Date(Date.now() + intervalSeconds * 1000),
                },
              },
            );
          }
        }
      }

      await executeWorkflowSafe(
        workflow as unknown as WorkflowType,
        condition,
        triggerSnapshot,
      );
    },
    {
      connection,
      concurrency: 5,
    },
  );

  executionWorker.on("failed", (job, err) => {
    console.error(`[queue] Job ${job?.id} failed:`, err);
  });

  executionWorker.on("completed", (job) => {
    console.log(
      `[queue] Job ${job.id} completed (workflow: ${job.data.workflowId})`,
    );
  });

  console.log("[queue] Worker initialized");
}

export async function enqueueExecution(
  data: IExecutionJobData & { dedupeKey?: string },
) {
  if (!executionQueue) {
    console.error("[queue] Not initialized, skipping enqueue");
    return;
  }

  await executionQueue.add(EXECUTION_QUEUE_NAME, data, {
    jobId: data.dedupeKey,
  });
}

export async function enqueueTimerJob(
  workflowId: string,
  intervalSeconds: number,
) {
  if (!executionQueue) {
    console.error("[queue] Not initialized, skipping timer job");
    return;
  }

  const jobId = `${TIMER_JOB_PREFIX}${workflowId}`;
  const existing = await executionQueue.getJob(jobId);
  if (existing) {
    await existing.remove();
  }

  await executionQueue.add(
    EXECUTION_QUEUE_NAME,
    { workflowId, userId: "" },
    {
      jobId,
      repeat: { every: intervalSeconds * 1000 },
    },
  );
}

export async function removeTimerJob(workflowId: string) {
  if (!executionQueue) return;
  const jobId = `${TIMER_JOB_PREFIX}${workflowId}`;
  try {
    const jobs = await executionQueue.getRepeatableJobs();
    for (const job of jobs) {
      if (job.id === jobId || job.key?.includes(workflowId)) {
        await executionQueue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    console.error(`[queue] Failed to remove timer job ${workflowId}:`, err);
  }
}

export async function getTimerJobIds(): Promise<Set<string>> {
  if (!executionQueue) return new Set();

  const ids = new Set<string>();
  try {
    const jobs = await executionQueue.getRepeatableJobs();
    for (const job of jobs) {
      const id = job.id;
      if (id?.startsWith(TIMER_JOB_PREFIX)) {
        ids.add(id.slice(TIMER_JOB_PREFIX.length));
      }
    }
  } catch (err) {
    console.error("[queue] Failed to list timer jobs:", err);
  }
  return ids;
}

export async function closeQueue() {
  await executionWorker?.close();
  await executionQueue?.close();
  console.log("[queue] Closed");
}
