import { getActionValidationErrors, getTradingValidationErrors } from "@/lib/validation";
import type {
  AiStrategyBuilderResponse,
  AiStrategyDraftSession,
  ReusableSecretService,
  ReusableSecretSummary,
} from "@/types/api";
import type { AiMetadataOverrides } from "./types";

const NODE_TYPE_TO_REUSABLE_SECRET_SERVICE: Record<string, ReusableSecretService> = {
  zerodha: "zerodha",
  groww: "groww",
  lighter: "lighter",
  slack: "slack",
  discord: "discord",
  whatsapp: "whatsapp",
  "notion-daily-report": "notion-daily-report",
  "google-drive-daily-csv": "google-drive-daily-csv",
};

const REUSABLE_SECRET_SERVICE_FIELDS: Record<ReusableSecretService, string[]> = {
  zerodha: ["apiKey", "accessToken"],
  groww: ["accessToken"],
  lighter: ["apiKey", "accountIndex", "apiKeyIndex"],
  slack: ["slackBotToken", "slackUserId"],
  discord: ["webhookUrl"],
  whatsapp: ["recipientPhone"],
  "notion-daily-report": ["notionApiKey"],
  "google-drive-daily-csv": ["googleClientEmail", "googlePrivateKey"],
};

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
    case "filter":
      return "Filter";
    case "delay":
      return "Delay";
    case "merge":
      return "Merge";
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

  const mergedNodeMetadata = new Map<string, Record<string, unknown>>(
    response.plan.nodes.map((node) => [
      node.nodeId,
      {
        ...(node.data.metadata || {}),
        ...(metadataOverrides[node.nodeId] || {}),
      },
    ]),
  );

  for (const input of response.plan.missingInputs.filter((entry) => entry.required)) {
    const node = response.plan.nodes.find((entry) => entry.nodeId === input.nodeId);
    if (!node) continue;

    const nodeType = String(node.type).toLowerCase();
    const metadata = mergedNodeMetadata.get(input.nodeId) || {};
    const hasSecret = Boolean(String(metadata.secretId || "").trim());
    const secretBackedFields = getSecretBackedFieldsForNodeType(nodeType);
    if (hasSecret && secretBackedFields.includes(input.field)) {
      continue;
    }

    const value = metadata[input.field];
    const isPresent = input.field === "aiConsent"
      ? value === true
      : typeof value === "number"
        ? Number.isFinite(value)
        : String(value ?? "").trim().length > 0;

    if (!isPresent) {
      errors.push(`${getNodeLabel(nodeType)}: ${input.label || getFieldLabel(input.field)} is required.`);
    }
  }

  for (const node of response.plan.nodes) {
    if (String(node.data.kind).toLowerCase() !== "action") continue;

    const nodeType = String(node.type).toLowerCase();
    const mergedMetadata = mergedNodeMetadata.get(node.nodeId) || {};

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

export function getReusableSecretServiceForNodeType(nodeType: string): ReusableSecretService | null {
  return NODE_TYPE_TO_REUSABLE_SECRET_SERVICE[String(nodeType || "").toLowerCase()] || null;
}

export function getSecretBackedFieldsForNodeType(nodeType: string): string[] {
  const service = getReusableSecretServiceForNodeType(nodeType);
  if (!service) return [];
  return REUSABLE_SECRET_SERVICE_FIELDS[service] || [];
}

export function shouldHideInputWhenSecretSelected(
  nodeType: string,
  field: string,
  hasSecretId: boolean,
) {
  if (!hasSecretId) return false;
  return getSecretBackedFieldsForNodeType(nodeType).includes(field);
}

export function suggestReusableSecretId(
  secrets: ReusableSecretSummary[],
  missingInputs: Array<{ field: string; secret?: boolean }>,
): string | null {
  if (!secrets.length || !missingInputs.length) return null;

  const preferredFields = new Set(
    missingInputs
      .filter((input) => input.secret)
      .map((input) => input.field),
  );

  const fallbackFields = new Set(missingInputs.map((input) => input.field));
  const activeFields = preferredFields.size > 0 ? preferredFields : fallbackFields;

  let bestId: string | null = null;
  let bestScore = 0;

  for (const secret of secrets) {
    const score = secret.fieldKeys.reduce((count, key) => count + (activeFields.has(key) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestId = secret.id;
    }
  }

  return bestScore > 0 ? bestId : null;
}
