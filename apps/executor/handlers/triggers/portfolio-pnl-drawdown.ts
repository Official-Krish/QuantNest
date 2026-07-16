import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import type { NodeType, WorkflowType } from "../../types";
import {
  getBrokerAccountMetrics,
  type BrokerAccountMetrics,
} from "../../services/accountMetrics";

type RiskMode = "daily-loss-cap" | "profit-target" | "drawdown-limit";
type ThresholdUnit = "absolute" | "percent";

export interface PortfolioRiskRuntime {
  baselineAccountValue?: number;
  peakAccountValue?: number;
  lastMeasuredAt?: string;
  lastAccountValue?: number;
  lastTotalPnl?: number;
  lastDrawdown?: number;
  lastDrawdownPct?: number;
}

export interface PortfolioRiskEvaluationResult {
  shouldExecute: boolean;
  runtime: PortfolioRiskRuntime;
  metrics: BrokerAccountMetrics;
  measuredValue: number;
  measuredUnit: ThresholdUnit;
  mode: RiskMode;
  snapshot: TriggerEvaluationSnapshot;
}

function normalizeRiskMode(value: unknown): RiskMode {
  const normalized = String(value || "daily-loss-cap")
    .trim()
    .toLowerCase();
  if (normalized === "profit-target") return "profit-target";
  if (normalized === "drawdown-limit") return "drawdown-limit";
  return "daily-loss-cap";
}

function normalizeThresholdUnit(value: unknown): ThresholdUnit {
  return String(value || "absolute")
    .trim()
    .toLowerCase() === "percent"
    ? "percent"
    : "absolute";
}

function getPreviousRuntime(workflow: WorkflowType): PortfolioRiskRuntime {
  const runtime = (workflow.triggerConfig?.runtime ||
    {}) as PortfolioRiskRuntime;
  return {
    baselineAccountValue:
      typeof runtime.baselineAccountValue === "number"
        ? runtime.baselineAccountValue
        : undefined,
    peakAccountValue:
      typeof runtime.peakAccountValue === "number"
        ? runtime.peakAccountValue
        : undefined,
    lastMeasuredAt:
      typeof runtime.lastMeasuredAt === "string"
        ? runtime.lastMeasuredAt
        : undefined,
    lastAccountValue:
      typeof runtime.lastAccountValue === "number"
        ? runtime.lastAccountValue
        : undefined,
    lastTotalPnl:
      typeof runtime.lastTotalPnl === "number"
        ? runtime.lastTotalPnl
        : undefined,
    lastDrawdown:
      typeof runtime.lastDrawdown === "number"
        ? runtime.lastDrawdown
        : undefined,
    lastDrawdownPct:
      typeof runtime.lastDrawdownPct === "number"
        ? runtime.lastDrawdownPct
        : undefined,
  };
}

export async function handlePortfolioPnlDrawdownTrigger(
  workflow: WorkflowType,
  trigger: NodeType,
): Promise<PortfolioRiskEvaluationResult> {
  const metadata = (trigger.data?.metadata || {}) as Record<string, unknown>;
  const broker = String(metadata.broker || "")
    .trim()
    .toLowerCase() as "zerodha" | "groww" | "lighter";
  if (!["zerodha", "groww", "lighter"].includes(broker)) {
    throw new Error(
      "Portfolio PnL / Drawdown trigger requires broker to be zerodha, groww, or lighter.",
    );
  }

  const mode = normalizeRiskMode(metadata.mode);
  const thresholdUnit = normalizeThresholdUnit(metadata.thresholdUnit);
  const thresholdValue = Number(metadata.thresholdValue);
  if (!Number.isFinite(thresholdValue) || thresholdValue <= 0) {
    throw new Error(
      "Portfolio PnL / Drawdown thresholdValue must be greater than 0.",
    );
  }

  const metrics = await getBrokerAccountMetrics({
    userId: workflow.userId?.toString?.(),
    workflowId: workflow._id?.toString?.(),
    broker,
    metadata,
  });

  const previousRuntime = getPreviousRuntime(workflow);
  const accountValue =
    typeof metrics.accountValue === "number" &&
    Number.isFinite(metrics.accountValue)
      ? metrics.accountValue
      : undefined;
  const baselineAccountValue =
    previousRuntime.baselineAccountValue ?? accountValue;
  const peakAccountValue =
    accountValue === undefined
      ? previousRuntime.peakAccountValue
      : Math.max(
          previousRuntime.peakAccountValue ?? accountValue,
          accountValue,
        );
  const drawdown =
    accountValue !== undefined && peakAccountValue !== undefined
      ? Math.max(0, peakAccountValue - accountValue)
      : undefined;
  const drawdownPct =
    drawdown !== undefined && peakAccountValue && peakAccountValue > 0
      ? (drawdown / peakAccountValue) * 100
      : undefined;

  const runtime: PortfolioRiskRuntime = {
    baselineAccountValue,
    peakAccountValue,
    lastMeasuredAt: metrics.measuredAt,
    lastAccountValue: accountValue,
    lastTotalPnl: metrics.totalPnl,
    lastDrawdown: drawdown,
    lastDrawdownPct: drawdownPct,
  };

  let measuredValue = metrics.totalPnl;
  let shouldExecute = false;

  if (mode === "daily-loss-cap") {
    if (thresholdUnit === "percent") {
      const base = accountValue ?? baselineAccountValue;
      if (!base || base <= 0) {
        throw new Error(
          "Daily loss percent threshold requires account value from broker metrics.",
        );
      }
      measuredValue = Math.max(0, (-metrics.totalPnl / base) * 100);
      shouldExecute = measuredValue >= thresholdValue;
    } else {
      measuredValue = metrics.totalPnl;
      shouldExecute = metrics.totalPnl <= -thresholdValue;
    }
  }

  if (mode === "profit-target") {
    if (thresholdUnit === "percent") {
      const base = accountValue ?? baselineAccountValue;
      if (!base || base <= 0) {
        throw new Error(
          "Profit target percent threshold requires account value from broker metrics.",
        );
      }
      measuredValue = Math.max(0, (metrics.totalPnl / base) * 100);
      shouldExecute = measuredValue >= thresholdValue;
    } else {
      measuredValue = metrics.totalPnl;
      shouldExecute = metrics.totalPnl >= thresholdValue;
    }
  }

  if (mode === "drawdown-limit") {
    if (drawdown === undefined || drawdownPct === undefined) {
      throw new Error(
        "Drawdown threshold requires account value from broker metrics.",
      );
    }
    measuredValue = thresholdUnit === "percent" ? drawdownPct : drawdown;
    shouldExecute = measuredValue >= thresholdValue;
  }

  const snapshot: TriggerEvaluationSnapshot = {
    triggerType: "portfolio-pnl-drawdown-trigger",
    evaluatedCondition: shouldExecute,
    marketType: broker,
    currentPrice: metrics.totalPnl,
  };

  return {
    shouldExecute,
    runtime,
    metrics,
    measuredValue: Number(measuredValue.toFixed(2)),
    measuredUnit: thresholdUnit,
    mode,
    snapshot,
  };
}
