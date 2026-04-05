import { getNodeRegistryEntry } from "@quantnest-trading/node-registry";
import { actionHandlerMap } from "./action-handlers";
import type { ExecuteActionNodeParams } from "./action-handlers";
import { resolveExecutorNodeSecrets } from "../services/reusableSecrets";

export async function executeActionNode(params: ExecuteActionNodeParams): Promise<void> {
  const { node, context } = params;
  const type = String(node.type || "").toLowerCase();
  const registryEntry = getNodeRegistryEntry(type);
  const handlerId = registryEntry?.executorActionHandlerId;
  const reusableSecretService = registryEntry?.reusableSecretService;
  const resolvedMetadata = reusableSecretService
    ? await resolveExecutorNodeSecrets({
        userId: context.userId,
        service: reusableSecretService as Parameters<typeof resolveExecutorNodeSecrets>[0]["service"],
        metadata: node.data?.metadata || {},
      })
    : node.data?.metadata || {};

  if (!handlerId) {
    return;
  }

  const handler = actionHandlerMap[handlerId];
  if (!handler) {
    return;
  }

  await handler({
    ...params,
    resolvedMetadata: resolvedMetadata as Record<string, unknown>,
    type,
  });
}
