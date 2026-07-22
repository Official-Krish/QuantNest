import type { ExecutionStep } from "@quantnest-trading/types";
import { registerMergeArrival } from "../execute.context";
import type { INodeVisitor, VisitParams, VisitResult } from "./base.visitor";

export class MergeVisitor implements INodeVisitor {
  readonly nodeTypes = ["merge"] as const;

  async visit(params: VisitParams): Promise<VisitResult> {
    const { node: sourceNode, edges, context, arrivedViaEdgeId } = params;
    const steps: ExecutionStep[] = [];

    const incomingEdgeCount = edges.filter(
      (edge) => edge.target === sourceNode.id,
    ).length;
    const mergeState = registerMergeArrival({
      context,
      mergeNodeId: sourceNode.id,
      incomingEdgeCount,
      arrivalEdgeId: arrivedViaEdgeId,
    });

    if (!mergeState.shouldContinue) {
      return { shouldContinue: false, steps };
    }

    if (mergeState.releasedNow) {
      steps.push({
        nodeId: sourceNode.nodeId || sourceNode.id,
        nodeType: "Merge Action",
        status: "Success",
        message:
          incomingEdgeCount > 1
            ? `Merged ${incomingEdgeCount} incoming branches`
            : "Merge path continued",
      } as ExecutionStep);
    }

    return { shouldContinue: true, steps };
  }
}
