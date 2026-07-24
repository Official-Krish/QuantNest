import type { AIDecisionResult } from "@quantnest-trading/types";
import { runtimeExecute } from "../ai/runtime";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import { executeActionWithRetry } from "./shared";

export const aiDecisionHandler: IActionHandler = {
  handlerId: "ai-decision",

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, steps } = params;
    const metadata = node.data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) return;

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "AI Decision",
      retryPolicy: (metadata as any)?.retryPolicy,
      operation: async () => {
        const resolvedApiKey = process.env.GOOGLE_API_KEY || "";
        if (!resolvedApiKey) {
          throw new Error("GOOGLE_API_KEY is not configured");
        }

        const result: AIDecisionResult = await runtimeExecute({
          metadata,
          nodeId: node.id ?? node.nodeId,
          nodes: params.nodes,
          edges: params.edges,
          context,
          resolvedApiKey,
        });

        const nodeId = node.nodeId;
        context.details = {
          ...context.details,
          [`${nodeId}_ai_decision`]: result.decision,
          [`${nodeId}_ai_confidence`]: String(result.confidence),
          [`${nodeId}_ai_reason`]: result.reason,
          [`${nodeId}_ai_raw`]: result,
        };

        return `AI Decision: ${result.decision} (confidence: ${(result.confidence * 100).toFixed(0)}%)`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Decision execution error:", error);
      },
    });
  },
};
