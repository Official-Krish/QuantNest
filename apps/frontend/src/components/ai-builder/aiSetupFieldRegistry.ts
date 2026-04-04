import type { ReusableSecretService } from "@/types/api";

const NUMERIC_FIELDS = new Set([
  "accountIndex",
  "apiKeyIndex",
  "targetPrice",
  "breakoutLevel",
  "retestTolerancePct",
  "confirmationMovePct",
  "retestWindowMinutes",
  "confirmationWindowMinutes",
  "durationSeconds",
]);

const PASSWORD_FIELDS = new Set(["slackBotToken", "telegramBotToken"]);

const SECRET_HELPER_TEXT_BY_SERVICE: Partial<Record<string, string>> = {
  slack: "Your Slack Bot token",
  discord: "Your Discord webhook credential",
  telegram: "Your Telegram bot credential",
  whatsapp: "Your WhatsApp API credential",
  gmail: "Your Gmail app credential",
  zerodha: "Your Zerodha broker credential",
  groww: "Your Groww broker credential",
  lighter: "Your Lighter broker credential",
  "notion-daily-report": "Your Notion integration credential",
  "google-drive-daily-csv": "Your Google Drive credential",
  "google-sheets-report": "Your Google Sheets credential",
};

export function getAiSetupFieldType(
  field: string,
  secret?: boolean,
): "text" | "password" | "number" {
  if (NUMERIC_FIELDS.has(field)) return "number";
  if (PASSWORD_FIELDS.has(field)) return "password";
  if (secret) return "password";
  return "text";
}

export function getSecretHelperText(
  service: ReusableSecretService | null | undefined,
): string | null {
  if (!service) return null;
  return SECRET_HELPER_TEXT_BY_SERVICE[service] || null;
}
