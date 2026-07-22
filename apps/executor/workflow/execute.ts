import type {
  ExecutionResponseType,
  ExecutionStep,
  ExecutionTraceBranchDecision,
  ExecutionTraceNodeEntry,
  TriggerEvaluationSnapshot,
} from "@quantnest-trading/types";
import { executeActionNode } from "./execute.actions";
import type { ExecutionContext } from "./execute.context";
import { ExecutionContextBuilder } from "./context.builder";
import { visitorRegistry } from "./visitors";
import type { EdgeType, NodeType } from "../types";

export class WorkflowEngine {
  async execute(
    nodes: NodeType[],
    edges: EdgeType[],
    userId?: string,
    workflowId?: string,
    condition?: boolean,
    executionMode?: "live" | "dry-run",
    triggerSnapshot?: TriggerEvaluationSnapshot,
  ): Promise<
    ExecutionResponseType & {
      trace?: {
        triggerSnapshot?: TriggerEvaluationSnapshot;
        nodeEntries: ExecutionTraceNodeEntry[];
        branchDecisions: ExecutionTraceBranchDecision[];
      };
    }
  > {
    const trigger = nodes.find(
      (node) =>
        node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER",
    );

    if (!trigger) {
      return {
        status: "Failed",
        steps: [
          {
            step: 1,
            nodeId: "unknown",
            nodeType: "trigger",
            status: "Failed",
            message: "No trigger node found",
          },
        ],
      };
    }

    const context = new ExecutionContextBuilder()
      .setUser(userId)
      .setWorkflow(workflowId)
      .setExecutionMode(executionMode)
      .setCondition(condition)
      .setTrigger(trigger, nodes)
      .build();

    if (context.trace && triggerSnapshot) {
      context.trace.triggerSnapshot = triggerSnapshot;
    }

    const result = await this.traverse(
      trigger.id,
      nodes,
      edges,
      context,
      condition,
    );

    return {
      ...result,
      trace: context.trace
        ? {
            triggerSnapshot: context.trace.triggerSnapshot,
            nodeEntries: context.trace.nodeEntries,
            branchDecisions: context.trace.branchDecisions,
          }
        : undefined,
    };
  }

  private async traverse(
    sourceId: string,
    nodes: NodeType[],
    edges: EdgeType[],
    context: ExecutionContext = {},
    condition?: boolean,
    arrivedViaEdgeId?: string,
  ): Promise<ExecutionResponseType> {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const localSteps: ExecutionStep[] = [];

    const outgoingEdges = edges.filter(({ source }) => source === sourceId);

    let nextCondition = condition;
    let targetEdges = outgoingEdges;

    const visitor = sourceNode
      ? visitorRegistry.get(String(sourceNode.type ?? ""))
      : undefined;

    if (visitor) {
      const result = await visitor.visit({
        node: sourceNode!,
        nodes,
        edges,
        context,
        condition,
        arrivedViaEdgeId,
      });

      if (!result.shouldContinue) {
        return { status: "Success", steps: [...localSteps, ...result.steps] };
      }

      localSteps.push(...result.steps);

      if (result.resolvedCondition !== undefined) {
        nextCondition = result.resolvedCondition;
      }

      if (result.targetEdges) {
        targetEdges = result.targetEdges;
      }
    }

    if (!targetEdges.length) {
      return { status: "Success", steps: localSteps };
    }

    const steps: ExecutionStep[] = [];
    await Promise.all(
      targetEdges.map(async (edge) => {
        const node = nodes.find((n) => n.id === edge.target);
        if (!node) return;

        await executeActionNode({
          node,
          nodes,
          edges,
          context,
          nextCondition,
          steps,
        });

        if (context.trace) {
          const stepResult = steps[steps.length - 1];
          context.trace.nodeEntries.push({
            nodeId: node.nodeId || node.id,
            nodeType: node.type || "unknown",
            nodeKind:
              (node.data?.kind || "").toLowerCase() === "trigger"
                ? "trigger"
                : "action",
            status: stepResult?.status === "Failed" ? "Failed" : "Success",
            message: stepResult?.message,
            resolvedMetadata: node.data?.metadata as
              | Record<string, unknown>
              | undefined,
          });
        }
      }),
    );

    const childResults = await Promise.all(
      targetEdges.map((edge) =>
        this.traverse(
          edge.target,
          nodes,
          edges,
          context,
          nextCondition,
          edge.id,
        ),
      ),
    );

    const childSteps = childResults.flatMap((result) => result.steps);
    const allSteps = [...localSteps, ...steps, ...childSteps];

    if (
      allSteps.some(
        (step) => step.status === "Failed" && step.terminalFailure !== false,
      )
    ) {
      return { status: "Failed", steps: allSteps };
    }

    return { status: "Success", steps: allSteps };
  }
}

export const workflowEngine = new WorkflowEngine();

export async function executeWorkflow(
  nodes: NodeType[],
  edges: EdgeType[],
  userId?: string,
  workflowId?: string,
  condition?: boolean,
  executionMode?: "live" | "dry-run",
  triggerSnapshot?: TriggerEvaluationSnapshot,
): Promise<
  ExecutionResponseType & {
    trace?: {
      triggerSnapshot?: TriggerEvaluationSnapshot;
      nodeEntries: ExecutionTraceNodeEntry[];
      branchDecisions: ExecutionTraceBranchDecision[];
    };
  }
> {
  return workflowEngine.execute(
    nodes,
    edges,
    userId,
    workflowId,
    condition,
    executionMode,
    triggerSnapshot,
  );
}
