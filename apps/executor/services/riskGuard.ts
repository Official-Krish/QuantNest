import { getCurrentPrice } from "@quantnest-trading/market";
import { redisGet, redisIncrBy } from "@quantnest-trading/redis";
import type { RiskLimits } from "@quantnest-trading/types";
import { RiskLimitExceededError } from "../workflow/action-handlers/shared";
import { sendRiskAlertEmail } from "./riskAlerts";

export type RiskBroker = "zerodha" | "groww" | "lighter" | "solana";

export function getRiskBrokerForNode(nodeType: string): RiskBroker | undefined {
  const type = String(nodeType || "").toLowerCase();
  if (type === "zerodha" || type === "groww" || type === "lighter") {
    return type as RiskBroker;
  }
  if (type === "solana-swap") return "solana";
  return undefined;
}

export interface RiskEvaluation {
  ok: boolean;
  blocked: boolean;
  approvalRequired: boolean;
  notional: number;
  violations: string[];
  effectiveLimits: RiskLimits;
}

export interface RiskEvaluationInput {
  broker: RiskBroker;
  metadata: Record<string, unknown>;
  nodeRiskLimits?: RiskLimits;
  workflowRiskLimits?: RiskLimits;
}

const DAILY_LEDGER_TTL_MS = 48 * 60 * 60 * 1000;

function effectiveLimit(
  nodeValue: number | undefined,
  workflowValue: number | undefined,
): number | undefined {
  if (nodeValue === undefined && workflowValue === undefined) return undefined;
  const values = [nodeValue, workflowValue].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  return values.length ? Math.min(...values) : undefined;
}

export function resolveRiskLimits(input: {
  nodeRiskLimits?: RiskLimits;
  workflowRiskLimits?: RiskLimits;
}): RiskLimits {
  const node = input.nodeRiskLimits || {};
  const workflow = input.workflowRiskLimits || {};
  return {
    maxOrderAmount: effectiveLimit(
      node.maxOrderAmount,
      workflow.maxOrderAmount,
    ),
    maxQty: effectiveLimit(node.maxQty, workflow.maxQty),
    maxSlippageBps: effectiveLimit(
      node.maxSlippageBps,
      workflow.maxSlippageBps,
    ),
    maxDailyExposure: effectiveLimit(
      node.maxDailyExposure,
      workflow.maxDailyExposure,
    ),
    requireApprovalAbove: effectiveLimit(
      node.requireApprovalAbove,
      workflow.requireApprovalAbove,
    ),
    approvalPrompt: node.approvalPrompt || workflow.approvalPrompt,
  };
}

function dailyLedgerKey(userId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `risk:daily:${userId}:${date}`;
}

export async function getDailyExposure(userId: string): Promise<number> {
  const value = await redisGet<string>(dailyLedgerKey(userId));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function recordDailyExposure(
  userId: string,
  notional: number,
): Promise<void> {
  if (!userId || notional <= 0) return;
  await redisIncrBy(
    dailyLedgerKey(userId),
    Math.round(notional),
    DAILY_LEDGER_TTL_MS,
  );
}

/**
 * Compute the notional of an order in the broker's native currency units.
 * - Indian brokers (zerodha/groww): qty × live price — best-effort, returns
 *   qty alone when the price cannot be fetched (amount checks degrade).
 * - Crypto (lighter/solana): amount/qty is already a quantity of the asset.
 */
export async function getOrderNotional(
  broker: RiskBroker,
  metadata: Record<string, unknown>,
): Promise<{ notional: number; price: number | null }> {
  const symbol = String(metadata.symbol || metadata.fromToken || "");

  if (broker === "zerodha" || broker === "groww") {
    const qty = Number(metadata.qty) || 0;
    if (!symbol) return { notional: qty, price: null };
    try {
      const price = await getCurrentPrice(symbol, "Indian");
      const numericPrice = Number(price);
      if (Number.isFinite(numericPrice) && numericPrice > 0) {
        return { notional: qty * numericPrice, price: numericPrice };
      }
    } catch {
      // price unavailable — amount checks degrade gracefully
    }
    return { notional: qty, price: null };
  }

  const amount = Number(metadata.amount ?? metadata.qty) || 0;
  return { notional: amount, price: null };
}

export async function evaluateRisk(
  input: RiskEvaluationInput,
): Promise<RiskEvaluation> {
  const limits = resolveRiskLimits({
    nodeRiskLimits: input.nodeRiskLimits,
    workflowRiskLimits: input.workflowRiskLimits,
  });

  const violations: string[] = [];
  const { notional, price } = await getOrderNotional(
    input.broker,
    input.metadata,
  );

  const qty = Number(input.metadata.qty ?? input.metadata.amount) || 0;
  if (limits.maxQty !== undefined && qty > limits.maxQty) {
    violations.push(
      `Quantity ${qty} exceeds max allowed ${limits.maxQty} (per order).`,
    );
  }

  const slippageBps = Number(input.metadata.slippageBps);
  if (
    limits.maxSlippageBps !== undefined &&
    Number.isFinite(slippageBps) &&
    slippageBps > limits.maxSlippageBps
  ) {
    violations.push(
      `Slippage ${slippageBps} bps exceeds max allowed ${limits.maxSlippageBps} bps.`,
    );
  }

  if (
    limits.maxOrderAmount !== undefined &&
    price !== null &&
    notional > limits.maxOrderAmount
  ) {
    violations.push(
      `Order notional ${notional.toFixed(2)} exceeds max allowed ${limits.maxOrderAmount} (per order).`,
    );
  }

  if (limits.maxOrderAmount !== undefined && price === null) {
    violations.push(
      "Order amount limit is configured but the current price could not be fetched to validate it.",
    );
  }

  const approvalRequired =
    limits.requireApprovalAbove !== undefined &&
    notional > limits.requireApprovalAbove;

  const blocked = violations.length > 0;

  return {
    ok: !blocked,
    blocked,
    approvalRequired,
    notional,
    violations,
    effectiveLimits: limits,
  };
}

export async function assertOrderAllowed(
  input: RiskEvaluationInput & { userId?: string; workflowId?: string },
): Promise<RiskEvaluation> {
  const evaluation = await evaluateRisk(input);

  if (
    input.userId &&
    evaluation.effectiveLimits.maxDailyExposure !== undefined
  ) {
    const current = await getDailyExposure(input.userId);
    if (
      current + evaluation.notional >
      evaluation.effectiveLimits.maxDailyExposure
    ) {
      evaluation.blocked = true;
      evaluation.violations.push(
        `Daily exposure ${current.toFixed(2)} would exceed max ${evaluation.effectiveLimits.maxDailyExposure} with this order (${evaluation.notional.toFixed(2)}).`,
      );
    }
  }

  if (evaluation.blocked) {
    await sendRiskAlertEmail({
      userId: input.userId,
      workflowId: input.workflowId,
      reason: "blocked",
      message: evaluation.violations.join(" "),
    });
    throw new RiskLimitExceededError(evaluation.violations.join(" "));
  }

  return evaluation;
}
