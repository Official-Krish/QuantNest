import { WorkflowModel } from "@quantnest-trading/db/client";
import { deriveWorkflowTriggerState } from "@quantnest-trading/executor-utils";
import { canExecute, executeWorkflowSafe } from "../services/execution.service";
import { evaluateConditionalMetadata, handleConditionalTrigger, handlePriceTrigger } from "../handlers/trigger.handler";
import { indicatorEngine } from "../services/indicator.engine";

async function backfillWorkflowTriggerState() {
    const workflowsMissingTriggerState = await WorkflowModel.find({
        $or: [
            { triggerType: { $exists: false } },
            { triggerType: null },
            { triggerNodeId: { $exists: false } },
        ],
    }).limit(100);

    for (const workflow of workflowsMissingTriggerState) {
        const nextState = deriveWorkflowTriggerState(workflow.nodes as any);
        if (!nextState.triggerType) continue;

        await WorkflowModel.updateOne(
            { _id: workflow._id },
            {
                $set: nextState,
            },
        );
    }
}

async function registerConditionalExpressions() {
    const workflows = await WorkflowModel.find({
        $or: [
            { status: "active" },
            { status: { $exists: false } },
        ],
        triggerType: "conditional-trigger",
    }).select({ nodes: 1 });

    for (const workflow of workflows) {
        const conditionalNodes = workflow.nodes.filter((n: any) => n?.type === "conditional-trigger");
        for (const node of conditionalNodes) {
            if (node?.data?.metadata?.expression) {
                indicatorEngine.registerExpression(node.data.metadata.expression);
            }
        }
    }
}

async function processTimerWorkflows(now: Date) {
    const workflows = await WorkflowModel.find({
        $or: [
            { status: "active" },
            { status: { $exists: false } },
        ],
        triggerType: "timer",
        nextRunAt: { $lte: now },
    });

    for (const workflow of workflows) {
        try {
            const trigger = workflow.nodes.find((n: any) =>
                String(n?.data?.kind || "").toLowerCase() === "trigger",
            );
            if (!trigger) continue;

            const interval = Number(
                (workflow as any).triggerConfig?.intervalSeconds ?? trigger.data?.metadata?.time,
            );
            if (!Number.isFinite(interval) || interval <= 0) continue;

            await WorkflowModel.updateOne(
                { _id: workflow._id },
                {
                    $set: {
                        lastEvaluatedAt: now,
                        lastTriggeredAt: now,
                        nextRunAt: new Date(now.getTime() + interval * 1000),
                    },
                },
            );

            await executeWorkflowSafe(workflow);
        } catch (err) {
            console.error(`Timer workflow error (${workflow.workflowName})`, err);
        }
    }
}

async function processPriceWorkflows(now: Date) {
    const workflows = await WorkflowModel.find({
        $or: [
            { status: "active" },
            { status: { $exists: false } },
        ],
        triggerType: "price-trigger",
    });

    for (const workflow of workflows) {
        try {
            const trigger = workflow.nodes.find((n: any) =>
                String(n?.data?.kind || "").toLowerCase() === "trigger",
            );
            if (!trigger) continue;
            if (!(await canExecute(workflow._id.toString()))) continue;

            const shouldExecute = await handlePriceTrigger(workflow, trigger as any);

            await WorkflowModel.updateOne(
                { _id: workflow._id },
                {
                    $set: {
                        lastEvaluatedAt: now,
                        ...(shouldExecute ? { lastTriggeredAt: now } : {}),
                    },
                },
            );

            if (shouldExecute) {
                await executeWorkflowSafe(workflow);
            }
        } catch (err) {
            console.error(`Price workflow error (${workflow.workflowName})`, err);
        }
    }
}

async function processConditionalWorkflows(now: Date) {
    const workflows = await WorkflowModel.find({
        $or: [
            { status: "active" },
            { status: { $exists: false } },
        ],
        triggerType: "conditional-trigger",
    });

    for (const workflow of workflows) {
        try {
            const trigger = workflow.nodes.find((n: any) =>
                String(n?.data?.kind || "").toLowerCase() === "trigger",
            );
            if (!trigger) continue;
            if (!(await canExecute(workflow._id.toString()))) continue;

            const shouldExecute = await handleConditionalTrigger(
                trigger.data?.metadata?.timeWindowMinutes,
                trigger.data?.metadata?.startTime ? new Date(trigger.data.metadata.startTime) : undefined,
            );

            await WorkflowModel.updateOne(
                { _id: workflow._id },
                {
                    $set: {
                        lastEvaluatedAt: now,
                    },
                },
            );

            if (shouldExecute) {
                const condition = await evaluateConditionalMetadata(trigger.data?.metadata);
                await WorkflowModel.updateOne(
                    { _id: workflow._id },
                    {
                        $set: {
                            lastTriggeredAt: now,
                        },
                    },
                );
                await executeWorkflowSafe(workflow, condition);
            }
        } catch (err) {
            console.error(`Conditional workflow error (${workflow.workflowName})`, err);
        }
    }
}

export async function pollOnce() {
    const now = new Date();

    await backfillWorkflowTriggerState();
    await registerConditionalExpressions();
    await indicatorEngine.refreshSubscribedSymbols();
    await processTimerWorkflows(now);
    await processPriceWorkflows(now);
    await processConditionalWorkflows(now);
}
