import { ExecutionModel } from "@quantnest-trading/db/client";
import { executeWorkflow } from "../execute";
import type { WorkflowType } from "../types";
import { EXECUTION_COOLDOWN_MS } from "../config/constants";

export async function canExecute(workflowId: string): Promise<boolean> {
    const lastExecution = await ExecutionModel.findOne({ workflowId })
        .sort({ startTime: -1 });

    if (!lastExecution) return true;

    return (
        Date.now() - lastExecution.startTime.getTime() >
        EXECUTION_COOLDOWN_MS
    );
}

export async function executeWorkflowSafe(workflow: WorkflowType, condition?: boolean) {
    const execution = await ExecutionModel.create({
        workflowId: workflow._id,
        userId: workflow.userId,
        status: "InProgress",
        steps: [],
        startTime: new Date(),
    });

    try {
        const res = await executeWorkflow(
            workflow.nodes,
            workflow.edges,
            workflow.userId.toString(),
            workflow._id.toString(),
            condition
        );
        execution.status = res.status;
        execution.set("steps", res.steps);
    } catch (err: any) {
        console.error(`Execution error (${workflow.workflowName})`, err);
        execution.status = "Failed";
        execution.set("steps", [{
            step: 0,
            nodeId: "",
            nodeType: "",
            status: "Failed",
            message: err.message || "Unknown error",
        }]);
    } finally {
        execution.endTime = new Date();
        await execution.save();
    }
}
