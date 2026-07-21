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

      if ((workflow as any)?.status === "paused") {
        return;
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

export async function closeQueue() {
  await executionWorker?.close();
  await executionQueue?.close();
  console.log("[queue] Closed");
}
