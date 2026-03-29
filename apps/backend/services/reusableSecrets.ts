import {
  decryptReusableSecretPayload,
  encryptReusableSecretPayload,
  type ReusableSecretService,
  UserReusableSecretModel,
  WorkflowModel,
} from "@quantnest-trading/db/client";

export const SECRET_SERVICE_FIELDS: Record<ReusableSecretService, string[]> = {
  zerodha: ["apiKey", "accessToken"],
  groww: ["accessToken"],
  lighter: ["apiKey", "accountIndex", "apiKeyIndex"],
  slack: ["slackBotToken", "slackUserId"],
  discord: ["webhookUrl"],
  whatsapp: ["recipientPhone"],
  "notion-daily-report": ["notionApiKey"],
  "google-drive-daily-csv": ["googleClientEmail", "googlePrivateKey"],
};

export function getSecretFieldsForService(service: ReusableSecretService) {
  return SECRET_SERVICE_FIELDS[service] || [];
}

export function sanitizeSecretPayload(
  service: ReusableSecretService,
  payload: Record<string, unknown>,
) {
  const allowedFields = getSecretFieldsForService(service);
  return Object.fromEntries(
    allowedFields
      .map((field) => [field, payload[field]])
      .filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== ""),
  );
}

export async function listReusableSecrets(userId: string, service?: ReusableSecretService) {
  const query = service ? { userId, service } : { userId };
  const secrets = await UserReusableSecretModel.find(query).sort({ updatedAt: -1 });
  return secrets.map((secret) => ({
    id: String(secret._id),
    name: secret.name,
    service: secret.service as ReusableSecretService,
    fieldKeys: secret.fieldKeys || [],
    createdAt: secret.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: secret.updatedAt?.toISOString?.() || new Date().toISOString(),
    lastUsedAt: secret.lastUsedAt?.toISOString?.(),
  }));
}

export async function getReusableSecretForEdit(userId: string, secretId: string) {
  const secret = await UserReusableSecretModel.findOne({ _id: secretId, userId });
  if (!secret || !secret.encryptedPayload) return null;
  return {
    id: String(secret._id),
    name: secret.name,
    service: secret.service as ReusableSecretService,
    fieldKeys: secret.fieldKeys || [],
    payload: decryptReusableSecretPayload(secret.encryptedPayload),
    createdAt: secret.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: secret.updatedAt?.toISOString?.() || new Date().toISOString(),
    lastUsedAt: secret.lastUsedAt?.toISOString?.(),
  };
}

export async function createReusableSecret(params: {
  userId: string;
  name: string;
  service: ReusableSecretService;
  payload: Record<string, unknown>;
}) {
  const sanitizedPayload = sanitizeSecretPayload(params.service, params.payload);
  const fieldKeys = Object.keys(sanitizedPayload);
  const created = await UserReusableSecretModel.create({
    userId: params.userId,
    name: params.name,
    service: params.service,
    fieldKeys,
    encryptedPayload: encryptReusableSecretPayload(sanitizedPayload),
  });
  return {
    id: String(created._id),
    name: created.name,
    service: created.service as ReusableSecretService,
    fieldKeys: created.fieldKeys || [],
    createdAt: created.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: created.updatedAt?.toISOString?.() || new Date().toISOString(),
    lastUsedAt: created.lastUsedAt?.toISOString?.(),
  };
}

export async function updateReusableSecret(params: {
  userId: string;
  secretId: string;
  name?: string;
  payload?: Record<string, unknown>;
}) {
  const existing = await UserReusableSecretModel.findOne({ _id: params.secretId, userId: params.userId });
  if (!existing) return null;

  if (params.name) {
    existing.name = params.name;
  }

  if (params.payload) {
    const sanitizedPayload = sanitizeSecretPayload(existing.service as ReusableSecretService, params.payload);
    existing.fieldKeys = Object.keys(sanitizedPayload);
    existing.encryptedPayload = encryptReusableSecretPayload(sanitizedPayload);
  }

  await existing.save();

  return {
    id: String(existing._id),
    name: existing.name,
    service: existing.service as ReusableSecretService,
    fieldKeys: existing.fieldKeys || [],
    createdAt: existing.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: existing.updatedAt?.toISOString?.() || new Date().toISOString(),
    lastUsedAt: existing.lastUsedAt?.toISOString?.(),
  };
}

export async function deleteReusableSecret(userId: string, secretId: string) {
  const deleted = await UserReusableSecretModel.findOneAndDelete({ _id: secretId, userId });
  if (!deleted) {
    return { deleted: false, pausedWorkflowCount: 0 };
  }

  const pauseResult = await WorkflowModel.updateMany(
    {
      userId,
      status: "active",
      "nodes.data.metadata.secretId": secretId,
    },
    {
      $set: {
        status: "paused",
      },
    },
  );

  return {
    deleted: true,
    pausedWorkflowCount: pauseResult.modifiedCount || 0,
  };
}

export async function resolveSecretPayload(userId: string, secretId?: string | null) {
  if (!secretId) return null;
  const secret = await UserReusableSecretModel.findOne({ _id: secretId, userId });
  if (!secret || !secret.encryptedPayload) return null;
  secret.lastUsedAt = new Date();
  await secret.save();
  return {
    id: String(secret._id),
    service: secret.service as ReusableSecretService,
    payload: decryptReusableSecretPayload(secret.encryptedPayload),
  };
}

export async function resolveNodeMetadataSecrets<T extends Record<string, any>>(params: {
  userId: string;
  service: ReusableSecretService;
  metadata?: T | null;
}) {
  const metadata = { ...(params.metadata || {}) } as Record<string, unknown>;
  const secretId = typeof metadata.secretId === "string" ? metadata.secretId : undefined;
  if (!secretId) return metadata as T;

  const resolved = await resolveSecretPayload(params.userId, secretId);
  if (!resolved) {
    throw new Error(`Reusable secret not found for ${params.service}`);
  }

  if (resolved.service !== params.service) {
    throw new Error(`Reusable secret service mismatch for ${params.service}`);
  }

  return {
    ...metadata,
    ...resolved.payload,
  } as T;
}
