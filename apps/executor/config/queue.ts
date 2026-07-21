import { Redis } from "ioredis";

export const EXECUTION_QUEUE_NAME = "workflow-execution";
export const DLQ_QUEUE_NAME = "workflow-dlq";

export function createBullConnection() {
  return new Redis({
    host: process.env.REDIS_HOST ?? "redis",
    port: 6379,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });
}

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400, count: 100 },
};

export const dlqJobOptions = {
  attempts: 3,
  backoff: { type: "fixed" as const, delay: 3_600_000 },
  removeOnComplete: { age: 86400, count: 100 },
  removeOnFail: { age: 604800, count: 100 },
};
