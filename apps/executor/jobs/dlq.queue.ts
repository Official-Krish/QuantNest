import { Queue, Worker } from "bullmq";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import {
  DLQ_QUEUE_NAME,
  createBullConnection,
  EXECUTION_QUEUE_NAME,
} from "../config/queue";
import type { IExecutionJobData } from "./workflow.queue.types";

let dlqWorker: Worker<IExecutionJobData> | null = null;

export function initDlqWorker(): void {
  const connection = createBullConnection();

  const mainQueue = new Queue<IExecutionJobData>(EXECUTION_QUEUE_NAME, {
    connection,
  });

  dlqWorker = new Worker<IExecutionJobData>(
    DLQ_QUEUE_NAME,
    async (job) => {
      await mainQueue.add(EXECUTION_QUEUE_NAME, job.data, {
        jobId: `recovered:${job.id}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 100 },
      });
    },
    {
      connection,
      concurrency: 2,
    },
  );

  dlqWorker.on("failed", async (job, err) => {
    console.error(
      `[dlq] Job ${job?.id} permanently failed after DLQ exhaustion:`,
      err,
    );
    if (job?.data.userId) {
      await createUserNotification({
        userId: job.data.userId,
        workflowId: job.data.workflowId,
        type: "workflow_dlq_exhausted",
        severity: "error",
        title: "Workflow job permanently failed",
        message: `Workflow ${job.data.workflowId} failed after DLQ reprocessing. Manual intervention required.`,
        metadata: { jobId: job.id, error: String(err) },
        dedupeKey: `dlq-exhausted:${job.data.workflowId}`,
        dedupeWindowHours: 24,
      });
    }
  });

  dlqWorker.on("completed", (job) => {
    console.log(
      `[dlq] Job ${job.id} reprocessed successfully, re-enqueued to main queue`,
    );
  });

  console.log("[dlq] DLQ worker initialized");
}

export async function closeDlqQueue(): Promise<void> {
  await dlqWorker?.close();
}
