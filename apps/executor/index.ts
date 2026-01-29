require("dotenv").config();
import mongoose from "mongoose";
import { ExecutionModel, WorkflowModel } from "@n8n-trading/db/client";
import { executeWorkflow } from "./execute";
import { assetCompanyName, assetMapped, SUPPORTED_ASSETS } from "@n8n-trading/types";
import type { NodeType, WorkflowType } from "./types";
import axios from "axios";

const POLL_INTERVAL = 2000;
const EXECUTION_COOLDOWN_MS = 5000;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/myapp");
}

async function getCurrentPrice(asset: string): Promise<number> {
    const USER_AGENTS = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ];
    let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://www.nseindia.com/api/NextApi/apiClient/GetQuoteApi?functionName=getSymbolData&marketType=N&series=EQ&symbol=${assetMapped[asset]}`,
        headers: { 
            'accept': '*/*', 
            'accept-language': 'en-GB,en;q=0.9', 
            'referer': `https://www.nseindia.com/get-quote/equity/${assetMapped[asset]}/${assetCompanyName[asset]}`, 
            'user-agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)], 
        }
    };

    try {
        const response = await axios(config);
        console.log(response.data.equityResponse[0].orderBook.lastPrice);
        return response.data.equityResponse[0].orderBook.lastPrice;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch current price");
    }

}

async function canExecute(workflowId: string): Promise<boolean> {
    const lastExecution = await ExecutionModel.findOne({ workflowId })
        .sort({ startTime: -1 });

    if (!lastExecution) return true;

    return (
        Date.now() - lastExecution.startTime.getTime() >
        EXECUTION_COOLDOWN_MS
    );
}

async function handlePriceTrigger(
    workflow: WorkflowType,
    trigger: NodeType
): Promise<boolean> {
    const { condition, targetPrice } = trigger.data?.metadata || {};
    if (!condition || typeof targetPrice !== "number") return false;

    const actions = workflow.nodes.filter(
        (n: any) => n?.data?.kind === "action" || n?.data?.kind === "ACTION"
    );

    if (actions.length === 0) return false;

    const assets = [
        ...new Set(
        actions
            .map((a: any) => a.data?.metadata?.symbol)
            .filter(Boolean)
        ),
    ];

    for (const asset of assets) {
        if (!SUPPORTED_ASSETS.includes(asset as string)) {
            console.error(`Unsupported asset ${asset}`);
            return false;
        }
    }

    const priceMap: Record<string, number> = {};

    for (const asset of assets) {
        priceMap[asset as string] = await getCurrentPrice(asset as string);
    }

    for (const action of actions) {
        const asset = action.data?.metadata?.symbol;
        const currentPrice = priceMap[asset];
        if (currentPrice === undefined) continue;

        if ((condition === "above" && currentPrice > targetPrice) || (condition === "below" && currentPrice < targetPrice)) {
            return true;
        }
    }

    return false;
}

async function executeWorkflowSafe(workflow: WorkflowType) {
    const execution = await ExecutionModel.create({
        workflowId: workflow._id,
        userId: workflow.userId,
        status: "InProgress",
        startTime: new Date(),
    });

    try {
        const res = await executeWorkflow(workflow.nodes, workflow.edges);
        execution.status = res === "SUCCESS" ? "Success" : "Failed";
    } catch (err) {
        console.error(`Execution error (${workflow.workflowName})`, err);
        execution.status = "Failed";
    } finally {
        execution.endTime = new Date();
        await execution.save();
    }
}

async function pollOnce() {
    const workflows = await WorkflowModel.find({});

    for (const workflow of workflows) {
        try {
            const trigger = workflow.nodes.find(
                (n: any) =>
                n?.data?.kind === "trigger" || n?.data?.kind === "TRIGGER"
            );
            if (!trigger) continue;

            if (!(await canExecute(workflow._id.toString()))) continue;

            switch (trigger.type) {
                case "timer": {
                    const interval = trigger.data?.metadata?.time;
                    if (!interval) break;

                    const last = await ExecutionModel.findOne({ workflowId: workflow._id })
                        .sort({ startTime: -1 });

                    if (!last || last.startTime.getTime() + interval * 1000 < Date.now()) {
                        console.log(`Timer trigger fired for workflow ${workflow.workflowName}`);
                        await executeWorkflowSafe(workflow);
                    }
                    break;
                }

                case "price-trigger": {
                    const matched = await handlePriceTrigger(workflow, trigger);
                    if (!matched) break;
                    console.log(`Price trigger matched for workflow ${workflow.workflowName}`);
                    await executeWorkflowSafe(workflow);
                    break;
                }
            }
        } catch (err) {
            console.error(`Workflow error (${workflow.workflowName})`, err);
        }
    }
}

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