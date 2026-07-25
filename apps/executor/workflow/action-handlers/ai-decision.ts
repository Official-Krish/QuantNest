import type { AIDecisionResult } from "@quantnest-trading/types";
import { runtimeExecute } from "../ai/runtime";
import {
  checkRateLimit,
  trackAICost,
  getMonthlyUsage,
} from "../ai/rate-limiter";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import { executeActionWithRetry, pushStep } from "./shared";

export const aiDecisionHandler: IActionHandler = {
  handlerId: "ai-decision",

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, steps } = params;
    const metadata = node.data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) return;

    const userId = context.userId ?? "anonymous";
    const maxCost = Number((metadata as any)?.maxCostPerExecution ?? 0);
    const monthlyBudget = Number((metadata as any)?.monthlyBudget ?? 0);

    const { allowed, retryAfterMs } = checkRateLimit(
      userId,
      context.workflowId,
    );
    if (!allowed) {
      pushStep(steps, {
        nodeId: node.nodeId,
        nodeType: "AI Decision",
        status: "Failed",
        message: `Rate limited. Retry in ${Math.ceil(retryAfterMs / 1000)}s`,
        terminalFailure: false,
      });
      return;
    }

    if (monthlyBudget > 0) {
      const usage = getMonthlyUsage(userId);
      if (usage >= monthlyBudget) {
        pushStep(steps, {
          nodeId: node.nodeId,
          nodeType: "AI Decision",
          status: "Failed",
          message: "Monthly AI budget exceeded",
          terminalFailure: false,
        });
        return;
      }
    }

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

        if (maxCost > 0 || monthlyBudget > 0) {
          const estimatedCost = (result as any)?._cost ?? 0.01;
          const { withinBudget } = trackAICost(
            userId,
            estimatedCost,
            monthlyBudget,
          );
          if (!withinBudget) {
            throw new Error("Monthly AI budget exceeded after this execution");
          }
        }

        const nodeId = node.nodeId;
        const minConfidence = Number((metadata as any)?.minConfidence ?? 0);
        const confidencePassed = result.confidence >= minConfidence;

        context.details = {
          ...context.details,
          [`${nodeId}_ai_decision`]: result.decision,
          [`${nodeId}_ai_confidence`]: String(result.confidence),
          [`${nodeId}_ai_reason`]: result.reason,
          [`${nodeId}_ai_raw`]: result,
          [`${nodeId}_ai_confidence_passed`]: confidencePassed,
          ai: {
            decision: result.decision,
            confidence: result.confidence,
            reason: result.reason,
            confidencePassed,
          },
        };

        return `AI Decision: ${result.decision} (confidence: ${(result.confidence * 100).toFixed(0)}%)`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Decision execution error:", error);
      },
    });
  },
};
