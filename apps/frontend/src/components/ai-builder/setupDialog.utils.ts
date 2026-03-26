import { getActionValidationErrors, getTradingValidationErrors } from "@/lib/validation";
import type { AiStrategyBuilderResponse, AiStrategyDraftSession } from "@/types/api";
import type { AiMetadataOverrides } from "./types";

function getResponse(result: AiStrategyBuilderResponse | AiStrategyDraftSession | null) {
  if (!result) return null;
  return "response" in result ? result.response : result;
}

export function getFieldLabel(field: string) {
  switch (field) {
    case "apiKey":
      return "API key";
    case "accessToken":
      return "Access token";
    case "recipientEmail":
      return "Recipient email";
    case "recipientPhone":
      return "Recipient phone";
    case "slackBotToken":
      return "Slack bot token";
    case "slackUserId":
      return "Slack user ID";
    case "webhookUrl":
      return "Webhook URL";
    case "notionApiKey":
      return "Notion API key";
    case "parentPageId":
      return "Parent page ID";
    case "googleClientEmail":
      return "Google service account email";
    case "googlePrivateKey":
      return "Google private key";
    case "googleDriveFolderId":
      return "Google Drive folder ID";
    case "accountIndex":
      return "Account index";
    case "apiKeyIndex":
      return "API key index";
    case "durationSeconds":
      return "Delay duration (seconds)";
    case "aiConsent":
      return "AI consent";
    default:
      return field;
  }
}

export function getNodeLabel(type: string) {
  switch (type.toLowerCase()) {
    case "zerodha":
      return "Zerodha";
    case "groww":
      return "Groww";
    case "lighter":
      return "Lighter";
    case "if":
      return "If";
    case "delay":
      return "Delay";
    case "gmail":
      return "Gmail";
    case "discord":
      return "Discord";
    case "slack":
      return "Slack";
    case "whatsapp":
      return "WhatsApp";
    case "notion-daily-report":
      return "Notion";
    case "google-drive-daily-csv":
      return "Google Drive";
    default:
      return type;
  }
}

export function getFieldType(field: string, secret?: boolean): "text" | "password" | "number" {
  if (field === "accountIndex" || field === "apiKeyIndex") return "number";
  if (field === "slackBotToken") return "password";
  if (secret) return "password";
  return "text";
}

export function collectSetupErrors(
  result: AiStrategyBuilderResponse | AiStrategyDraftSession | null,
  workflowName: string,
  metadataOverrides: AiMetadataOverrides,
) {
  const errors: string[] = [];

  if (!workflowName.trim()) {
    errors.push("Workflow name is required.");
  }

  const response = getResponse(result);
  if (!response) return errors;

  for (const node of response.plan.nodes) {
    if (String(node.data.kind).toLowerCase() !== "action") continue;

    const nodeType = String(node.type).toLowerCase();
    const mergedMetadata = {
      ...(node.data.metadata || {}),
      ...(metadataOverrides[node.nodeId] || {}),
    };

    if (["zerodha", "groww", "lighter"].includes(nodeType)) {
      errors.push(...getTradingValidationErrors(nodeType as any, mergedMetadata as any));
    } else {
      errors.push(...getActionValidationErrors(nodeType, mergedMetadata));
    }
  }

  return [...new Set(errors)];
}

export function groupMissingInputs(
  result: AiStrategyBuilderResponse | AiStrategyDraftSession | null,
) {
  const response = getResponse(result);
  return (
    response?.plan.missingInputs.reduce<Record<string, typeof response.plan.missingInputs>>((acc, input) => {
      acc[input.nodeId] = [...(acc[input.nodeId] || []), input];
      return acc;
    }, {}) || {}
  );
}
