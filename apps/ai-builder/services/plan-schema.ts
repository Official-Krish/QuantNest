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
const TRIGGER_TYPES = new Set(["timer", "price", "conditional-trigger", "market-session"]);
const EXECUTION_TYPES = new Set(["zerodha", "groww"]);

function canonicalizeComparator(operator: string): string {
  const normalized = String(operator || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  if (["crosses_below", "cross_below", "crossed_below", "crossbelow", "crossesbelow"].includes(normalized)) {
    return "crosses_below";
  }

  if (["crosses_above", "cross_above", "crossed_above", "crossabove", "crossesabove"].includes(normalized)) {
    return "crosses_above";
  }

  return normalized;
}

function getAllClauses(expression: unknown): Array<Record<string, unknown>> {
  const expr = expression as { conditions?: unknown[] } | undefined;
  const conditions = Array.isArray(expr?.conditions) ? expr.conditions : [];
  const clauses: Array<Record<string, unknown>> = [];

  for (const entry of conditions) {
    const node = entry as { type?: string; conditions?: unknown[] };
    if (node?.type === "clause") {
      clauses.push(node as Record<string, unknown>);
      continue;
    }

    if (node?.type === "group" && Array.isArray(node.conditions)) {
      for (const nested of node.conditions) {
        const clause = nested as { type?: string };
        if (clause?.type === "clause") {
          clauses.push(clause as Record<string, unknown>);
        }
      }
    }
  }

  return clauses;
}

function normalizeCrossoverOperatorsInPlan(plan: AiStrategyWorkflowPlan, prompt: string): void {
  const wantsCrossover = /(cross(?:es|ed)?[_\s-]?(above|below)|crossover)/i.test(prompt);
  const wantsBelow = /cross(?:es|ed)?[_\s-]?below|crossover[^\n]*below/i.test(prompt);
  const wantsAbove = /cross(?:es|ed)?[_\s-]?above|crossover[^\n]*above/i.test(prompt);

  for (const node of plan.nodes) {
    if (String(node.type).toLowerCase() !== "conditional-trigger") continue;

    const metadata = (node.data.metadata || {}) as Record<string, unknown>;
    const clauses = getAllClauses(metadata.expression);

    for (const clause of clauses) {
      const currentOperator = canonicalizeComparator(String(clause.operator || ""));
      const left = clause.left as { type?: string } | undefined;
      const right = clause.right as { type?: string } | undefined;
      const isIndicatorVsIndicator = left?.type === "indicator" && right?.type === "indicator";

      if (currentOperator === "crosses_above" || currentOperator === "crosses_below") {
        clause.operator = currentOperator;
        continue;
      }

      if (!wantsCrossover || !isIndicatorVsIndicator) {
        clause.operator = currentOperator || clause.operator;
        continue;
      }

      if ((currentOperator === "<" || currentOperator === "<=") && wantsBelow) {
        clause.operator = "crosses_below";
        continue;
      }

      if ((currentOperator === ">" || currentOperator === ">=") && wantsAbove) {
        clause.operator = "crosses_above";
        continue;
      }

      clause.operator = currentOperator || clause.operator;
    }
  }
}

function extractClauses(expression: unknown): Array<{ operator?: string }> {
  const expr = expression as { conditions?: unknown[] } | undefined;
  const conditions = Array.isArray(expr?.conditions) ? expr.conditions : [];
  const clauses: Array<{ operator?: string }> = [];

  for (const entry of conditions) {
    const node = entry as { type?: string; operator?: string; conditions?: unknown[] };
    if (node?.type === "clause") {
      clauses.push(node);
      continue;
    }

    if (node?.type === "group" && Array.isArray(node.conditions)) {
      for (const nested of node.conditions) {
        const clause = nested as { type?: string; operator?: string };
        if (clause?.type === "clause") {
          clauses.push(clause);
        }
      }
    }
  }

  return clauses;
}

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
      const marketType = String(metadata.marketType || "").trim().toLowerCase();
      const mode = String(metadata.mode || "threshold").trim().toLowerCase();

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

      if (mode === "change") {
        const changeDirection = String(metadata.changeDirection || "").trim().toLowerCase();
        const changeType = String(metadata.changeType || "").trim().toLowerCase();
        const changeValue = Number(metadata.changeValue);
        const changeWindowMinutes = Number(metadata.changeWindowMinutes);

        if (!["increase", "decrease"].includes(changeDirection)) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Price change trigger must use changeDirection 'increase' or 'decrease'.",
            node.nodeId,
            "changeDirection",
          );
        }

        if (!["absolute", "percent"].includes(changeType)) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Price change trigger must use changeType 'absolute' or 'percent'.",
            node.nodeId,
            "changeType",
          );
        }

        if (!Number.isFinite(changeValue) || changeValue <= 0) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Price change trigger must include changeValue greater than 0.",
            node.nodeId,
            "changeValue",
          );
        }

        if (!Number.isFinite(changeWindowMinutes) || changeWindowMinutes <= 0) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Price change trigger must include changeWindowMinutes greater than 0.",
            node.nodeId,
            "changeWindowMinutes",
          );
        }
      } else {
        const targetPrice = Number(metadata.targetPrice);
        const condition = String(metadata.condition || "").trim().toLowerCase();

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

    if (normalizedType === "conditional-trigger") {
      const clauses = extractClauses((metadata as Record<string, unknown>).expression);
      if (!clauses.length) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Conditional trigger must include a non-empty expression with at least one clause.",
          node.nodeId,
          "expression",
        );
      }
    }

    if (normalizedType === "delay") {
      const durationSeconds = Number(metadata.durationSeconds);
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Delay node must include durationSeconds greater than 0.",
          node.nodeId,
          "durationSeconds",
        );
      }
    }

    if (normalizedType === "merge") {
      // Merge is a flow-control node with no required metadata.
    }

    if (normalizedType === "if" || normalizedType === "filter") {
      const hasExpression = Boolean((metadata as Record<string, unknown>).expression);
      const asset = String(metadata.asset || "").trim();
      const condition = String(metadata.condition || "").trim().toLowerCase();
      const targetPrice = Number(metadata.targetPrice);

      if (!hasExpression) {
        if (!asset) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            `${normalizedType === "filter" ? "Filter" : "If"} node must include an asset or expression.`,
            node.nodeId,
            "asset",
          );
        }

        if (!["above", "below"].includes(condition)) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            `${normalizedType === "filter" ? "Filter" : "If"} node must use condition 'above' or 'below' when no expression is provided.`,
            node.nodeId,
            "condition",
          );
        }

        if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            `${normalizedType === "filter" ? "Filter" : "If"} node must include targetPrice greater than 0 when no expression is provided.`,
            node.nodeId,
            "targetPrice",
          );
        }
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

    if (normalizedType === "market-session") {
      const marketType = String(metadata.marketType || "").trim().toLowerCase();
      const event = String(metadata.event || "").trim().toLowerCase();
      const triggerTime = String(metadata.triggerTime || "").trim();
      const isValidTime = /^\d{1,2}:\d{2}$/.test(triggerTime);

      if (!["indian", "crypto", "web3"].includes(marketType)) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Market-session node must include a valid market type (indian, crypto, or web3).",
          node.nodeId,
          "marketType",
        );
      }
      if (![
        "market-open",
        "market-close",
        "at-time",
        "pause-at-time",
        "session-window",
      ].includes(event)) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Market-session node must include a valid event (market-open, market-close, at-time, pause-at-time, or session-window).",
          node.nodeId,
          "event",
        );
      }
      if ((event === "at-time" || event === "pause-at-time") && !triggerTime) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Market-session time-based event must include triggerTime in HH:MM format.",
          node.nodeId,
          "triggerTime",
        );
      } else if ((event === "at-time" || event === "pause-at-time") && !isValidTime) {
        pushIssue(
          issues,
          "error",
          "INVALID_GRAPH",
          "Market-session triggerTime must be in HH:MM format.",
          node.nodeId,
          "triggerTime",
        );
      } else if ((event === "at-time" || event === "pause-at-time") && isValidTime) {
        const timeParts = triggerTime.split(":");
        if (timeParts.length !== 2) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Market-session triggerTime must include hours and minutes.",
            node.nodeId,
            "triggerTime",
          );
          continue;
        }

        const hours = Number(timeParts[0]);
        const minutes = Number(timeParts[1]);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Market-session triggerTime has invalid hour/minute values.",
            node.nodeId,
            "triggerTime",
          );
        }
      } else if (event === "session-window") {
        const endTime = String(metadata.endTime || "").trim();

        if (!triggerTime || !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(triggerTime)) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Market-session session-window start time must be in HH:MM format.",
            node.nodeId,
            "triggerTime",
          );
        }

        if (!endTime || !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(endTime)) {
          pushIssue(
            issues,
            "error",
            "INVALID_GRAPH",
            "Market-session session-window end time must be in HH:MM format.",
            node.nodeId,
            "endTime",
          );
        }
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
  const expectedMarketTypes = request.market === "Crypto"
    ? new Set(["crypto", "web3"])
    : new Set(["indian"]);

  for (const node of plan.nodes) {
    const metadata = (node.data.metadata || {}) as Record<string, unknown>;
    const normalizedType = String(node.type || "").toLowerCase();
    const rawMarketType = String(metadata.marketType || "").trim().toLowerCase();

    if (!rawMarketType) continue;

    const shouldValidateMarketType =
      normalizedType === "market-session" ||
      normalizedType === "price" ||
      normalizedType === "price-trigger" ||
      normalizedType === "conditional-trigger" ||
      normalizedType === "if" ||
      normalizedType === "filter";

    if (!shouldValidateMarketType) continue;

    if (!expectedMarketTypes.has(rawMarketType)) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        `Node marketType '${rawMarketType}' does not match requested market '${request.market}'.`,
        node.nodeId,
        "marketType",
      );
    }
  }

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

  const asksForCrossover = /(cross(?:es|ed)?[_\s-]?(above|below)|crossover)/i.test(prompt);
  if (asksForCrossover) {
    const conditionalNodes = plan.nodes.filter((node) => String(node.type).toLowerCase() === "conditional-trigger");

    if (!conditionalNodes.length) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        "Prompt requested a crossover trigger, but the generated plan does not contain a conditional trigger.",
      );
      return;
    }

    const hasCrossoverClause = conditionalNodes.some((node) => {
      const metadata = (node.data.metadata || {}) as Record<string, unknown>;
      const clauses = extractClauses(metadata.expression);
      return clauses.some((clause) => {
        const operator = String(clause.operator || "").toLowerCase();
        return operator === "crosses_above" || operator === "crosses_below";
      });
    });

    if (!hasCrossoverClause) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        "Prompt requested a crossover condition, but the generated expression does not include crosses_above/crosses_below.",
      );
    }
  }

  const asksForVolumeSpike = /volume\s*(spike|surge)|spike\s+in\s+volume|high\s+volume|volume\s*above/i.test(prompt);
  if (asksForVolumeSpike) {
    const conditionalNodes = plan.nodes.filter((node) => String(node.type).toLowerCase() === "conditional-trigger");

    if (!conditionalNodes.length) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        "Prompt requested a volume spike condition, but the generated plan does not contain a conditional trigger.",
      );
      return;
    }

    const hasVolumeClause = conditionalNodes.some((node) => {
      const metadata = (node.data.metadata || {}) as Record<string, unknown>;
      const clauses = extractClauses(metadata.expression);
      return clauses.some((clause: any) => {
        const left = clause?.left as { type?: string; indicator?: { indicator?: string } } | undefined;
        const right = clause?.right as { type?: string; indicator?: { indicator?: string } } | undefined;
        return (
          (left?.type === "indicator" && String(left?.indicator?.indicator || "").toLowerCase() === "volume") ||
          (right?.type === "indicator" && String(right?.indicator?.indicator || "").toLowerCase() === "volume")
        );
      });
    });

    if (!hasVolumeClause) {
      pushIssue(
        issues,
        "error",
        "PROMPT_MISMATCH",
        "Prompt requested a volume spike condition, but the generated expression does not include a volume clause.",
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

  if (triggerNodes.length > 1) {
    pushIssue(
      issues,
      "error",
      "INVALID_GRAPH",
      "Generated plan contains multiple trigger nodes. Use exactly one trigger node and move additional conditions into downstream filter/if nodes.",
    );
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

    if (String(node.type).toLowerCase() === "conditional-trigger" || String(node.type).toLowerCase() === "if") {
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
  normalizeCrossoverOperatorsInPlan(plan, request.prompt || "");
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
