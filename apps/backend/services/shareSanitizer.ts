const SENSITIVE_KEYS = new Set([
  "secretId",
  "accessToken",
  "apiKey",
  "apiKeyIndex",
  "slackBotToken",
  "telegramBotToken",
  "notionApiKey",
  "password",
  "privateKey",
  "clientEmail",
  "connectionString",
  "botToken",
]);

export function sanitizeSharedPayload<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSharedPayload(entry)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const nextValue: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue;
    }
    nextValue[key] = sanitizeSharedPayload(entry);
  }

  return nextValue as T;
}
