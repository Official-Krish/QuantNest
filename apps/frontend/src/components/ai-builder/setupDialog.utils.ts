import { getActionValidationErrors, getTradingValidationErrors } from "@/lib/validation";
import type { AiStrategyBuilderResponse } from "@/types/api";
import type { AiMetadataOverrides } from "./types";

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
    case "gmail":
      return "Gmail";
    case "discord":
      return "Discord";
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
  if (secret) return "password";
  return "text";
}

export function collectSetupErrors(
  result: AiStrategyBuilderResponse | null,
  workflowName: string,
  metadataOverrides: AiMetadataOverrides,
) {
  const errors: string[] = [];

  if (!workflowName.trim()) {
    errors.push("Workflow name is required.");
  }

  if (!result) return errors;

  for (const node of result.plan.nodes) {
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

export function groupMissingInputs(result: AiStrategyBuilderResponse | null) {
  return (
    result?.plan.missingInputs.reduce<Record<string, typeof result.plan.missingInputs>>((acc, input) => {
      acc[input.nodeId] = [...(acc[input.nodeId] || []), input];
      return acc;
    }, {}) || {}
  );
}
