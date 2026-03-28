import {
  decryptReusableSecretPayload,
  UserReusableSecretModel,
  type ReusableSecretService,
} from "@quantnest-trading/db/client";

export async function resolveExecutorNodeSecrets<T extends Record<string, any>>(params: {
  userId?: string;
  service: ReusableSecretService;
  metadata?: T | null;
}) {
  const metadata = { ...(params.metadata || {}) } as Record<string, unknown>;
  const secretId = typeof metadata.secretId === "string" ? metadata.secretId : undefined;
  if (!secretId || !params.userId) {
    return metadata as T;
  }

  const secret = await UserReusableSecretModel.findOne({ _id: secretId, userId: params.userId });
  if (!secret || !secret.encryptedPayload) {
    throw new Error(`Reusable secret not found for ${params.service}`);
  }

  if (secret.service !== params.service) {
    throw new Error(`Reusable secret service mismatch for ${params.service}`);
  }

  secret.lastUsedAt = new Date();
  await secret.save();

  return {
    ...metadata,
    ...decryptReusableSecretPayload(secret.encryptedPayload),
  } as T;
}
