import type { IndicatorConditionGroup } from "@quantnest-trading/types";
import {
  getCurrentPrice,
  getHistoricalChart,
  type MarketCandle,
} from "@quantnest-trading/market";
import {
  collectIndicatorReferences,
  evaluateExpression,
  normalizeMarket,
  resolveOperandValue,
} from "./market";

function getChartIntervalForWindow(windowMinutes: number): "1m" | "2m" | "5m" | "15m" | "60m" {
  if (windowMinutes <= 30) return "1m";
  if (windowMinutes <= 60) return "2m";
  if (windowMinutes <= 180) return "5m";
  if (windowMinutes <= 720) return "15m";
  return "60m";
}

export async function buildWorkflowPreview(body: any) {
  const marketType = normalizeMarket(body?.marketType);
  const asset = typeof body?.asset === "string" ? body.asset : undefined;
  const targetPrice = typeof body?.targetPrice === "number" ? body.targetPrice : Number(body?.targetPrice);
  const condition = body?.condition;
  const mode = String(body?.mode || "threshold").toLowerCase();
  const changeType = String(body?.changeType || "").toLowerCase();
  const changeDirection = String(body?.changeDirection || "").toLowerCase();
  const changeValue = typeof body?.changeValue === "number" ? body.changeValue : Number(body?.changeValue);
  const changeWindowMinutes =
    typeof body?.changeWindowMinutes === "number"
      ? body.changeWindowMinutes
      : Number(body?.changeWindowMinutes);
  const direction = String(body?.direction || "").toLowerCase();
  const breakoutLevel = typeof body?.breakoutLevel === "number" ? body.breakoutLevel : Number(body?.breakoutLevel);
  const retestTolerancePct =
    typeof body?.retestTolerancePct === "number"
      ? body.retestTolerancePct
      : Number(body?.retestTolerancePct);
  const confirmationMovePct =
    typeof body?.confirmationMovePct === "number"
      ? body.confirmationMovePct
      : Number(body?.confirmationMovePct);
  const expression = body?.expression as IndicatorConditionGroup | undefined;
  const historicalCache = new Map<string, MarketCandle[]>();
  const valueCache = new Map<string, number | null>();

  let currentPrice: number | undefined;
  let conditionMet: boolean | undefined;
  let distanceToTarget: number | null | undefined;
  let baselinePrice: number | null | undefined;
  let priceChange: number | null | undefined;
  let priceChangePercent: number | null | undefined;
  let triggerStage: "waiting-breakout" | "breakout-detected" | "retest-zone" | "confirmed" | undefined;
  let triggerStageLabel: string | undefined;
  let lowerRetestBand: number | null | undefined;
  let upperRetestBand: number | null | undefined;

  if (asset) {
    currentPrice = await getCurrentPrice(asset, marketType);
  }

  if (typeof currentPrice === "number") {
    if (
      mode === "breakout-retest" &&
      Number.isFinite(breakoutLevel) &&
      breakoutLevel > 0 &&
      Number.isFinite(retestTolerancePct) &&
      retestTolerancePct > 0 &&
      Number.isFinite(confirmationMovePct) &&
      confirmationMovePct > 0
    ) {
      const toleranceValue = (Math.abs(breakoutLevel) * retestTolerancePct) / 100;
      const confirmationMoveValue = (Math.abs(breakoutLevel) * confirmationMovePct) / 100;
      lowerRetestBand = breakoutLevel - toleranceValue;
      upperRetestBand = breakoutLevel + toleranceValue;

      const isBullish = direction === "bullish";
      const isConfirmed = isBullish
        ? currentPrice >= breakoutLevel + confirmationMoveValue
        : currentPrice <= breakoutLevel - confirmationMoveValue;
      const isInRetestZone =
        lowerRetestBand != null &&
        upperRetestBand != null &&
        currentPrice >= lowerRetestBand &&
        currentPrice <= upperRetestBand;
      const hasBrokenOut = isBullish ? currentPrice > breakoutLevel : currentPrice < breakoutLevel;

      if (isConfirmed) {
        triggerStage = "confirmed";
        triggerStageLabel = isBullish ? "Confirmation fired" : "Bearish confirmation fired";
        conditionMet = true;
      } else if (isInRetestZone) {
        triggerStage = "retest-zone";
        triggerStageLabel = "Price is in the retest zone";
        conditionMet = false;
      } else if (hasBrokenOut) {
        triggerStage = "breakout-detected";
        triggerStageLabel = "Breakout detected, waiting for retest";
        conditionMet = false;
      } else {
        triggerStage = "waiting-breakout";
        triggerStageLabel = "Waiting for initial breakout";
        conditionMet = false;
      }

      distanceToTarget = currentPrice - breakoutLevel;
    } else if (mode === "change" && Number.isFinite(changeWindowMinutes) && changeWindowMinutes > 0) {
      const periodStart = new Date(Date.now() - changeWindowMinutes * 60 * 1000);
      const candles = await getHistoricalChart(
        asset!,
        marketType,
        periodStart,
        getChartIntervalForWindow(changeWindowMinutes),
      );

      const baselineCandle = candles.find(
        (candle) => typeof candle?.close === "number" && Number.isFinite(candle.close),
      );
      baselinePrice = baselineCandle?.close ?? null;
      if (typeof baselinePrice === "number" && Number.isFinite(baselinePrice) && baselinePrice > 0) {
        const delta = currentPrice - baselinePrice;
        priceChange = delta;
        priceChangePercent = (delta / baselinePrice) * 100;

        const directionalMatch =
          changeDirection === "increase"
            ? delta >= 0
            : changeDirection === "decrease"
              ? delta <= 0
              : false;

        const magnitude = Math.abs(delta);
        const observedChange = changeType === "percent" ? Math.abs(priceChangePercent) : magnitude;

        if (Number.isFinite(changeValue) && changeValue > 0) {
          distanceToTarget = observedChange - changeValue;
          conditionMet = directionalMatch && observedChange >= changeValue;
        }
      }
    } else if (Number.isFinite(targetPrice) && (condition === "above" || condition === "below")) {
      distanceToTarget = currentPrice - targetPrice;
      conditionMet = condition === "above" ? currentPrice > targetPrice : currentPrice < targetPrice;
    }
  }

  const indicatorSnapshot = [];
  if (expression) {
    const refs = collectIndicatorReferences(expression);
    for (const ref of refs) {
      const value = await resolveOperandValue(
        {
          type: "indicator",
          indicator: ref,
        },
        valueCache,
        historicalCache,
      );

      indicatorSnapshot.push({
        symbol: ref.symbol,
        marketType: normalizeMarket(ref.marketType),
        timeframe: ref.timeframe,
        indicator: ref.indicator,
        period: ref.params?.period,
        value,
      });
    }

    conditionMet = await evaluateExpression(expression, valueCache, historicalCache);
  }

  return {
    currentPrice,
    conditionMet,
    distanceToTarget,
    baselinePrice,
    priceChange,
    priceChangePercent,
    triggerStage,
    triggerStageLabel,
    breakoutLevel: Number.isFinite(breakoutLevel) ? breakoutLevel : null,
    lowerRetestBand,
    upperRetestBand,
    indicatorSnapshot,
    evaluatedAt: new Date().toISOString(),
  };
}