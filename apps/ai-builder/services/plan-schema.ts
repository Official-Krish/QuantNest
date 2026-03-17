import { z } from "zod";
import type {
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
  AiStrategyWorkflowPlan,
} from "@quantnest-trading/types/ai";
import { AiBuilderError } from "../errors";

const MAX_PLAN_NODES = 12;
const MAX_PLAN_EDGES = 16;

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

const PRICE_TRIGGER_ASSETS = ["CDSL", "HDFC", "TCS", "INFY", "RELIANCE", "ETH", "BTC", "SOL"];

function validateNodeMetadata(plan: AiStrategyWorkflowPlan) {
  for (const node of plan.nodes) {
    const metadata = (node.data.metadata || {}) as Record<string, unknown>;
    const type = node.type;

    if (type === "price") {
      const asset = String(metadata.asset || "").trim();
      const targetPrice = Number(metadata.targetPrice);
      const condition = String(metadata.condition || "").trim();
      const marketType = String(metadata.marketType || "").trim().toLowerCase();

      if (!asset) {
        throw new AiBuilderError("INVALID_GRAPH", `Price trigger ${node.nodeId} is missing asset.`, 422);
      }
      if (!PRICE_TRIGGER_ASSETS.includes(asset)) {
        throw new AiBuilderError("INVALID_GRAPH", `Price trigger ${node.nodeId} has unsupported asset: ${asset}.`, 422);
      }
      if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
        throw new AiBuilderError(
          "INVALID_GRAPH",
          `Price trigger ${node.nodeId} must include a targetPrice greater than 0.`,
          422,
        );
      }
      if (!["above", "below"].includes(condition)) {
        throw new AiBuilderError(
          "INVALID_GRAPH",
          `Price trigger ${node.nodeId} must use condition 'above' or 'below'.`,
          422,
        );
      }
      if (!["indian", "crypto", "web3"].includes(marketType)) {
        throw new AiBuilderError(
          "INVALID_GRAPH",
          `Price trigger ${node.nodeId} must include a valid marketType.`,
          422,
        );
      }
    }

    if (type === "timer") {
      const time = Number(metadata.time);
      if (!Number.isFinite(time) || time <= 0) {
        throw new AiBuilderError("INVALID_GRAPH", `Timer node ${node.nodeId} must include a time greater than 0.`, 422);
      }
    }

    if (type === "Zerodha") {
      const side = String(metadata.type || "").trim().toLowerCase();
      const qty = Number(metadata.qty);
      const symbol = String(metadata.symbol || "").trim();
      if (!["buy", "sell", "long", "short"].includes(side)) {
        throw new AiBuilderError("INVALID_GRAPH", `Zerodha node ${node.nodeId} must include a valid order type.`, 422);
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new AiBuilderError("INVALID_GRAPH", `Zerodha node ${node.nodeId} must include qty greater than 0.`, 422);
      }
      if (!symbol) {
        throw new AiBuilderError("INVALID_GRAPH", `Zerodha node ${node.nodeId} must include a symbol.`, 422);
      }
    }
  }
}

function validatePromptAlignedSemantics(
  plan: AiStrategyWorkflowPlan,
  request: AiStrategyBuilderRequest,
) {
  const prompt = request.prompt.toLowerCase();
  const priceNode = plan.nodes.find((node) => node.type === "price");

  const priceMatch = prompt.match(/price(?:\s+\w+){0,8}?\s+(below|above)\s+(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    if (!priceNode) {
      throw new AiBuilderError(
        "PROMPT_MISMATCH",
        "Prompt requested a price trigger, but the generated plan does not contain one.",
        422,
      );
    }

    const expectedCondition = priceMatch[1]?.toLowerCase();
    const expectedTarget = Number(priceMatch[2]);
    const metadata = (priceNode.data.metadata || {}) as Record<string, unknown>;
    const actualCondition = String(metadata.condition || "").toLowerCase();
    const actualTarget = Number(metadata.targetPrice);

    if (actualCondition !== expectedCondition) {
      throw new AiBuilderError(
        "PROMPT_MISMATCH",
        `Prompt requested a price trigger '${expectedCondition}', but the plan returned '${actualCondition || "missing"}'.`,
        422,
      );
    }

    if (!Number.isFinite(actualTarget) || actualTarget !== expectedTarget) {
      throw new AiBuilderError(
        "PROMPT_MISMATCH",
        `Prompt requested price trigger target ${expectedTarget}, but the plan returned ${Number.isFinite(actualTarget) ? actualTarget : "missing"}.`,
        422,
      );
    }
  }
}

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
  assumptions: z.array(z.string().trim().min(1)).max(10),
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

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutFenceStart.replace(/\s*```$/, "").trim();
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

  const triggerCount = plan.nodes.filter((node) => node.data.kind === "trigger").length;
  if (triggerCount === 0) {
    throw new AiBuilderError("INVALID_GRAPH", "Generated plan does not contain a trigger node.", 422);
  }

  if (triggerCount > 1) {
    throw new AiBuilderError("INVALID_GRAPH", "Generated plan must contain only one trigger in V1.", 422);
  }

  const nodeIds = new Set(plan.nodes.map((node) => node.nodeId));
  if (nodeIds.size !== plan.nodes.length) {
    throw new AiBuilderError("INVALID_GRAPH", "Generated plan contains duplicate node ids.", 422);
  }

  for (const edge of plan.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new AiBuilderError("INVALID_GRAPH", `Generated edge references missing nodes: ${edge.id}`, 422);
    }
    if (edge.source === edge.target) {
      throw new AiBuilderError("INVALID_GRAPH", `Generated edge forms a self-loop: ${edge.id}`, 422);
    }
  }

  if (request.allowedNodeTypes?.length) {
    const allowed = new Set(request.allowedNodeTypes.map((value) => value.toLowerCase()));
    for (const node of plan.nodes) {
      if (!allowed.has(node.type.toLowerCase())) {
        throw new AiBuilderError("UNSUPPORTED_NODE_TYPE", `Generated unsupported node type: ${node.type}`, 422);
      }
    }
  }

  validateNodeMetadata(plan);
  validatePromptAlignedSemantics(plan, request);

  return {
    provider,
    model,
    plan,
  };
}
