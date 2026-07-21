import * as dotenv from "dotenv";
import { connectDB } from "./config/database";
import { POLL_INTERVAL, MAX_POLL_INTERVAL } from "./config/constants";
import { pollOnce } from "./jobs/workflow.poller";
import { initRedis } from "@quantnest-trading/redis";
import { initQueue, closeQueue } from "./jobs/workflow.queue";
import { syncTimerWorkflows } from "./jobs/timer.sync";

dotenv.config();

let consecutiveEmptyPolls = 0;
const pollIntervalStep = 250;

async function start() {
  await Promise.all([connectDB(), initRedis()]);
  await initQueue();
  void syncTimerWorkflows();

  let shuttingDown = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleNextPoll = () => {
    if (shuttingDown) return;

    const backoff = Math.min(
      consecutiveEmptyPolls * pollIntervalStep,
      MAX_POLL_INTERVAL - POLL_INTERVAL,
    );
    const interval = POLL_INTERVAL + backoff;

    pollTimer = setTimeout(() => {
      void runPoll();
    }, interval);
    pollTimer.unref?.();
  };

  const stop = () => {
    shuttingDown = true;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    void closeQueue();
  };

  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);

  const runPoll = async () => {
    if (shuttingDown) return;

    try {
      const executed = await pollOnce();
      consecutiveEmptyPolls = executed === 0 ? consecutiveEmptyPolls + 1 : 0;
    } catch (err) {
      console.error("Poller crash prevented", err);
    } finally {
      scheduleNextPoll();
    }
  };

  void runPoll();
}

start().catch((err) => {
  console.error("[executor] Fatal init error, restarting in 5s", err);
  setTimeout(() => process.exit(1), 5000);
});
