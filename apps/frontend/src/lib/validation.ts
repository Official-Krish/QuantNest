import type { LighterMetadata, RetryPolicyMetadata, TradingMetadata } from "@quantnest-trading/types";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SLACK_BOT_TOKEN_REGEX = /^xoxb-[A-Za-z0-9-]+$/;
export const SLACK_USER_ID_REGEX = /^[UW][A-Z0-9]+$/;
export const TELEGRAM_BOT_TOKEN_REGEX = /^\d{6,12}:[A-Za-z0-9_-]{20,}$/;
export const TELEGRAM_CHAT_ID_REGEX = /^-?\d{5,20}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;
export const ZERODHA_API_KEY_REGEX = /^[A-Za-z0-9]{8,32}$/;
export const ACCESS_TOKEN_REGEX = /^[A-Za-z0-9._-]{16,512}$/;
export const LIGHTER_PRIVATE_KEY_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;
export const DISCORD_WEBHOOK_REGEX = /^https:\/\/(discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/;
export const WHATSAPP_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
export const NOTION_TOKEN_REGEX = /^(secret_[A-Za-z0-9]{20,}|ntn_[A-Za-z0-9_=-]{20,})$/;
export const NOTION_PAGE_ID_REGEX = /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
export const GOOGLE_SERVICE_ACCOUNT_EMAIL_REGEX = /^[A-Za-z0-9-]+@[A-Za-z0-9-]+\.iam\.gserviceaccount\.com$/;
export const GOOGLE_SHEET_URL_REGEX = /^https?:\/\/(?:docs\.google\.com\/spreadsheets\/d\/)[A-Za-z0-9-_]+(?:\/[^\s]*)?(?:\?[^\s]*)?$/i;
export const POSTGRES_CONNECTION_STRING_REGEX = /^(postgres|postgresql):\/\/.+/i;
export const SQL_IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_$.]*$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validateStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getActionValidationErrors(action: string, metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const hasSecret = Boolean(String(metadata.secretId || "").trim());

  const retryPolicy = metadata.retryPolicy as RetryPolicyMetadata | undefined;
  if (retryPolicy?.enabled) {
    const maxAttempts = Number(retryPolicy.maxAttempts);
    const delaySeconds = Number(retryPolicy.delaySeconds);
    const backoffType = String(retryPolicy.backoffType || "").trim().toLowerCase();
    const onFinalFailure = String(retryPolicy.onFinalFailure || "").trim().toLowerCase();

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      errors.push("Retry max attempts must be at least 1.");
    }

    if (!Number.isFinite(delaySeconds) || delaySeconds < 0) {
      errors.push("Retry delay must be 0 or greater.");
    }

    if (!["fixed", "exponential"].includes(backoffType)) {
      errors.push("Retry backoff must be fixed or exponential.");
    }

    if (![
      "fail-workflow",
      "continue",
    ].includes(onFinalFailure)) {
      errors.push("Retry final failure must be fail-workflow or continue.");
    }
  }

  if (action === "gmail" && !validateEmail(String(metadata.recipientEmail || "").trim())) {
    errors.push("Enter a valid recipient email.");
  }

  if (action === "discord" && !hasSecret && !DISCORD_WEBHOOK_REGEX.test(String(metadata.webhookUrl || "").trim())) {
    errors.push("Discord webhook URL format is invalid.");
  }

  if (action === "slack") {
    if (!hasSecret && !SLACK_BOT_TOKEN_REGEX.test(String(metadata.slackBotToken || "").trim())) {
      errors.push("Slack bot token must start with xoxb-.");
    }
    if (!hasSecret && !SLACK_USER_ID_REGEX.test(String(metadata.slackUserId || "").trim())) {
      errors.push("Slack user ID format is invalid.");
    }
  }

  if (action === "telegram") {
    if (!hasSecret && !TELEGRAM_BOT_TOKEN_REGEX.test(String(metadata.telegramBotToken || "").trim())) {
      errors.push("Telegram bot token format is invalid.");
    }
    if (!hasSecret && !TELEGRAM_CHAT_ID_REGEX.test(String(metadata.telegramChatId || "").trim())) {
      errors.push("Telegram chat ID format is invalid.");
    }
  }

  if (action === "whatsapp" && !hasSecret && !WHATSAPP_PHONE_REGEX.test(String(metadata.recipientPhone || "").trim())) {
    errors.push("WhatsApp number must be in +91XXXXXXXXX format.");
  }

  if (action === "notion-daily-report") {
    if (!hasSecret && !NOTION_TOKEN_REGEX.test(String(metadata.notionApiKey || "").trim())) {
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
    if (!hasSecret && !GOOGLE_SERVICE_ACCOUNT_EMAIL_REGEX.test(String(metadata.googleClientEmail || "").trim())) {
      errors.push("Google service account email format is invalid.");
    }
    if (!hasSecret && !String(metadata.googlePrivateKey || "").includes("BEGIN PRIVATE KEY")) {
      errors.push("Google private key format is invalid.");
    }
    if (metadata.aiConsent !== true) {
      errors.push("AI consent is required for Google Drive insights.");
    }
  }

  if (action === "google-sheets-report") {
    if (!GOOGLE_SHEET_URL_REGEX.test(String(metadata.sheetUrl || "").trim())) {
      errors.push("Enter a valid Google Sheet URL.");
    }
  }

  if (action === "postgres") {
    const connectionString = String(metadata.connectionString || "").trim();
    const tableName = String(metadata.tableName || "").trim();
    const jsonPayload = String(metadata.jsonPayload || "").trim();

    if (!POSTGRES_CONNECTION_STRING_REGEX.test(connectionString)) {
      errors.push("Connection string must start with postgres:// or postgresql://.");
    }

    if (!SQL_IDENTIFIER_REGEX.test(tableName)) {
      errors.push("Table name must be a valid SQL identifier (letters, numbers, _, $, .).");
    }

    if (jsonPayload) {
      try {
        const parsed = JSON.parse(jsonPayload);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          errors.push("JSON payload must be a valid JSON object.");
        }
      } catch {
        errors.push("JSON payload must be valid JSON.");
      }
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
  const hasSecret = Boolean(String(data.secretId || "").trim());

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
    if (!hasSecret && !ZERODHA_API_KEY_REGEX.test(String(data.apiKey || "").trim())) {
      errors.push("Zerodha API key must be 8-32 alphanumeric characters.");
    }
    const accessToken = String(data.accessToken || "").trim();
    if (!hasSecret && !accessToken) {
      errors.push("Zerodha access token is required.");
    } else if (!hasSecret && !ACCESS_TOKEN_REGEX.test(accessToken)) {
      errors.push("Zerodha access token format is invalid.");
    }
  }

  if (action === "groww") {
    if (!hasSecret && !ACCESS_TOKEN_REGEX.test(String(data.accessToken || "").trim())) {
      errors.push("Groww access token format is invalid.");
    }
  }

  if (action === "lighter") {
    if (!hasSecret && !LIGHTER_PRIVATE_KEY_REGEX.test(String(data.apiKey || "").trim())) {
      errors.push("Lighter API key must be a valid 64-char hex private key.");
    }
    const accountIndex = toNumber(data.accountIndex);
    const apiKeyIndex = toNumber(data.apiKeyIndex);
    if (!hasSecret && (!Number.isInteger(accountIndex) || accountIndex < 0)) {
      errors.push("Lighter account index must be a non-negative integer.");
    }
    if (!hasSecret && (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0)) {
      errors.push("Lighter API key index must be a non-negative integer.");
    }
  }

  return errors;
}

