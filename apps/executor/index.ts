import * as dotenv from "dotenv";
import { connectDB } from "./config/database";
import { POLL_INTERVAL } from "./config/constants";
import { pollOnce } from "./jobs/workflow.poller";

dotenv.config();

async function start() {
    await connectDB();

    let shuttingDown = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextPoll = () => {
        if (shuttingDown) {
            return;
        }

        pollTimer = setTimeout(() => {
            void runPoll();
        }, POLL_INTERVAL);
        pollTimer.unref?.();
    };

    const stop = () => {
        shuttingDown = true;
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
    };

    process.once("SIGTERM", stop);
    process.once("SIGINT", stop);

    const runPoll = async () => {
        if (shuttingDown) {
            return;
        }

        try {
            await pollOnce();
        } catch (err) {
            console.error("Poller crash prevented", err);
        } finally {
            scheduleNextPoll();
        }
    };

    void runPoll();
}

start();