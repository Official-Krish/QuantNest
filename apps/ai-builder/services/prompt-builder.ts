import type {
  AiStrategyBuilderRequest,
  AiStrategyWorkflowPlan,
} from "@quantnest-trading/types/ai";
import {
  getActionMetadataReference,
  getAiPromptNodeTypes,
  getTriggerMetadataReference,
} from "@quantnest-trading/node-registry";
import { buildPlannerPromptSections } from "./promptSections";

const DEFAULT_ALLOWED_NODE_TYPES = getAiPromptNodeTypes();

const ACTION_METADATA_REFERENCE = getActionMetadataReference();

const TRIGGER_METADATA_REFERENCE = getTriggerMetadataReference();

export function buildStrategyPlannerPrompt(input: AiStrategyBuilderRequest): string {
  const allowedNodeTypes = (input.allowedNodeTypes?.length
    ? input.allowedNodeTypes
    : DEFAULT_ALLOWED_NODE_TYPES
  ).join(", ");

  const preferredActions = input.preferredActions?.length
    ? input.preferredActions.join(", ")
    : "none";

  const constraints = input.constraints?.length
    ? input.constraints.map((item) => `- ${item}`).join("\n")
    : "- none";

  const actionMetadataGuide = Object.entries(ACTION_METADATA_REFERENCE)
    .map(([action, fields]) => `- ${action}: ${fields.join(", ")}`)
    .join("\n");
  const triggerMetadataGuide = Object.entries(TRIGGER_METADATA_REFERENCE)
    .map(([trigger, fields]) => `- ${trigger}: ${fields.join(", ")}`)
    .join("\n");

  return buildPlannerPromptSections({
    input,
    allowedNodeTypes,
    preferredActions,
    constraints,
    actionMetadataGuide,
    triggerMetadataGuide,
  }).join("\n");
}

export function buildStrategyEditPrompt(
  request: AiStrategyBuilderRequest,
  currentPlan: AiStrategyWorkflowPlan,
  instruction: string,
): string {
  return [
    buildStrategyPlannerPrompt(request),
    "",
    "Editing mode:",
    "- You are updating an existing workflow draft.",
    "- Apply the user's latest instruction while preserving valid parts of the current workflow.",
    "- Return the full updated workflow JSON, not a diff.",
    "- Keep nodeIds stable when a node still represents the same step.",
    "- Remove obsolete nodes and edges when the new instruction replaces them.",
    "",
    "Current workflow JSON:",
    JSON.stringify(currentPlan, null, 2),
    "",
    "Latest edit instruction:",
    instruction.trim(),
  ].join("\n");
}
