require("dotenv").config();
import { connectDB } from "./config/database";
import { POLL_INTERVAL } from "./config/constants";
import { pollOnce } from "./jobs/workflow.poller";

async function start() {
    await connectDB();

    let pollInFlight = false;

    setInterval(async () => {
        if (pollInFlight) {
            return;
        }

        pollInFlight = true;

        try {
            await pollOnce();
        } catch (err) {
            console.error("Poller crash prevented", err);
        } finally {
            pollInFlight = false;
        }
    }, POLL_INTERVAL);
}

start();