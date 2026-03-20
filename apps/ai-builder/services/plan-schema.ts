import { z } from "zod";
import type {
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyValidationIssue,
  AiStrategyValidationReport,
  AiStrategyWorkflowPlan,
} from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";

const MAX_PLAN_NODES = 16;
const MAX_PLAN_EDGES = 24;

const nodeKindSchema = z.enum([
  "timer",
  "price",
  "conditional-trigger",
  "Zerodha",
  "Groww",
  "gmail",
  "discord",
  "whatsapp",
  "notion-daily-report",
  "google-drive-daily-csv",
]);

const allowedNodeTypeSchema = z.union([
  nodeKindSchema,
  z.enum(["zerodha", "groww"]),
]);

export const strategyBuilderRequestSchema = z.object({
  prompt: z.string().trim().min(12, "Prompt must be at least 12 characters."),
  market: z.enum(["Indian", "Crypto"]),
  goal: z.enum(["alerts", "execution", "reporting", "journaling"]),
  riskPreference: z.enum(["conservative", "balanced", "aggressive"]).optional(),
  brokerExecution: z.boolean().optional(),
  allowDirectExecution: z.boolean().optional(),
  preferredActions: z
    .array(
      z.enum([
        "zerodha",
        "groww",
        "lighter",
        "gmail",
        "discord",
        "whatsapp",
        "notion-daily-report",
        "google-drive-daily-csv",
      ]),
    )
    .optional(),
  constraints: z.array(z.string().trim().min(1)).optional(),
  model: z
    .object({
      provider: z.string().trim().min(1).optional(),
      model: z.string().trim().min(1).optional(),
    })
    .optional(),
  allowedNodeTypes: z.array(allowedNodeTypeSchema).optional(),
}) satisfies z.ZodType<AiStrategyBuilderRequest>;

const workflowDraftNodeSchema = z.object({
  nodeId: z.string().trim().min(1),
  type: nodeKindSchema,
  data: z.object({
    kind: z.enum(["trigger", "action"]),
    metadata: z.record(z.string(), z.unknown()),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const workflowDraftEdgeSchema = z.object({
  id: z.string().trim().min(1),
  source: z.string().trim().min(1),
  target: z.string().trim().min(1),
  sourceHandle: z.string().trim().min(1).optional(),
  targetHandle: z.string().trim().min(1).optional(),
});

const strategyPlanSchema = z.object({
  workflowName: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(12).max(500),
  marketType: z.enum(["Indian", "Crypto"]),
  nodes: z.array(workflowDraftNodeSchema).min(1).max(MAX_PLAN_NODES),
  edges: z.array(workflowDraftEdgeSchema).max(MAX_PLAN_EDGES),
  assumptions: z.array(z.string().trim().min(1)).max(12),
  warnings: z.array(
    z.object({
      code: z.string().trim().min(1),
      message: z.string().trim().min(1),
    }),
  ),
  missingInputs: z.array(
    z.object({
      nodeId: z.string().trim().min(1),
      nodeType: z.string().trim().min(1),
      field: z.string().trim().min(1),
      label: z.string().trim().min(1),
      reason: z.string().trim().min(1),
      required: z.boolean(),
      secret: z.boolean().optional(),
    }),
  ),
}) satisfies z.ZodType<AiStrategyWorkflowPlan>;

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

  const plan = strategyPlanSchema.parse(parsed);
  const validation = buildValidationReport(plan, request);

  assertNoValidationErrors(validation);

  return {
    provider,
    model,
    plan,
    validation,
  };
}

export function validateExistingStrategyPlan(
  plan: AiStrategyWorkflowPlan,
  request: AiStrategyBuilderRequest,
): AiStrategyValidationReport {
  return buildValidationReport(plan, request);
}
