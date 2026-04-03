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

function getUserEditableMissingInputs(
  response: NonNullable<ReturnType<typeof getResponse>>,
  requiredOnly = false,
) {
  const nodeTypeById = new Map(
    response.plan.nodes.map((node) => [node.nodeId, String(node.type)]),
  );

  return response.plan.missingInputs.filter((input) => {
    if (requiredOnly && !input.required) return false;

    const nodeType = nodeTypeById.get(input.nodeId) || input.nodeType;
    const entry = getNodeRegistryEntry(nodeType);
    if (!entry) return true;

    const editableFields = new Set([
      ...entry.metadataFields,
      ...(entry.secretFieldKeys || []),
    ]);
    return editableFields.has(input.field);
  });
}

export function getRequiredMissingInputsCount(
  result: AiStrategyBuilderResponse | AiStrategyDraftSession | null,
) {
  const response = getResponse(result);
  if (!response) return 0;
  return getUserEditableMissingInputs(response, true).length;
}

export function getFieldLabel(field: string) {
  return NODE_METADATA_FIELD_LABELS[field] || field;
}

export function getNodeLabel(type: string) {
  return getNodeRegistryEntry(type)?.title || type;
}

export function isGoogleSheetsReportNodeType(nodeType: string) {
  return getNodeRegistryEntry(nodeType)?.id === "google-sheets-report";
}

export function getGoogleSheetsVerificationErrorDetails(error: unknown): {
  friendlyMessage: string;
  serviceAccountEmail?: string;
} {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string;
        serviceAccountEmail?: string;
      };
    };
    message?: string;
  };

  const rawMessage = String(
    maybeError?.response?.data?.message || maybeError?.message || "",
  ).trim();
  const serviceAccountEmail = String(
    maybeError?.response?.data?.serviceAccountEmail || "",
  ).trim();
  const lower = rawMessage.toLowerCase();

  if (lower.includes("invalid google sheet url") || lower.includes("invalid url")) {
    return {
      friendlyMessage: "Please paste a valid Google Sheet link.",
      serviceAccountEmail,
    };
  }

  if (
    lower.includes("add our service account") ||
    lower.includes("share settings") ||
    lower.includes("access denied") ||
    lower.includes("forbidden") ||
    lower.includes("403") ||
    lower.includes("404") ||
    lower.includes("caller does not have permission") ||
    lower.includes("insufficient permission") ||
    lower.includes("permission denied")
  ) {
    return {
      friendlyMessage: "Please add our service account email in Google Sheet Share settings (Editor access), then try again.",
      serviceAccountEmail,
    };
  }

  if (
    lower.includes("service account") ||
    lower.includes("misconfigured") ||
    lower.includes("bad_base64_decode") ||
    lower.includes("pem") ||
    lower.includes("decoder")
  ) {
    return {
      friendlyMessage: "Google Sheets setup is temporarily unavailable. Please try again in a few minutes.",
      serviceAccountEmail,
    };
  }

  return {
    friendlyMessage: "Could not verify this sheet right now. Please try again.",
    serviceAccountEmail,
  };
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

  for (const input of getUserEditableMissingInputs(response, true)) {
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
  if (!response) return {};

  return getUserEditableMissingInputs(response, false).reduce<Record<string, typeof response.plan.missingInputs>>((acc, input) => {
    acc[input.nodeId] = [...(acc[input.nodeId] || []), input];
    return acc;
  }, {});
}

export function propagateActionCredentialsToAllNodes(
  result: AiStrategyBuilderResponse | AiStrategyDraftSession | null,
  metadataOverrides: AiMetadataOverrides,
): AiMetadataOverrides {
  const response = getResponse(result);
  if (!response) return metadataOverrides;

  const nextOverrides = { ...metadataOverrides };
  const nodesByService = new Map<string, string[]>(); // service -> [nodeIds]

  // Group action nodes by their reusableSecretService
  for (const node of response.plan.nodes) {
    if (String(node.data.kind).toLowerCase() !== "action") continue;
    
    const nodeType = String(node.type).toLowerCase();
    const service = getReusableSecretServiceForNodeType(nodeType);
    
    // Only propagate for actions with a reusable secret service
    if (!service) continue;

    if (!nodesByService.has(service)) {
      nodesByService.set(service, []);
    }
    nodesByService.get(service)!.push(node.nodeId);
  }

  // For each service with multiple nodes, propagate credentials from first to all others
  for (const [_service, nodeIds] of nodesByService.entries()) {
    if (nodeIds.length <= 1) continue; // No need to propagate if only one node

    const firstNodeId = nodeIds[0];
    const firstNodeType = response.plan.nodes.find((n) => n.nodeId === firstNodeId)?.type;
    if (!firstNodeType) continue;

    const firstNodeOverrides = nextOverrides[firstNodeId] || {};
    
    // Get the fields that should be propagated (secret fields for this service)
    const secretFields = getSecretBackedFieldsForNodeType(String(firstNodeType));
    
    // Apply first node's credentials to all other nodes of the same service
    for (let i = 1; i < nodeIds.length; i++) {
      const targetNodeId = nodeIds[i];
      nextOverrides[targetNodeId] = {
        ...(nextOverrides[targetNodeId] || {}),
      };

      // Copy all secret fields from first node
      for (const field of secretFields) {
        if (Object.prototype.hasOwnProperty.call(firstNodeOverrides, field)) {
          nextOverrides[targetNodeId][field] = firstNodeOverrides[field];
        }
      }

      // Copy secret ID if present
      if (Object.prototype.hasOwnProperty.call(firstNodeOverrides, "secretId")) {
        nextOverrides[targetNodeId].secretId = firstNodeOverrides.secretId;
      }
    }
  }

  return nextOverrides;
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
