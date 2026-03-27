import type { EdgeType, NodeType } from "../types";

export interface ExecutionContext {
    eventType?: "buy" | "sell" | "price_trigger" | "trade_failed" | "Long" | "Short";
    userId?: string;
    workflowId?: string;
    details?: {
        symbol?: string;
        quantity?: number;
        exchange?: string;
        targetPrice?: number;
        condition?: "above" | "below";
        tradeType?: "buy" | "sell";
        failureReason?: string;
        aiContext?: {
            triggerType?: string;
            marketType?: "Indian" | "Crypto";
            symbol?: string;
            connectedSymbols?: string[];
            targetPrice?: number;
            condition?: "above" | "below";
            timerIntervalSeconds?: number;
            evaluatedCondition?: boolean;
            expression?: any;
        };
    };
    runtime?: {
        mergeArrivals?: Record<string, string[]>;
        releasedMerges?: string[];
    };
}

export function shouldSkipActionByCondition(
    workflowCondition: boolean | undefined,
    nodeCondition: unknown
): boolean {
    if (typeof workflowCondition !== "boolean") {
        return false;
    }
    if (typeof nodeCondition !== "boolean") {
        return false;
    }
    return workflowCondition !== nodeCondition;
}

export function initializeExecutionContext(params: {
    nodes: NodeType[];
    trigger: NodeType;
    userId?: string;
    workflowId?: string;
    condition?: boolean;
}): ExecutionContext {
    const { nodes, trigger, userId, workflowId, condition } = params;
    const context: ExecutionContext = { userId, workflowId };

    const connectedSymbols = [
        ...new Set(
            nodes
                .filter((node) => (node?.data?.kind || "").toLowerCase() === "action")
                .map((node) => node?.data?.metadata?.symbol)
                .filter((symbol): symbol is string => typeof symbol === "string" && symbol.length > 0),
        ),
    ];
    const inferredSymbol = trigger.data?.metadata?.asset || connectedSymbols[0];
    const inferredMarketType =
        trigger.data?.metadata?.marketType === "Crypto" || trigger.data?.metadata?.marketType === "web3"
            ? "Crypto"
            : "Indian";

    context.details = {
        ...(context.details || {}),
        symbol: context.details?.symbol || inferredSymbol,
        aiContext: {
            triggerType: trigger.type || "trigger",
            marketType: inferredMarketType,
            symbol: inferredSymbol,
            connectedSymbols,
            targetPrice: trigger.data?.metadata?.targetPrice,
            condition: trigger.data?.metadata?.condition,
            timerIntervalSeconds: trigger.type === "timer" ? trigger.data?.metadata?.time : undefined,
            expression: trigger.data?.metadata?.expression,
            evaluatedCondition: condition,
        },
    };

    if (trigger.type === "price-trigger") {
        context.eventType = "price_trigger";
        context.details = {
            symbol: trigger.data?.metadata?.asset,
            targetPrice: trigger.data?.metadata?.targetPrice,
            condition: trigger.data?.metadata?.condition,
            aiContext: {
                triggerType: "price-trigger",
                marketType: trigger.data?.metadata?.marketType === "Crypto" ? "Crypto" : "Indian",
                symbol: trigger.data?.metadata?.asset,
                connectedSymbols,
                targetPrice: trigger.data?.metadata?.targetPrice,
                condition: trigger.data?.metadata?.condition,
            },
        };
    }

    if (trigger.type === "conditional-trigger" && trigger.data?.metadata) {
        context.details = {
            ...(context.details || {}),
            aiContext: {
                triggerType: "conditional-trigger",
                marketType: trigger.data?.metadata?.marketType === "Crypto" ? "Crypto" : "Indian",
                symbol: trigger.data?.metadata?.asset,
                connectedSymbols,
                targetPrice: trigger.data?.metadata?.targetPrice,
                condition: trigger.data?.metadata?.condition,
                expression: trigger.data?.metadata?.expression,
                evaluatedCondition: condition,
            },
        };
    }

    return context;
}

export function registerMergeArrival(params: {
    context: ExecutionContext;
    mergeNodeId: string;
    incomingEdgeCount: number;
    arrivalEdgeId?: string;
}): { shouldContinue: boolean; releasedNow: boolean } {
    const { context, mergeNodeId, incomingEdgeCount, arrivalEdgeId } = params;
    context.runtime = context.runtime || {};
    context.runtime.mergeArrivals = context.runtime.mergeArrivals || {};
    context.runtime.releasedMerges = context.runtime.releasedMerges || [];

    const arrivals = new Set(context.runtime.mergeArrivals[mergeNodeId] || []);
    if (arrivalEdgeId) {
        arrivals.add(arrivalEdgeId);
    }

    context.runtime.mergeArrivals[mergeNodeId] = Array.from(arrivals);

    const alreadyReleased = context.runtime.releasedMerges.includes(mergeNodeId);
    if (alreadyReleased) {
        return { shouldContinue: false, releasedNow: false };
    }

    if (incomingEdgeCount <= 1 || arrivals.size >= incomingEdgeCount) {
        context.runtime.releasedMerges.push(mergeNodeId);
        return { shouldContinue: true, releasedNow: true };
    }

    return { shouldContinue: false, releasedNow: false };
}

export function resolveConditionalEdges(params: {
    sourceNode: NodeType;
    nodes: NodeType[];
    outgoingEdges: EdgeType[];
    evaluatedCondition: boolean;
}): EdgeType[] {
    const { sourceNode, nodes, outgoingEdges, evaluatedCondition } = params;
    if (sourceNode?.type !== "conditional-trigger" && sourceNode?.type !== "if") {
        return outgoingEdges;
    }

    return outgoingEdges.filter((edge) => {
        if (edge.sourceHandle === "true" || edge.sourceHandle === "false") {
            return edge.sourceHandle === String(evaluatedCondition);
        }

        const targetNode = nodes.find((node) => node.id === edge.target);
        const targetCondition = targetNode?.data?.metadata?.condition;
        if (typeof targetCondition === "boolean") {
            return targetCondition === evaluatedCondition;
        }

        return true;
    });
}
