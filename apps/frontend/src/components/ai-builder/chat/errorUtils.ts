const UTF8_ENCODER = new TextEncoder();

export const AI_PROMPT_MAX_CHARS = 4000;
export const AI_PROMPT_MAX_BYTES = 12000;

function parseJsonSafely(value: string): any | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractRawMessage(error: any): string {
  const fromResponse = error?.response?.data?.message;
  const fromMessage = error?.message;

  if (typeof fromResponse === "string" && fromResponse.trim()) return fromResponse;
  if (typeof fromMessage === "string" && fromMessage.trim()) return fromMessage;

  return "";
}

function isPromptTooLargeMessage(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("context length") ||
    normalized.includes("prompt is too long") ||
    normalized.includes("input is too long") ||
    normalized.includes("input too large") ||
    normalized.includes("token limit") ||
    normalized.includes("request too large") ||
    normalized.includes("payload too large") ||
    normalized.includes("maximum context")
  );
}

function isProviderUnavailable(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("try again later") ||
    normalized.includes("service is currently unavailable")
  );
}

export function getPromptTooLargeReason(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const charCount = trimmed.length;
  if (charCount > AI_PROMPT_MAX_CHARS) {
    return `Prompt is too long (${charCount} chars). Keep it under ${AI_PROMPT_MAX_CHARS} characters.`;
  }

  const byteCount = UTF8_ENCODER.encode(trimmed).length;
  if (byteCount > AI_PROMPT_MAX_BYTES) {
    return `Prompt is too large (${byteCount} bytes). Keep it under ${AI_PROMPT_MAX_BYTES} bytes.`;
  }

  return null;
}

export function getFriendlyAiComposerError(error: unknown): string {
  const maybeError = error as any;
  const statusCode = Number(maybeError?.response?.status || 0);
  const responseCode = String(maybeError?.response?.data?.code || "").toUpperCase();
  const rawMessage = extractRawMessage(maybeError);

  if (responseCode === "AI_MODEL_TIER_LOCKED") {
    return "Free tier supports only Gemini 2.5 Flash.";
  }

  if (statusCode === 413 || isPromptTooLargeMessage(rawMessage)) {
    return "Prompt is too large for the model context. Shorten it and try again.";
  }

  if (statusCode === 429) {
    return "You are sending requests too quickly. Please wait a few seconds and retry.";
  }

  if (statusCode === 503 || isProviderUnavailable(rawMessage)) {
    return "Gemini is currently overloaded. Please retry in a minute.";
  }

  const parsed = parseJsonSafely(rawMessage);
  const nestedMessage = String(
    parsed?.error?.message || parsed?.message || "",
  ).trim();

  if (nestedMessage) {
    if (isPromptTooLargeMessage(nestedMessage)) {
      return "Prompt is too large for the model context. Shorten it and try again.";
    }
    if (isProviderUnavailable(nestedMessage)) {
      return "Gemini is currently overloaded. Please retry in a minute.";
    }
    return nestedMessage;
  }

  if (rawMessage) {
    return rawMessage;
  }

  return "Failed to send AI message. Please try again.";
}