import type {
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyDraftEditRequest,
  AiStrategyValidationIssue,
  AiStrategyValidationReport,
  AiStrategyWorkflowPlan,
} from "@quantnest-trading/types/ai";
import {
  aiStrategyBuilderResponseSchema,
  aiStrategyDraftEditRequestSchema,
  aiStrategyWorkflowPlanSchema,
  strategyBuilderRequestSchema,
} from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";

const PRICE_TRIGGER_ASSETS = ["CDSL", "HDFC", "TCS", "INFY", "RELIANCE", "ETH", "BTC", "SOL"];
const TRIGGER_TYPES = new Set(["timer", "price", "conditional-trigger"]);
const EXECUTION_TYPES = new Set(["zerodha", "groww"]);

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutFenceStart.replace(/\s*```$/, "").trim();
}

function pushIssue(
  issues: AiStrategyValidationIssue[],
  severity: "error" | "warning",
  code: string,
  message: string,
  nodeId?: string,
  field?: string,
) {
  issues.push({ severity, code, message, nodeId, field });
}

function validateNodeMetadata(plan: AiStrategyWorkflowPlan, issues: AiStrategyValidationIssue[]) {
  for (const node of plan.nodes) {
    const metadata = (node.data.metadata || {}) as Record<string, unknown>;
    const normalizedType = String(node.type).toLowerCase();
    const normalizedKind = String(node.data.kind).toLowerCase();

    if (TRIGGER_TYPES.has(normalizedType) && normalizedKind !== "trigger") {
      pushIssue(issues, "error", "INVALID_NODE_KIND", `${node.type} must be a trigger node.`, node.nodeId);
    }

    if (!TRIGGER_TYPES.has(normalizedType) && normalizedKind !== "action") {
      pushIssue(issues, "error", "INVALID_NODE_KIND", `${node.type} must be an action node.`, node.nodeId);
    }

    if (normalizedType === "price") {
      const asset = String(metadata.asset || "").trim();
      const targetPrice = Number(metadata.targetPrice);
      const condition = String(metadata.condition || "").trim().toLowerCase();
      const marketType = String(metadata.marketType || "").trim().toLowerCase();

      if (!asset) {
        pushIssue(issues, "error", "INVALID_GRAPH", "Price trigger is missing asset.", node.nodeId, "asset");
      } else if (!PRICE_TRIGGER_ASSETS.includes(asset)) {
        pushIssue(
          issues,
          "warning",
          "UNSUPPORTED_ASSET",
          `Price trigger uses an asset outside the validated set: ${asset}.`,
          node.nodeId,
          "asset",
        );
      }

      if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Price trigger must include a targetPrice greater than 0.",
          node.nodeId,
          "targetPrice",
        );
      }

      if (!["above", "below"].includes(condition)) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Price trigger must use condition 'above' or 'below'.",
          node.nodeId,
          "condition",
        );
      }

      if (!["indian", "crypto", "web3"].includes(marketType)) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Price trigger must include a valid marketType.",
          node.nodeId,
          "marketType",
        );
      }
    }

    if (normalizedType === "timer") {
      const time = Number(metadata.time);
      if (!Number.isFinite(time) || time <= 0) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Timer node must include a time greater than 0.",
          node.nodeId,
          "time",
        );
      }
    }

    if (normalizedType === "zerodha") {
      const side = String(metadata.type || "").trim().toLowerCase();
      const qty = Number(metadata.qty);
      const symbol = String(metadata.symbol || "").trim();

      if (!["buy", "sell", "long", "short"].includes(side)) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Zerodha node must include a valid order type.",
          node.nodeId,
          "type",
        );
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Zerodha node must include qty greater than 0.",
          node.nodeId,
          "qty",
        );
      }
      if (!symbol) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Zerodha node must include a symbol.",
          node.nodeId,
          "symbol",
        );
      }
    }
  }
}

function validatePromptAlignedSemantics(
  plan: AiStrategyWorkflowPlan,
  request: AiStrategyBuilderRequest,
  issues: AiStrategyValidationIssue[],
) {
  const prompt = request.prompt.toLowerCase();
  const priceNode = plan.nodes.find((node) => String(node.type).toLowerCase() === "price");
  const priceMatch = prompt.match(/price(?:\s+\w+){0,8}?\s+(below|above)\s+(\d+(?:\.\d+)?)/i);

  if (priceMatch) {
    if (!priceNode) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        "Prompt requested a price trigger, but the generated plan does not contain one.",
      );
      return;
    }

    const expectedCondition = priceMatch[1]?.toLowerCase();
    const expectedTarget = Number(priceMatch[2]);
    const metadata = (priceNode.data.metadata || {}) as Record<string, unknown>;
    const actualCondition = String(metadata.condition || "").toLowerCase();
    const actualTarget = Number(metadata.targetPrice);

    if (actualCondition !== expectedCondition) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        `Prompt requested a price trigger '${expectedCondition}', but the plan returned '${actualCondition || "missing"}'.`,
        priceNode.nodeId,
        "condition",
      );
    }

    if (!Number.isFinite(actualTarget) || actualTarget !== expectedTarget) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        `Prompt requested price trigger target ${expectedTarget}, but the plan returned ${Number.isFinite(actualTarget) ? actualTarget : "missing"}.`,
        priceNode.nodeId,
        "targetPrice",
      );
    }
  }
}

function buildValidationReport(
  plan: AiStrategyWorkflowPlan,
  request: AiStrategyBuilderRequest,
): AiStrategyValidationReport {
  const issues: AiStrategyValidationIssue[] = [];
  const nodeIds = new Set(plan.nodes.map((node) => node.nodeId));
  const triggerNodes = plan.nodes.filter((node) => String(node.data.kind).toLowerCase() === "trigger");
  const actionNodes = plan.nodes.filter((node) => String(node.data.kind).toLowerCase() === "action");
  const outgoing = new Map<string, typeof plan.edges>();
  const incomingCount = new Map<string, number>();

  for (const node of plan.nodes) {
    outgoing.set(node.nodeId, []);
    incomingCount.set(node.nodeId, 0);
  }

  if (triggerNodes.length === 0) {
    pushIssue(issues, "error", "INVALID_GRAPH", "Generated plan does not contain a trigger node.");
  }

  if (nodeIds.size !== plan.nodes.length) {
    pushIssue(issues, "error", "INVALID_GRAPH", "Generated plan contains duplicate node ids.");
  }

  for (const edge of plan.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      pushIssue(issues, "error", "INVALID_GRAPH", `Generated edge references missing nodes: ${edge.id}`);
      continue;
    }

    if (edge.source === edge.target) {
      pushIssue(issues, "error", "INVALID_GRAPH", `Generated edge forms a self-loop: ${edge.id}`);
    }

    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge]);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
  }

  if (request.allowedNodeTypes?.length) {
    const allowed = new Set(request.allowedNodeTypes.map((value) => String(value).toLowerCase()));
    for (const node of plan.nodes) {
      if (!allowed.has(String(node.type).toLowerCase())) {
        pushIssue(
          issues,
          "error",
          "UNSUPPORTED_NODE_TYPE",
          `Generated unsupported node type: ${node.type}`,
          node.nodeId,
        );
      }
    }
  }

  for (const node of triggerNodes) {
    const edges = outgoing.get(node.nodeId) || [];
    if (edges.length === 0) {
      pushIssue(
        issues,
        "warning",
        "UNCONNECTED_TRIGGER",
        "Trigger does not connect to any downstream node.",
        node.nodeId,
      );
    }

    if (String(node.type).toLowerCase() === "conditional-trigger") {
      const handles = new Set(edges.map((edge) => edge.sourceHandle).filter(Boolean));
      if (!handles.has("true") || !handles.has("false")) {
        pushIssue(
          issues,
          "warning",
          "INCOMPLETE_BRANCHING",
          "Conditional trigger should usually define both true and false branches.",
          node.nodeId,
        );
      }
    }
  }

  for (const node of actionNodes) {
    if ((incomingCount.get(node.nodeId) || 0) === 0) {
      pushIssue(
        issues,
        "warning",
        "UNREACHABLE_ACTION",
        "Action node is not connected from any upstream step.",
        node.nodeId,
      );
    }
  }

  const executionNodes = plan.nodes.filter((node) => EXECUTION_TYPES.has(String(node.type).toLowerCase()));
  if (executionNodes.length > 0 && request.allowDirectExecution !== true) {
    pushIssue(
      issues,
      "warning",
      "EXECUTION_REQUIRES_CONFIRMATION",
      "Plan contains broker execution nodes while direct execution is not enabled.",
    );
  }

  if (request.goal === "alerts" && executionNodes.length > 0) {
    pushIssue(
      issues,
      "warning",
      "GOAL_MISMATCH",
      "Prompt goal is alerts, but the plan includes broker execution nodes.",
    );
  }

  validateNodeMetadata(plan, issues);
  validatePromptAlignedSemantics(plan, request, issues);

  const branchCount = plan.edges.filter((edge) => edge.sourceHandle === "true" || edge.sourceHandle === "false").length;

  return {
    canOpenInBuilder: !issues.some((issue) => issue.severity === "error"),
    triggerCount: triggerNodes.length,
    branchCount,
    missingInputsCount: plan.missingInputs.filter((input) => input.required).length,
    issues,
  };
}

function assertNoValidationErrors(validation: AiStrategyValidationReport) {
  const blockingIssues = validation.issues.filter((issue) => issue.severity === "error");
  if (!blockingIssues.length) {
    return;
  }

  throw new AiBuilderError(
    "INVALID_GRAPH",
    blockingIssues.map((issue) => issue.message).join(" "),
    422,
    validation,
  );
}

export function parseStrategyBuilderRequest(input: unknown): AiStrategyBuilderRequest {
  return strategyBuilderRequestSchema.parse(input);
}

export function parseStrategyDraftEditRequest(input: unknown): AiStrategyDraftEditRequest {
  return aiStrategyDraftEditRequestSchema.parse(input);
}

export function normalizeStrategyPlanResponse(
  rawText: string,
  provider: string,
  model: string,
  request: AiStrategyBuilderRequest,
): AiStrategyBuilderResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonBlock(rawText));
  } catch (error) {
    throw new AiBuilderError(
      "INVALID_PROVIDER_JSON",
      "AI provider returned invalid JSON for strategy plan.",
      502,
      error instanceof Error ? error.message : undefined,
    );
  }

  const plan = aiStrategyWorkflowPlanSchema.parse(parsed);
  const validation = buildValidationReport(plan, request);

  assertNoValidationErrors(validation);

  return aiStrategyBuilderResponseSchema.parse({
    provider,
    model,
    plan,
    validation,
  });
}

export function validateExistingStrategyPlan(
  plan: AiStrategyWorkflowPlan,
  request: AiStrategyBuilderRequest,
): AiStrategyValidationReport {
  return buildValidationReport(plan, request);
}
