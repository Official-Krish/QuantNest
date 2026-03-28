import type { ExecutionResponseType, ExecutionStep } from "@quantnest-trading/types";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import { evaluateConditionalMetadata } from "../handlers/trigger.handler";
import { executeActionNode } from "./execute.actions";
import {
    initializeExecutionContext,
    registerMergeArrival,
    resolveConditionalEdges,
    type ExecutionContext,
} from "./execute.context";
import type { EdgeType, NodeType } from "../types";

export async function executeWorkflow(
    nodes: NodeType[],
    edges: EdgeType[],
    userId?: string,
    workflowId?: string,
    condition?: boolean
): Promise<ExecutionResponseType> {
    const trigger = nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");
    if (!trigger) {
        return {
            status: "Failed",
            steps: [{
                step: 1,
                nodeId: "unknown",
                nodeType: "trigger",
                status: "Failed",
                message: "No trigger node found",
            }],
        };
    }

    const context = initializeExecutionContext({
        nodes,
        trigger,
        userId,
        workflowId,
        condition,
    });

    return executeRecursive(trigger.id, nodes, edges, context, condition);
}

export async function executeRecursive(
    sourceId: string,
    nodes: NodeType[],
    edges: EdgeType[],
    context: ExecutionContext = {},
    condition?: boolean,
    arrivedViaEdgeId?: string,
): Promise<ExecutionResponseType> {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const localSteps: ExecutionStep[] = [];

    if (sourceNode?.type === "merge") {
        const incomingEdgeCount = edges.filter((edge) => edge.target === sourceId).length;
        const mergeState = registerMergeArrival({
            context,
            mergeNodeId: sourceId,
            incomingEdgeCount,
            arrivalEdgeId: arrivedViaEdgeId,
        });

        if (!mergeState.shouldContinue) {
            return { status: "Success", steps: [] };
        }

        if (mergeState.releasedNow) {
            localSteps.push({
                step: 1,
                nodeId: sourceNode.nodeId || sourceNode.id,
                nodeType: "Merge Action",
                status: "Success",
                message: incomingEdgeCount > 1
                    ? `Merged ${incomingEdgeCount} incoming branches`
                    : "Merge path continued",
            });
        }
    }

    const outgoingEdges = edges.filter(({ source }) => source === sourceId);
    if (!outgoingEdges.length) {
        return { status: "Success", steps: localSteps };
    }

    let nextCondition = condition;
    let targetEdges = outgoingEdges;

    if (sourceNode?.type === "conditional-trigger" || sourceNode?.type === "if" || sourceNode?.type === "filter") {
        const isRootTriggerNode =
            String(sourceNode.data?.kind || "").toLowerCase() === "trigger" &&
            sourceNode?.type === "conditional-trigger";
        const evaluatedCondition =
            typeof condition === "boolean" && isRootTriggerNode
                ? condition
                : await evaluateConditionalMetadata(sourceNode.data?.metadata);

        nextCondition = evaluatedCondition;
        context.details = {
            ...(context.details || {}),
            aiContext: {
                triggerType: sourceNode?.type === "filter" ? "filter" : "conditional-trigger",
                marketType: sourceNode.data?.metadata?.marketType === "Crypto" ? "Crypto" : "Indian",
                symbol: sourceNode.data?.metadata?.asset || context.details?.symbol,
                connectedSymbols: context.details?.aiContext?.connectedSymbols,
                targetPrice: sourceNode.data?.metadata?.targetPrice,
                condition: sourceNode.data?.metadata?.condition,
                timerIntervalSeconds: context.details?.aiContext?.timerIntervalSeconds,
                expression: sourceNode.data?.metadata?.expression,
                evaluatedCondition,
            },
        };

        targetEdges = sourceNode?.type === "filter"
            ? (evaluatedCondition ? outgoingEdges : [])
            : resolveConditionalEdges({
                sourceNode,
                nodes,
                outgoingEdges,
                evaluatedCondition,
              });

        if (!targetEdges.length && sourceNode?.type === "filter" && evaluatedCondition === false) {
            return { status: "Success", steps: localSteps };
        }

        if (!targetEdges.length && context.userId && context.workflowId) {
            await createUserNotification({
                userId: context.userId,
                workflowId: context.workflowId,
                type: "conditional_no_downstream_branch",
                severity: "warning",
                title: sourceNode?.type === "filter"
                    ? "Filter blocked downstream execution"
                    : "Conditional has no downstream branch",
                message: sourceNode?.type === "filter"
                    ? "A filter node blocked execution because its condition did not pass."
                    : "A conditional node evaluated, but there was no valid true/false branch connected to continue execution.",
                metadata: {
                    nodeId: sourceNode.nodeId || sourceNode.id,
                    evaluatedCondition,
                },
                dedupeKey: `${sourceNode?.type === "filter" ? "filter-blocked" : "conditional-no-branch"}:${context.workflowId}:${sourceNode.nodeId || sourceNode.id}:${evaluatedCondition}`,
                dedupeWindowHours: 12,
            });
        }
    }

    const nodesToExecute = targetEdges.map(({ target }) => target);
    if (!nodesToExecute.length) {
        return { status: "Success", steps: [] };
    }

    const steps: ExecutionStep[] = [];
    await Promise.all(
        nodesToExecute.map(async (id) => {
            const node = nodes.find((n) => n.id === id);
            if (!node) return;
            await executeActionNode({
                node,
                nodes,
                edges,
                context,
                nextCondition,
                steps,
            });
        })
    );

    const childResults = await Promise.all(
        targetEdges.map((edge) => executeRecursive(edge.target, nodes, edges, context, nextCondition, edge.id))
    );

    const childSteps = childResults.flatMap((result) => result.steps);
    const allSteps = [...localSteps, ...steps, ...childSteps];

    if (allSteps.some((step) => step.status === "Failed")) {
        return { status: "Failed", steps: allSteps };
    }
    return { status: "Success", steps: allSteps };
}
