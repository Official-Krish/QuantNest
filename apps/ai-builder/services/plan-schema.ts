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

  return {
    provider,
    model,
    plan,
  };
}
