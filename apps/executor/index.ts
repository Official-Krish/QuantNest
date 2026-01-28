require("dotenv").config();
import mongoose from 'mongoose';
import { ExecutionModel, WorkflowModel } from '@n8n-trading/db/client';
import { executeWorkflow } from './execute';
import { SUPPORTED_ASSETS } from "@n8n-trading/types";
import axios from 'axios';

async function getCurrentPrice(asset: string): Promise<number> {
    return 100;
}

async function handlePriceTrigger(workflow: any, trigger: any): Promise<boolean> {
    const { condition, targetPrice } = trigger.data?.metadata || {};
    if (!condition || !targetPrice) return false;

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


    let triggerMatched = false;

    for (const action of actions) {
        const asset = action.data?.metadata?.symbol;
        const currentPrice = priceMap[asset];

        if (currentPrice === undefined) continue;

        if ((condition === "above" && currentPrice > targetPrice) || (condition === "below" && currentPrice < targetPrice)) {
            triggerMatched = true;
            break;
        }
    }

    return triggerMatched;
}

async function execute() {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/myapp');
    while (true) {
        const workflows = await WorkflowModel.find({});
        for (const workflow of workflows) {
            const trigger = workflow.nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");
            if (!trigger) continue;

            switch (trigger.type) {
                case "timer":
                    const timerInSeconds = trigger.data?.metadata?.time;
                    const execution = await ExecutionModel.findOne({
                        workflowId: workflow._id,
                    }).sort({
                        startTime: -1
                    })
                    if (!execution || execution.startTime.getTime() + (timerInSeconds * 1000) < Date.now()) {
                        const execution = await ExecutionModel.create({
                            workflowId: workflow._id,
                            userId: workflow.userId,
                            status: 'InProgress',
                            startTime: new Date(),
                        });
                        const res = await executeWorkflow(workflow.nodes, workflow.edges);
                        execution.endTime = new Date();
                        res == "SUCCESS" ? execution.status = 'Success' : execution.status = 'Failed';
                        await execution.save();
                    }
                    break;
                
                case "price-trigger": 
                    const asset = trigger.data?.metadata?.asset;
                    if (!SUPPORTED_ASSETS.includes(asset)) {
                        console.error(`Unsupported asset ${asset} in workflow ${workflow.workflowName}`);
                        continue;
                    }
                    const triggerMatched = await handlePriceTrigger(workflow, trigger);
                    if (!triggerMatched) {
                        console.log(`Price trigger conditions not met for workflow ${workflow.workflowName}`);
                        continue;
                    }

                    const PriceExecution = await ExecutionModel.create({
                        workflowId: workflow._id,
                        userId: workflow.userId,
                        status: 'InProgress',
                        startTime: new Date(),
                    });
                    const res = await executeWorkflow(workflow.nodes, workflow.edges);
                    PriceExecution.endTime = new Date();
                    res == "SUCCESS" ? PriceExecution.status = 'Success' : PriceExecution.status = 'Failed';
                    await PriceExecution.save();
                    break;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }   
}

execute();