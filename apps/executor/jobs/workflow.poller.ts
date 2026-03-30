import { WorkflowModel } from "@quantnest-trading/db/client";
import { deriveWorkflowTriggerState } from "@quantnest-trading/executor-utils";
import { NODE_REGISTRY } from "@quantnest-trading/node-registry";
import type { ExecutorTriggerProcessorId } from "@quantnest-trading/node-registry";
import { canExecute, executeWorkflowSafe } from "../services/execution.service";
import {
    evaluateConditionalMetadata,
    handleConditionalTrigger,
    handlePriceTrigger,
} from "../handlers/trigger.handler";
import { indicatorEngine } from "../services/indicator.engine";
import type { NodeType, WorkflowType } from "../types";

const ACTIVE_WORKFLOW_QUERY = {
    $or: [
        { status: "active" },
        { status: { $exists: false } },
    ],
};

function isTriggerNode(node: NodeType | null | undefined): boolean {
    return String(node?.data?.kind || "").toLowerCase() === "trigger";
}

function findWorkflowTrigger(workflow: WorkflowType): NodeType | undefined {
    if (workflow.triggerNodeId) {
        const storedTrigger = workflow.nodes.find((node) => {
            const candidateId = String(node?.nodeId || node?.id || "").trim();
            return candidateId === workflow.triggerNodeId;
        });

        if (storedTrigger && isTriggerNode(storedTrigger)) {
            return storedTrigger as NodeType;
        }
    }

    return workflow.nodes.find((node) => isTriggerNode(node)) as NodeType | undefined;
}

function getConditionalExpression(trigger: NodeType): unknown {
    return trigger.data?.metadata?.expression;
}

function getTimerIntervalSeconds(workflow: WorkflowType, trigger: NodeType): number | null {
    const interval = Number(
        workflow.triggerConfig?.intervalSeconds ?? trigger.data?.metadata?.time,
    );

    if (!Number.isFinite(interval) || interval <= 0) {
        return null;
    }

    return interval;
}

async function backfillWorkflowTriggerState(now: Date) {
    const workflowsMissingTriggerState = await WorkflowModel.find({
        $and: [
            ACTIVE_WORKFLOW_QUERY,
            {
                $or: [
                    { triggerType: { $exists: false } },
                    { triggerType: null },
                    { triggerNodeId: { $exists: false } },
                    { triggerNodeId: null },
                    { triggerConfig: { $exists: false } },
                    { triggerConfig: null },
                    {
                        $and: [
                            { triggerType: "timer" },
                            {
                                $or: [
                                    { nextRunAt: { $exists: false } },
                                    { nextRunAt: null },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    }).limit(100);

    for (const workflow of workflowsMissingTriggerState) {
        const nextState = deriveWorkflowTriggerState(workflow.nodes as NodeType[], now);
        if (!nextState.triggerType) {
            continue;
        }

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
        ...ACTIVE_WORKFLOW_QUERY,
        triggerType: "conditional-trigger",
    }).select({ triggerNodeId: 1, triggerConfig: 1, nodes: 1 });

    for (const workflow of workflows) {
        const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
        const expression =
            workflow.triggerConfig?.expression ??
            (trigger ? getConditionalExpression(trigger) : undefined);

        if (expression) {
            indicatorEngine.registerExpression(expression as Parameters<typeof indicatorEngine.registerExpression>[0]);
        }
    }
}

async function processTimerWorkflows(now: Date) {
    const workflows = await WorkflowModel.find({
        ...ACTIVE_WORKFLOW_QUERY,
        triggerType: "timer",
        nextRunAt: { $lte: now },
    });

    for (const workflow of workflows) {
        try {
            const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
            if (!trigger) {
                continue;
            }

            const intervalSeconds = getTimerIntervalSeconds(workflow as unknown as WorkflowType, trigger);
            if (!intervalSeconds) {
                continue;
            }

            await WorkflowModel.updateOne(
                { _id: workflow._id },
                {
                    $set: {
                        lastEvaluatedAt: now,
                        lastTriggeredAt: now,
                        nextRunAt: new Date(now.getTime() + intervalSeconds * 1000),
                    },
                },
            );

            await executeWorkflowSafe(workflow as unknown as WorkflowType);
        } catch (err) {
            console.error(`Timer workflow error (${workflow.workflowName})`, err);
        }
    }
}

async function processPriceWorkflows(now: Date) {
    const workflows = await WorkflowModel.find({
        ...ACTIVE_WORKFLOW_QUERY,
        triggerType: "price-trigger",
    });

    for (const workflow of workflows) {
        try {
            const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
            if (!trigger) {
                continue;
            }

            if (!(await canExecute(workflow._id.toString()))) {
                continue;
            }

            const shouldExecute = await handlePriceTrigger(
                workflow as unknown as WorkflowType,
                trigger,
            );

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
                await executeWorkflowSafe(workflow as unknown as WorkflowType);
            }
        } catch (err) {
            console.error(`Price workflow error (${workflow.workflowName})`, err);
        }
    }
}

async function processConditionalWorkflows(now: Date) {
    const workflows = await WorkflowModel.find({
        ...ACTIVE_WORKFLOW_QUERY,
        triggerType: "conditional-trigger",
    });

    for (const workflow of workflows) {
        try {
            const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
            if (!trigger) {
                continue;
            }

            if (!(await canExecute(workflow._id.toString()))) {
                continue;
            }

            const shouldEvaluate = await handleConditionalTrigger(
                trigger.data?.metadata?.timeWindowMinutes,
                trigger.data?.metadata?.startTime
                    ? new Date(trigger.data.metadata.startTime)
                    : undefined,
            );

            await WorkflowModel.updateOne(
                { _id: workflow._id },
                {
                    $set: {
                        lastEvaluatedAt: now,
                    },
                },
            );

            if (!shouldEvaluate) {
                continue;
            }

            const condition = await evaluateConditionalMetadata(trigger.data?.metadata);
            if (!condition) {
                continue;
            }

            await WorkflowModel.updateOne(
                { _id: workflow._id },
                {
                    $set: {
                        lastTriggeredAt: now,
                    },
                },
            );

            await executeWorkflowSafe(workflow as unknown as WorkflowType, condition);
        } catch (err) {
            console.error(`Conditional workflow error (${workflow.workflowName})`, err);
        }
    }
}

const triggerProcessorMap: Record<ExecutorTriggerProcessorId, (now: Date) => Promise<void>> = {
    timer: processTimerWorkflows,
    "price-trigger": processPriceWorkflows,
    "conditional-trigger": processConditionalWorkflows,
};

const registryTriggerProcessors = NODE_REGISTRY
    .filter((entry) => entry.kind === "trigger" && entry.executorTriggerProcessorId)
    .map((entry) => entry.executorTriggerProcessorId!) satisfies ExecutorTriggerProcessorId[];

export async function pollOnce() {
    const now = new Date();

    await backfillWorkflowTriggerState(now);
    await registerConditionalExpressions();
    await indicatorEngine.refreshSubscribedSymbols();
    for (const processorId of registryTriggerProcessors) {
        await triggerProcessorMap[processorId](now);
    }
}
