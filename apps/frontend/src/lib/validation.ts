import type { LighterMetadata, TradingMetadata } from "@quantnest-trading/types";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;
export const ZERODHA_API_KEY_REGEX = /^[A-Za-z0-9]{8,32}$/;
export const ACCESS_TOKEN_REGEX = /^[A-Za-z0-9._-]{16,512}$/;
export const LIGHTER_PRIVATE_KEY_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;
export const DISCORD_WEBHOOK_REGEX = /^https:\/\/(discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/;
export const WHATSAPP_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
export const NOTION_TOKEN_REGEX = /^(secret_[A-Za-z0-9]{20,}|ntn_[A-Za-z0-9_=-]{20,})$/;
export const NOTION_PAGE_ID_REGEX = /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
export const GOOGLE_SERVICE_ACCOUNT_EMAIL_REGEX = /^[A-Za-z0-9-]+@[A-Za-z0-9-]+\.iam\.gserviceaccount\.com$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validateStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getActionValidationErrors(action: string, metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (action === "gmail" && !validateEmail(String(metadata.recipientEmail || "").trim())) {
    errors.push("Enter a valid recipient email.");
  }

  if (action === "discord" && !DISCORD_WEBHOOK_REGEX.test(String(metadata.webhookUrl || "").trim())) {
    errors.push("Discord webhook URL format is invalid.");
  }

  if (action === "whatsapp" && !WHATSAPP_PHONE_REGEX.test(String(metadata.recipientPhone || "").trim())) {
    errors.push("WhatsApp number must be in E.164 format.");
  }

  if (action === "notion-daily-report") {
    if (!NOTION_TOKEN_REGEX.test(String(metadata.notionApiKey || "").trim())) {
      errors.push("Notion API key format is invalid.");
    }
    if (!NOTION_PAGE_ID_REGEX.test(String(metadata.parentPageId || "").trim())) {
      errors.push("Notion parent page ID format is invalid.");
    }
    if (metadata.aiConsent !== true) {
      errors.push("AI consent is required for Notion reporting.");
    }
  }

  if (action === "google-drive-daily-csv") {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL_REGEX.test(String(metadata.googleClientEmail || "").trim())) {
      errors.push("Google service account email format is invalid.");
    }
    if (!String(metadata.googlePrivateKey || "").includes("BEGIN PRIVATE KEY")) {
      errors.push("Google private key format is invalid.");
    }
    if (metadata.aiConsent !== true) {
      errors.push("AI consent is required for Google Drive insights.");
    }
  }

  return errors;
}

export function getSignupValidationErrors(input: {
  username: string;
  email: string;
  password: string;
}): string[] {
  const errors: string[] = [];

  if (input.username.trim().length < 3 || input.username.trim().length > 30) {
    errors.push("Username must be between 3 and 30 characters.");
  }

  if (!validateEmail(input.email)) {
    errors.push("Enter a valid email address.");
  }

  if (!validateStrongPassword(input.password)) {
    errors.push(
      "Password must include upper/lowercase letters, a number, a special character, and be at least 8 characters."
    );
  }

  return errors;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number.NaN;
}

export function getTradingValidationErrors(
  action: "zerodha" | "groww" | "lighter",
  metadata: TradingMetadata | LighterMetadata | {}
): string[] {
  const errors: string[] = [];
  const data = metadata as any;

  const qty = toNumber(data.qty);
  if (!Number.isFinite(qty) || qty <= 0) {
    errors.push("Quantity must be greater than 0.");
  }

  if (!data.type) {
    errors.push("Select order/position type.");
  }
  if (!data.symbol) {
    errors.push("Select an asset/symbol.");
  }

  if (action === "zerodha") {
    if (!ZERODHA_API_KEY_REGEX.test(String(data.apiKey || "").trim())) {
      errors.push("Zerodha API key must be 8-32 alphanumeric characters.");
    }
    const accessToken = String(data.accessToken || "").trim();
    if (accessToken.length > 0 && !ACCESS_TOKEN_REGEX.test(accessToken)) {
      errors.push("Zerodha access token format is invalid.");
    }
  }

  if (action === "groww") {
    if (!ACCESS_TOKEN_REGEX.test(String(data.accessToken || "").trim())) {
      errors.push("Groww access token format is invalid.");
    }
  }

  if (action === "lighter") {
    if (!LIGHTER_PRIVATE_KEY_REGEX.test(String(data.apiKey || "").trim())) {
      errors.push("Lighter API key must be a valid 64-char hex private key.");
    }
    const accountIndex = toNumber(data.accountIndex);
    const apiKeyIndex = toNumber(data.apiKeyIndex);
    if (!Number.isInteger(accountIndex) || accountIndex < 0) {
      errors.push("Lighter account index must be a non-negative integer.");
    }
    if (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0) {
      errors.push("Lighter API key index must be a non-negative integer.");
    }
  }

  return errors;
}
