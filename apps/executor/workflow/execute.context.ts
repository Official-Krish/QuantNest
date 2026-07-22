import type {
  TriggerEvaluationSnapshot,
  ExecutionTraceBranchDecision,
  ExecutionTraceNodeEntry,
} from "@quantnest-trading/types";
import type { EdgeType, NodeType } from "../types";

export interface ExecutionContext {
  executionMode?: "live" | "dry-run";
  eventType?:
    | "buy"
    | "sell"
    | "price_trigger"
    | "trade_failed"
    | "trade_skipped"
    | "Long"
    | "Short";
  userId?: string;
  workflowId?: string;
  trace?: {
    triggerSnapshot?: TriggerEvaluationSnapshot;
    nodeEntries: ExecutionTraceNodeEntry[];
    branchDecisions: ExecutionTraceBranchDecision[];
  };
  details?: {
    symbol?: string;
    quantity?: number;
    exchange?: string;
    targetPrice?: number;
    condition?: "above" | "below";
    tradeType?: "buy" | "sell";
    failureReason?: string;
    reason?: string;
    aiContext?: {
      triggerType?: string;
      marketType?: "Indian" | "Crypto";
      symbol?: string;
      connectedSymbols?: string[];
      targetPrice?: number;
      condition?: "above" | "below";
      direction?: "bullish" | "bearish";
      breakoutLevel?: number;
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
  nodeCondition: unknown,
): boolean {
  if (typeof workflowCondition !== "boolean") {
    return false;
  }
  if (typeof nodeCondition !== "boolean") {
    return false;
  }
  return workflowCondition !== nodeCondition;
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
  if (
    sourceNode?.type !== "conditional-trigger" &&
    sourceNode?.type !== "if" &&
    sourceNode?.type !== "recheck"
  ) {
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
