import type { AIExtractResult } from "@quantnest-trading/types";
import { runtimeExtract } from "../ai/runtime-extract";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import { executeActionWithRetry } from "./shared";

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
        const resolvedApiKey = process.env.GOOGLE_API_KEY || "";
        if (!resolvedApiKey) {
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
        const details: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(result)) {
          details[`${nodeId}_ai_${key}`] = value;
        }
        details[`${nodeId}_ai_raw`] = result;
        context.details = { ...context.details, ...details, ai: { ...result } };

        const fieldCount = Object.keys(result).length;
        return `AI Extract: extracted ${fieldCount} field${fieldCount !== 1 ? "s" : ""}`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Extract execution error:", error);
      },
    });
  },
};
