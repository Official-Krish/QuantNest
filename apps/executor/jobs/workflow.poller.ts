import { ExecutionModel, WorkflowModel } from "@n8n-trading/db/client";
import { canExecute, executeWorkflowSafe } from "../services/execution.service";
import { handlePriceTrigger, handleTimerTrigger } from "../handlers/trigger.handler";

export async function pollOnce() {
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

                    const last = await ExecutionModel.findOne({ 
                        workflowId: workflow._id 
                    }).sort({ startTime: -1 });

                    const shouldExecute = await handleTimerTrigger(
                        last?.startTime.getTime() || null,
                        interval
                    );

                    if (shouldExecute) {
                        await executeWorkflowSafe(workflow);
                    }
                    break;
                }

                case "price-trigger": {
                    const shouldExecute = await handlePriceTrigger(workflow, trigger);
                    if (shouldExecute) {
                        await executeWorkflowSafe(workflow);
                    }
                    break;
                }
            }
        } catch (err) {
            console.error(`Workflow error (${workflow.workflowName})`, err);
        }
    }
}
