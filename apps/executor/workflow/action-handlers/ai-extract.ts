import type { AIExtractResult } from "@quantnest-trading/types";
import { runtimeExtract } from "../ai/runtime-extract";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import { executeActionWithRetry, handleApprovalGate } from "./shared";

export const aiExtractHandler: IActionHandler = {
  handlerId: "ai-extract",

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, steps, nodes, edges } = params;
    const metadata = node.data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) return;

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "AI Extract",
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

        const result: AIExtractResult = await runtimeExtract({
          metadata,
          nodeId: node.id ?? node.nodeId,
          nodes,
          edges,
          context,
          resolvedApiKey,
        });

        const nodeId = node.nodeId;
        const reasoningSteps = result.reasoningSteps;
        const details: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(result)) {
          if (key === "reasoningSteps") continue;
          details[`${nodeId}_ai_${key}`] = value;
        }
        details[`${nodeId}_ai_raw`] = result;
        context.details = {
          ...context.details,
          ...details,
          ...(reasoningSteps
            ? { [`${nodeId}_ai_reasoning_steps`]: reasoningSteps }
            : {}),
          ai: {
            ...Object.fromEntries(
              Object.entries(result).filter(([k]) => k !== "reasoningSteps"),
            ),
            ...(reasoningSteps ? { reasoningSteps } : {}),
          },
        };

        await handleApprovalGate({
          metadata,
          nodeId,
          nodeType: "AI Extract",
          context,
          steps,
          result: result as unknown as Record<string, unknown>,
        });

        const fieldCount = Object.keys(result).length;
        return `AI Extract: extracted ${fieldCount} field${fieldCount !== 1 ? "s" : ""}`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Extract execution error:", error);
      },
    });
  },
};
