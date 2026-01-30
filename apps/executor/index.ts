require("dotenv").config();
import { connectDB } from "./config/database";
import { POLL_INTERVAL } from "./config/constants";
import { pollOnce } from "./jobs/workflow.poller";

async function start() {
    await connectDB();
    console.log("Workflow executor running");

    setInterval(async () => {
        try {
            await pollOnce();
        } catch (err) {
            console.error("Poller crash prevented", err);
        }
    }, POLL_INTERVAL);
}

start();