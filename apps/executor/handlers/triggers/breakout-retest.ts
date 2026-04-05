import { getCurrentPrice } from "@quantnest-trading/market";
import type { NodeType, WorkflowType } from "../../types";
import {
  getConfirmationMoveValue,
  getRetestToleranceValue,
  isSupportedAssetForMarket,
  normalizeTriggerMarket,
} from "./shared";

export async function handleBreakoutRetestTrigger(
  workflow: WorkflowType,
  trigger: NodeType,
): Promise<{
  shouldExecute: boolean;
  runtime: {
    stage: "idle" | "broken-out" | "retested" | "confirmed";
    breakoutDetectedAt?: string;
    retestDetectedAt?: string;
    breakoutPrice?: number;
    retestPrice?: number;
  };
  currentPrice: number;
}> {
  const {
    asset,
    marketType,
    direction,
    breakoutLevel,
    retestTolerancePct,
    confirmationMovePct,
    retestWindowMinutes,
    confirmationWindowMinutes,
  } = trigger.data?.metadata || {};

  if (!asset || !Number.isFinite(Number(breakoutLevel))) {
    throw new Error("Invalid breakout retest trigger metadata");
  }

  const normalizedAsset = String(asset).trim();
  const market = normalizeTriggerMarket(
    marketType || workflow.nodes[0]?.data?.metadata?.marketType || "Indian",
  );
  const normalizedDirection = String(direction || "").toLowerCase();

  if (!isSupportedAssetForMarket(normalizedAsset, market)) {
    throw new Error(`Unsupported asset ${normalizedAsset}`);
  }

  if (!["bullish", "bearish"].includes(normalizedDirection)) {
    throw new Error("Breakout retest direction must be bullish or bearish");
  }

  const level = Number(breakoutLevel);
  const tolerancePct = Number(retestTolerancePct);
  const confirmationPct = Number(confirmationMovePct);
  const retestWindow = Number(retestWindowMinutes);
  const confirmationWindow = Number(confirmationWindowMinutes);

  if (
    !Number.isFinite(tolerancePct) ||
    tolerancePct <= 0 ||
    !Number.isFinite(confirmationPct) ||
    confirmationPct <= 0 ||
    !Number.isFinite(retestWindow) ||
    retestWindow <= 0 ||
    !Number.isFinite(confirmationWindow) ||
    confirmationWindow <= 0
  ) {
    throw new Error("Breakout retest windows and percentages must be greater than zero");
  }

  const currentPrice = await getCurrentPrice(normalizedAsset, market);
  const toleranceValue = getRetestToleranceValue(level, tolerancePct);
  const confirmationMoveValue = getConfirmationMoveValue(level, confirmationPct);
  const now = new Date();

  const runtime = {
    stage: String(workflow.triggerConfig?.runtime?.stage || "idle") as
      | "idle"
      | "broken-out"
      | "retested"
      | "confirmed",
    breakoutDetectedAt: workflow.triggerConfig?.runtime?.breakoutDetectedAt
      ? new Date(workflow.triggerConfig.runtime.breakoutDetectedAt as string | Date).toISOString()
      : undefined,
    retestDetectedAt: workflow.triggerConfig?.runtime?.retestDetectedAt
      ? new Date(workflow.triggerConfig.runtime.retestDetectedAt as string | Date).toISOString()
      : undefined,
    breakoutPrice:
      typeof workflow.triggerConfig?.runtime?.breakoutPrice === "number"
        ? Number(workflow.triggerConfig.runtime.breakoutPrice)
        : undefined,
    retestPrice:
      typeof workflow.triggerConfig?.runtime?.retestPrice === "number"
        ? Number(workflow.triggerConfig.runtime.retestPrice)
        : undefined,
  };

  const resetRuntime = () => ({
    stage: "idle" as const,
    breakoutDetectedAt: undefined,
    retestDetectedAt: undefined,
    breakoutPrice: undefined,
    retestPrice: undefined,
  });

  const isBreakout = normalizedDirection === "bullish" ? currentPrice > level : currentPrice < level;
  const isInRetestZone =
    currentPrice >= level - toleranceValue && currentPrice <= level + toleranceValue;
  const isConfirmed =
    normalizedDirection === "bullish"
      ? currentPrice >= level + confirmationMoveValue
      : currentPrice <= level - confirmationMoveValue;

  if (runtime.stage === "broken-out" && runtime.breakoutDetectedAt) {
    const expiresAt = new Date(runtime.breakoutDetectedAt).getTime() + retestWindow * 60 * 1000;
    if (Date.now() > expiresAt) {
      Object.assign(runtime, resetRuntime());
    }
  }

  if (runtime.stage === "retested" && runtime.retestDetectedAt) {
    const expiresAt = new Date(runtime.retestDetectedAt).getTime() + confirmationWindow * 60 * 1000;
    if (Date.now() > expiresAt) {
      Object.assign(runtime, resetRuntime());
    }
  }

  if (runtime.stage === "idle" && isBreakout) {
    runtime.stage = "broken-out";
    runtime.breakoutDetectedAt = now.toISOString();
    runtime.breakoutPrice = currentPrice;
  }

  if (runtime.stage === "broken-out" && isInRetestZone) {
    runtime.stage = "retested";
    runtime.retestDetectedAt = now.toISOString();
    runtime.retestPrice = currentPrice;
  }

  if (runtime.stage === "retested" && isConfirmed) {
    runtime.stage = "confirmed";
    return {
      shouldExecute: true,
      runtime,
      currentPrice,
    };
  }

  return {
    shouldExecute: false,
    runtime,
    currentPrice,
  };
}
