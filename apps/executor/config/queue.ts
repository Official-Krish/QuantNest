import { Redis } from "ioredis";

export const EXECUTION_QUEUE_NAME = "workflow-execution";

export function createBullConnection() {
  return new Redis({
    host: process.env.REDIS_HOST ?? "redis",
    port: 6379,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });
}

export const defaultJobOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400, count: 100 },
};
