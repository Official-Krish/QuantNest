import { getActionValidationErrors, getTradingValidationErrors } from "@/lib/validation";
import type {
  AiStrategyBuilderResponse,
  AiStrategyDraftSession,
  ReusableSecretService,
  ReusableSecretSummary,
} from "@/types/api";
import {
  getNodeRegistryEntry,
  NODE_METADATA_FIELD_LABELS,
} from "@quantnest-trading/node-registry";
import type { AiMetadataOverrides } from "./types";

function getResponse(result: AiStrategyBuilderResponse | AiStrategyDraftSession | null) {
  if (!result) return null;
  return "response" in result ? result.response : result;
}

export function getFieldLabel(field: string) {
  return NODE_METADATA_FIELD_LABELS[field] || field;
}

export function getNodeLabel(type: string) {
  return getNodeRegistryEntry(type)?.title || type;
}

export function getFieldType(field: string, secret?: boolean): "text" | "password" | "number" {
  if (field === "accountIndex" || field === "apiKeyIndex") return "number";
  if (field === "slackBotToken" || field === "telegramBotToken") return "password";
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
  return (getNodeRegistryEntry(nodeType)?.reusableSecretService as ReusableSecretService | undefined) || null;
}

export function getSecretBackedFieldsForNodeType(nodeType: string): string[] {
  return getNodeRegistryEntry(nodeType)?.secretFieldKeys || [];
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
