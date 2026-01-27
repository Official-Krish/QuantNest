require("dotenv").config();
import mongoose from 'mongoose';
import { ExecutionModel, WorkflowModel } from '@n8n-trading/db/client';
import { executeWorkflow } from './execute';

async function execute() {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/myapp');
    while (true) {
        console.log("Checking for scheduled workflows to execute...");
        const workflows = await WorkflowModel.find({});
        console.log(`Found ${workflows.length} workflows`);
        workflows.map(async (workflow) => {
            const trigger = workflow.nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");
            if (!trigger) return;

            switch (trigger.type) {
                case "timer":
                    const timerInSeconds = trigger.data?.metadata?.time;
                    const execution = await ExecutionModel.findOne({
                        workflowId: workflow._id,
                    }).sort({
                        startTime: -1
                    })
                    if (!execution || execution.startTime.getTime() + (timerInSeconds * 1000) < Date.now()) {
                        console.log(`Executing workflow ${workflow.workflowName}`);
                        const execution = await ExecutionModel.create({
                            workflowId: workflow._id,
                            status: 'InProgress',
                            startTime: new Date(),
                        });
                        await executeWorkflow(workflow.nodes, workflow.edges);
                        execution.endTime = new Date();
                        execution.status = 'Success';
                        await execution.save();
                    }
                    
                    break;

            }
        });
    }   
}

execute();