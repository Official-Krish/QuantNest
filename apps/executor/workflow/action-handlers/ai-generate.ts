import type { AIGenerateResult } from "@quantnest-trading/types";
import { runtimeGenerate } from "../ai/runtime-generate";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import { executeActionWithRetry, handleApprovalGate } from "./shared";

export const aiGenerateHandler: IActionHandler = {
  handlerId: "ai-generate",

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, steps, nodes, edges } = params;
    const metadata = node.data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) return;

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "AI Generate",
      retryPolicy: (metadata as any)?.retryPolicy,
      operation: async () => {
        const providerName = (metadata as any)?.provider || "gemini";
        const resolvedApiKey =
          providerName === "openclaw"
            ? (metadata as any)?.openclawToken || ""
            : process.env.GOOGLE_API_KEY || "";
        if (!resolvedApiKey && providerName !== "openclaw") {
          throw new Error("GOOGLE_API_KEY is not configured");
        }

        const result: AIGenerateResult = await runtimeGenerate({
          metadata,
          nodeId: node.id ?? node.nodeId,
          nodes,
          edges,
          context,
          resolvedApiKey,
        });

        const nodeId = node.nodeId;
        const reasoningSteps = (result as any).reasoningSteps;
        context.details = {
          ...context.details,
          [`${nodeId}_ai_summary`]: result.summary,
          [`${nodeId}_ai_analysis`]: result.analysis ?? "",
          [`${nodeId}_ai_raw`]: result,
          ...(reasoningSteps
            ? { [`${nodeId}_ai_reasoning_steps`]: reasoningSteps }
            : {}),
          ai: {
            summary: result.summary,
            analysis: result.analysis ?? "",
            ...(reasoningSteps ? { reasoningSteps } : {}),
          },
        };

        await handleApprovalGate({
          metadata,
          nodeId,
          nodeType: "AI Generate",
          context,
          steps,
          result: result as unknown as Record<string, unknown>,
        });

        return `AI Generate: ${result.summary.slice(0, 80)}${result.summary.length > 80 ? "..." : ""}`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Generate execution error:", error);
      },
    });
  },
};
