import type { LighterMetadata, TradingMetadata } from "@quantnest-trading/types";
import { getActionValidationErrors, getTradingValidationErrors } from "@/lib/validation";

function hasValue(value: unknown) {
  return Boolean(String(value || "").trim());
}

function hasSecret(metadata: Record<string, unknown>) {
  return hasValue(metadata.secretId);
}

function hasRecipientName(metadata: Record<string, unknown>) {
  return hasValue(metadata.recipientName);
}

export function getBuilderActionValidationState(
  selectedAction: string,
  metadata: TradingMetadata | LighterMetadata | Record<string, unknown> | {},
) {
  const actionMetadata = metadata as Record<string, unknown>;
  const tradingValidationErrors =
    selectedAction === "zerodha" || selectedAction === "groww" || selectedAction === "lighter"
      ? getTradingValidationErrors(
          selectedAction as "zerodha" | "groww" | "lighter",
          metadata as TradingMetadata | LighterMetadata,
        )
      : [];

  const actionValidationErrors = getActionValidationErrors(selectedAction, actionMetadata);
  const secretSelected = hasSecret(actionMetadata);
  const recipientNamePresent = hasRecipientName(actionMetadata);

  const canCreateAction =
    !!selectedAction &&
    tradingValidationErrors.length === 0 &&
    actionValidationErrors.length === 0 &&
    (selectedAction !== "delay" || Number(actionMetadata.durationSeconds) > 0) &&
    (selectedAction !== "gmail" || (recipientNamePresent && hasValue(actionMetadata.recipientEmail))) &&
    (
      selectedAction !== "slack" ||
      (recipientNamePresent &&
        (secretSelected || (hasValue(actionMetadata.slackBotToken) && hasValue(actionMetadata.slackUserId))))
    ) &&
    (
      selectedAction !== "telegram" ||
      (recipientNamePresent &&
        (secretSelected ||
          (hasValue(actionMetadata.telegramBotToken) && hasValue(actionMetadata.telegramChatId))))
    ) &&
    (
      selectedAction !== "discord" ||
      (recipientNamePresent && (secretSelected || hasValue(actionMetadata.webhookUrl)))
    ) &&
    (
      selectedAction !== "whatsapp" ||
      (recipientNamePresent && (secretSelected || hasValue(actionMetadata.recipientPhone)))
    ) &&
    (
      selectedAction !== "notion-daily-report" ||
      ((secretSelected || hasValue(actionMetadata.notionApiKey)) && Boolean(actionMetadata.aiConsent))
    ) &&
    (
      selectedAction !== "google-drive-daily-csv" ||
      (
        (secretSelected ||
          (hasValue(actionMetadata.googleClientEmail) && hasValue(actionMetadata.googlePrivateKey))) &&
        Boolean(actionMetadata.aiConsent)
      )
    ) &&
    (selectedAction !== "google-sheets-report" || hasValue(actionMetadata.sheetUrl)) &&
    (
      selectedAction !== "filter" ||
      Boolean(actionMetadata.expression) ||
      (
        hasValue(actionMetadata.asset) &&
        ["above", "below"].includes(String(actionMetadata.condition || "")) &&
        Number(actionMetadata.targetPrice) > 0
      )
    );

  return {
    tradingValidationErrors,
    actionValidationErrors,
    canCreateAction,
  };
}
