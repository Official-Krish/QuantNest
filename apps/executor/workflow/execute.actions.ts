import { getNodeRegistryEntry } from "@quantnest-trading/node-registry";
import { actionHandlerFactory } from "./action-handlers";
import type { ExecuteActionNodeParams } from "./action-handlers";
import { resolveExecutorNodeSecrets } from "../services/reusableSecrets";
import { dispatchActionToOpenClaw } from "./ai/openclaw-dispatcher";
import {
  assertOrderAllowed,
  getRiskBrokerForNode,
} from "../services/riskGuard";
import { handleBrokerApprovalGate } from "./action-handlers/shared";

export async function executeActionNode(
  params: ExecuteActionNodeParams,
): Promise<void> {
  const { node, context } = params;

  const type = String(node.type || "").toLowerCase();
  const registryEntry = getNodeRegistryEntry(type);

  if (context.useOpenClaw && registryEntry?.requiresAgent) {
    const broker = getRiskBrokerForNode(type);
    if (broker) {
      const metadata = node.data?.metadata || {};
      const riskEvaluation = await assertOrderAllowed({
        broker,
        metadata: metadata as Record<string, unknown>,
        nodeRiskLimits: (metadata as any)?.riskLimits,
        workflowRiskLimits: context.workflowRiskLimits,
        userId: context.userId,
        workflowId: context.workflowId,
      });

      if (riskEvaluation.approvalRequired) {
        await handleBrokerApprovalGate({
          prompt: `Order notional ${riskEvaluation.notional.toFixed(2)} exceeds approval threshold ${(riskEvaluation.effectiveLimits.requireApprovalAbove as number)?.toFixed(2)}.`,
          nodeId: node.nodeId || node.id,
          nodeType: type,
          context,
          result: {
            broker,
            symbol: (metadata as any)?.symbol,
            qty: (metadata as any)?.qty || (metadata as any)?.amount,
            notional: riskEvaluation.notional,
            riskEvaluation,
          },
          steps: params.steps,
        });
      }
    }

    await dispatchActionToOpenClaw(params);
    return;
  }

  const handlerId = registryEntry?.executorActionHandlerId;
  const reusableSecretService = registryEntry?.reusableSecretService;
  const resolvedMetadata =
    reusableSecretService && context.executionMode !== "dry-run"
      ? await resolveExecutorNodeSecrets({
          userId: context.userId,
          service: reusableSecretService as Parameters<
            typeof resolveExecutorNodeSecrets
          >[0]["service"],
          metadata: node.data?.metadata || {},
        })
      : node.data?.metadata || {};

  if (!handlerId) {
    return;
  }

  const handler = actionHandlerFactory.get(handlerId);
  if (!handler) {
    return;
  }

  await handler.execute({
    ...params,
    resolvedMetadata: resolvedMetadata as Record<string, unknown>,
    type,
  });
}
