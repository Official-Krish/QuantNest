import type {
  AiDebugQueryRequest,
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

export function buildStrategyPlannerPrompt(
  input: AiStrategyBuilderRequest,
): string {
  const allowedNodeTypes = (
    input.allowedNodeTypes?.length
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

export function buildDebugPrompt(input: AiDebugQueryRequest): string {
  const indicatorLines =
    input.indicatorSnapshot.length > 0
      ? input.indicatorSnapshot
          .map(
            (i) =>
              `  - ${i.symbol} ${i.indicator}(${i.period || ""}) ${i.timeframe}: ${i.value ?? "N/A"}`,
          )
          .join("\n")
      : "  - No indicator snapshots recorded";

  const branchLines =
    input.branchDecisions.length > 0
      ? input.branchDecisions
          .map(
            (b) =>
              `  - Node "${b.nodeType}" evaluated condition=${b.evaluatedCondition}, took branch="${b.selectedBranch || "none"}"`,
          )
          .join("\n")
      : "  - No branch decisions";

  const stepLines =
    input.nodeSteps.length > 0
      ? input.nodeSteps
          .map((s) => `  - ${s.nodeType}: ${s.status} — ${s.message}`)
          .join("\n")
      : "  - No steps recorded";

  return [
    `You are a trading strategy debugger. Given the following workflow execution trace,`,
    `answer the user's question in plain English. Be precise, reference specific values,`,
    `and explain why each outcome occurred.`,
    ``,
    `Workflow: ${input.workflowName}`,
    `Trigger type: ${input.triggerType}`,
    `Execution status: ${input.executionStatus}`,
    ``,
    `## Trigger Evaluation`,
    `\`\`\`json`,
    `${JSON.stringify(input.triggerSnapshot, null, 2)}`,
    `\`\`\``,
    ``,
    `## Branch Decisions`,
    branchLines,
    ``,
    `## Node Execution Steps`,
    stepLines,
    ``,
    `## Indicator Values at Execution Time`,
    indicatorLines,
    ``,
    `User's question: ${input.question}`,
    ``,
    `Respond in JSON with this exact shape:`,
    `{`,
    `  "answer": "concise direct answer to the user's question",`,
    `  "reasoning": "step-by-step reasoning referencing specific indicator values and trigger parameters",`,
    `  "confidence": "Low" | "Medium" | "High",`,
    `  "supportingIndicators": ["indicator1", "indicator2"],`,
    `  "relevantNodes": ["nodeType1", "nodeType2"]`,
    `}`,
  ].join("\n");
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
