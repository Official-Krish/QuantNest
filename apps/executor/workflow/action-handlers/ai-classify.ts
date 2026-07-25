import type { AIClassifyResult } from "@quantnest-trading/types";
import { runtimeClassify } from "../ai/runtime-classify";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import { executeActionWithRetry, handleApprovalGate } from "./shared";

export const aiClassifyHandler: IActionHandler = {
  handlerId: "ai-classify",

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, steps, nodes, edges } = params;
    const metadata = node.data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) return;

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "AI Classify",
      retryPolicy: (metadata as any)?.retryPolicy,
      operation: async () => {
        const resolvedApiKey = process.env.GOOGLE_API_KEY || "";
        if (!resolvedApiKey) {
          throw new Error("GOOGLE_API_KEY is not configured");
        }

        const result: AIClassifyResult = await runtimeClassify({
          metadata,
          nodeId: node.id ?? node.nodeId,
          nodes,
          edges,
          context,
          resolvedApiKey,
        });

        const nodeId = node.nodeId;
        const minConfidence = Number((metadata as any)?.minConfidence ?? 0);
        const confidencePassed = result.confidence >= minConfidence;
        const reasoningSteps = (result as any).reasoningSteps;

        context.details = {
          ...context.details,
          [`${nodeId}_ai_label`]: result.label,
          [`${nodeId}_ai_confidence`]: String(result.confidence),
          [`${nodeId}_ai_raw`]: result,
          [`${nodeId}_ai_confidence_passed`]: confidencePassed,
          ...(reasoningSteps
            ? { [`${nodeId}_ai_reasoning_steps`]: reasoningSteps }
            : {}),
          ai: {
            label: result.label,
            confidence: result.confidence,
            confidencePassed,
            ...(reasoningSteps ? { reasoningSteps } : {}),
          },
        };

        await handleApprovalGate({
          metadata,
          nodeId,
          nodeType: "AI Classify",
          context,
          steps,
          result: result as unknown as Record<string, unknown>,
        });

        return `AI Classify: ${result.label} (confidence: ${(result.confidence * 100).toFixed(0)}%)`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Classify execution error:", error);
      },
    });
  },
};
