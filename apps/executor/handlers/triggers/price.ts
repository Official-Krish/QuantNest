import { getCurrentPrice, getHistoricalChart } from "@quantnest-trading/market";
import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import type { NodeType, WorkflowType } from "../../types";
import {
  getChartIntervalForWindow,
  isSupportedAssetForMarket,
  normalizeTriggerMarket,
} from "./shared";

export async function handlePriceTrigger(
  workflow: WorkflowType,
  trigger: NodeType,
): Promise<{ shouldExecute: boolean; snapshot: TriggerEvaluationSnapshot }> {
  const {
    condition,
    targetPrice,
    asset,
    marketType,
    mode,
    changeType,
    changeDirection,
    changeValue,
    changeWindowMinutes,
  } = trigger.data?.metadata || {};

  const snapshot: TriggerEvaluationSnapshot = {
    triggerType: "price-trigger",
    symbol: asset,
    marketType: marketType || "Indian",
    targetPrice: typeof targetPrice === "number" ? targetPrice : undefined,
    condition,
    currentPrice: null,
    baselinePrice: null,
    priceChange: null,
    priceChangePercent: null,
  };

  if (!asset) {
    console.error("Invalid price trigger metadata");
    return { shouldExecute: false, snapshot };
  }

  const market = normalizeTriggerMarket(
    marketType || workflow.nodes[0]?.data?.metadata?.marketType || "Indian",
  );
  const normalizedAsset = String(asset).trim();

  if (!isSupportedAssetForMarket(normalizedAsset, market)) {
    console.error(`Unsupported asset ${normalizedAsset}`);
    return { shouldExecute: false, snapshot };
  }

  const currentPrice = await getCurrentPrice(normalizedAsset, market);
  snapshot.currentPrice = currentPrice;

  if (mode === "change") {
    const normalizedDirection = String(changeDirection || "").toLowerCase();
    const normalizedType = String(changeType || "").toLowerCase();
    const requiredChange = Number(changeValue);
    const windowMinutes = Number(changeWindowMinutes);

    if (
      !["increase", "decrease"].includes(normalizedDirection) ||
      !["absolute", "percent"].includes(normalizedType) ||
      !Number.isFinite(requiredChange) ||
      requiredChange <= 0 ||
      !Number.isFinite(windowMinutes) ||
      windowMinutes <= 0
    ) {
      console.error("Invalid price-change trigger metadata");
      return { shouldExecute: false, snapshot };
    }

    const periodStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const candles = await getHistoricalChart(
      normalizedAsset,
      market,
      periodStart,
      getChartIntervalForWindow(windowMinutes),
    );

    const baselineCandle = candles.find(
      (candle) =>
        typeof candle?.close === "number" && Number.isFinite(candle.close),
    );
    const baselinePriceRaw = baselineCandle?.close;
    if (
      typeof baselinePriceRaw !== "number" ||
      !Number.isFinite(baselinePriceRaw) ||
      baselinePriceRaw <= 0
    ) {
      return { shouldExecute: false, snapshot };
    }

    const delta = currentPrice - baselinePriceRaw;
    snapshot.baselinePrice = baselinePriceRaw;
    snapshot.priceChange = delta;
    snapshot.priceChangePercent = (delta / baselinePriceRaw) * 100;

    const directionalMatch =
      normalizedDirection === "increase" ? delta >= 0 : delta <= 0;
    if (!directionalMatch) {
      return { shouldExecute: false, snapshot };
    }

    const magnitude = Math.abs(delta);
    const observedChange =
      normalizedType === "percent"
        ? (magnitude / baselinePriceRaw) * 100
        : magnitude;

    return { shouldExecute: observedChange >= requiredChange, snapshot };
  }

  if (!condition || typeof targetPrice !== "number") {
    console.error("Invalid threshold price trigger metadata");
    return { shouldExecute: false, snapshot };
  }

  if (condition === "above") {
    return { shouldExecute: currentPrice > targetPrice, snapshot };
  }

  if (condition === "below") {
    return { shouldExecute: currentPrice < targetPrice, snapshot };
  }

  return { shouldExecute: false, snapshot };
}