export function getPortfolioRiskValidationErrors(metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const broker = String(metadata.broker || "").trim().toLowerCase();
  const mode = String(metadata.mode || "").trim().toLowerCase();
  const thresholdUnit = String(metadata.thresholdUnit || "").trim().toLowerCase();
  const thresholdValue = Number(metadata.thresholdValue);
  const secretId = String(metadata.secretId || "").trim();

  if (!["zerodha", "groww", "lighter"].includes(broker)) {
    errors.push("Select a valid broker account.");
  }

  if (!["daily-loss-cap", "profit-target", "drawdown-limit"].includes(mode)) {
    errors.push("Select a valid portfolio risk mode.");
  }

  if (!["absolute", "percent"].includes(thresholdUnit)) {
    errors.push("Select a valid threshold type.");
  }

  if (!Number.isFinite(thresholdValue) || thresholdValue <= 0) {
    errors.push("Threshold value must be greater than 0.");
  }

  if (secretId) {
    return errors;
  }

  if (broker === "zerodha") {
    if (!ZERODHA_API_KEY_REGEX.test(String(metadata.apiKey || "").trim())) {
      errors.push("Enter a valid Zerodha API key.");
    }

    const accessToken = String(metadata.accessToken || "").trim();
    if (!accessToken) {
      errors.push("Enter a Zerodha access token.");
    } else if (!ACCESS_TOKEN_REGEX.test(accessToken)) {
      errors.push("Enter a valid Zerodha access token.");
    }
  }

  if (broker === "groww") {
    const accessToken = String(metadata.accessToken || "").trim();
    if (!ACCESS_TOKEN_REGEX.test(accessToken)) {
      errors.push("Enter a valid Groww access token.");
    }
  }

  if (broker === "lighter") {
    if (!LIGHTER_PRIVATE_KEY_REGEX.test(String(metadata.apiKey || "").trim())) {
      errors.push("Enter a valid Lighter private key.");
    }

    const accountIndex = Number(metadata.accountIndex);
    const apiKeyIndex = Number(metadata.apiKeyIndex);
    if (!Number.isInteger(accountIndex) || accountIndex < 0) {
      errors.push("Enter a valid Lighter account index.");
    }
    if (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0) {
      errors.push("Enter a valid Lighter API key index.");
    }
  }

  return errors;
}
