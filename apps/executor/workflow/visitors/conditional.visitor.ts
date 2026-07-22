import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import { evaluateConditionalMetadata } from "../../handlers/trigger.handler";
import { resolveConditionalEdges } from "../execute.context";
import type { NodeType } from "../../types";
import type { ExecutionStep } from "@quantnest-trading/types";
import type { INodeVisitor, VisitParams, VisitResult } from "./base.visitor";

function buildRecheckEvaluationMetadata(
  sourceNode: NodeType,
  nodes: NodeType[],
) {
  const metadata = (sourceNode.data?.metadata || {}) as Record<string, unknown>;
  const mode = String(metadata.recheckMode || "trigger").toLowerCase();

  if (mode === "custom") {
    return metadata;
  }

  const triggerNode = nodes.find(
    (node) => String(node?.data?.kind || "").toLowerCase() === "trigger",
  );
  if (!triggerNode?.data?.metadata) {
    return metadata;
  }

  const triggerType = String(triggerNode.type || "").toLowerCase();
  if (
    triggerType === "conditional-trigger" ||
    triggerType === "price-trigger"
  ) {
    return triggerNode.data.metadata as Record<string, unknown>;
  }

  return null;
}

export class ConditionalVisitor implements INodeVisitor {
  readonly nodeTypes = [
    "conditional-trigger",
    "if",
    "filter",
    "recheck",
  ] as const;

  async visit(params: VisitParams): Promise<VisitResult> {
    const { node: sourceNode, nodes, edges, context, condition } = params;
    const steps: ExecutionStep[] = [];

    const isRootTriggerNode =
      String(sourceNode.data?.kind || "").toLowerCase() === "trigger" &&
      sourceNode?.type === "conditional-trigger";
    const evaluationMetadata =
      sourceNode?.type === "recheck"
        ? buildRecheckEvaluationMetadata(sourceNode, nodes)
        : sourceNode.data?.metadata;
    let evaluatedCondition: boolean;
    let conditionalSnapshot: Partial<TriggerEvaluationSnapshot> | undefined;

    if (typeof condition === "boolean" && isRootTriggerNode) {
      evaluatedCondition = condition;
    } else if (evaluationMetadata) {
      const result = await evaluateConditionalMetadata(
        evaluationMetadata as any,
      );
      evaluatedCondition = result.evaluatedCondition;
      conditionalSnapshot = result.snapshot;
    } else {
      evaluatedCondition = true;
    }

    context.details = {
      ...(context.details || {}),
      aiContext: {
        triggerType:
          sourceNode?.type === "filter"
            ? "filter"
            : sourceNode?.type === "recheck"
              ? "recheck"
              : "conditional-trigger",
        marketType:
          (evaluationMetadata as any)?.marketType === "Crypto"
            ? "Crypto"
            : "Indian",
        symbol: (evaluationMetadata as any)?.asset || context.details?.symbol,
        connectedSymbols: context.details?.aiContext?.connectedSymbols,
        targetPrice: (evaluationMetadata as any)?.targetPrice,
        condition: (evaluationMetadata as any)?.condition,
        timerIntervalSeconds: context.details?.aiContext?.timerIntervalSeconds,
        expression: (evaluationMetadata as any)?.expression,
        evaluatedCondition,
      },
    };

    const outgoingEdges = edges.filter(
      ({ source }) => source === sourceNode.id,
    );
    const targetEdges =
      sourceNode?.type === "filter"
        ? evaluatedCondition
          ? outgoingEdges
          : []
        : resolveConditionalEdges({
            sourceNode,
            nodes,
            outgoingEdges,
            evaluatedCondition,
          });

    if (context.trace) {
      const availableBranches = outgoingEdges
        .filter((e) => e.sourceHandle === "true" || e.sourceHandle === "false")
        .map((e) => e.sourceHandle!);

      const selectedBranch =
        targetEdges.length > 0 && targetEdges[0]
          ? targetEdges[0].sourceHandle || null
          : null;
      context.trace.branchDecisions.push({
        nodeId: sourceNode.nodeId || sourceNode.id,
        nodeType: sourceNode.type || "conditional",
        evaluatedCondition,
        selectedBranch,
        availableBranches,
      });

      if (conditionalSnapshot) {
        context.trace.triggerSnapshot = {
          ...context.trace.triggerSnapshot,
          ...conditionalSnapshot,
          evaluatedCondition,
        } as TriggerEvaluationSnapshot;
      }
    }

    if (
      !targetEdges.length &&
      sourceNode?.type === "filter" &&
      evaluatedCondition === false
    ) {
      return { shouldContinue: false, steps };
    }

    if (!targetEdges.length && context.userId && context.workflowId) {
      const isGateOnlyNode = sourceNode?.type === "filter";
      await createUserNotification({
        userId: context.userId,
        workflowId: context.workflowId,
        type: "conditional_no_downstream_branch",
        severity: "warning",
        title: isGateOnlyNode
          ? "Filter blocked downstream execution"
          : "Conditional has no downstream branch",
        message: isGateOnlyNode
          ? "A gated node blocked execution because its condition did not pass."
          : "A conditional node evaluated, but there was no valid true/false branch connected to continue execution.",
        metadata: {
          nodeId: sourceNode.nodeId || sourceNode.id,
          evaluatedCondition,
        },
        dedupeKey: `${isGateOnlyNode ? "filter-blocked" : "conditional-no-branch"}:${context.workflowId}:${sourceNode.nodeId || sourceNode.id}:${evaluatedCondition}`,
        dedupeWindowHours: 12,
      });
    }

    return {
      shouldContinue: true,
      resolvedCondition: evaluatedCondition,
      targetEdges,
      steps,
    };
  }
}
