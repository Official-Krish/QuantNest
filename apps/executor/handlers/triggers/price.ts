import { getCurrentPrice, getHistoricalChart } from "@quantnest-trading/market";
import type { NodeType, WorkflowType } from "../../types";
import { getChartIntervalForWindow, isSupportedAssetForMarket, normalizeTriggerMarket } from "./shared";

export async function handlePriceTrigger(
  workflow: WorkflowType,
  trigger: NodeType,
): Promise<boolean> {
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

  if (!asset) {
    console.error("Invalid price trigger metadata");
    return false;
  }

  const market = normalizeTriggerMarket(
    marketType || workflow.nodes[0]?.data?.metadata?.marketType || "Indian",
  );
  const normalizedAsset = String(asset).trim();

  if (!isSupportedAssetForMarket(normalizedAsset, market)) {
    console.error(`Unsupported asset ${normalizedAsset}`);
    return false;
  }

  const currentPrice = await getCurrentPrice(normalizedAsset, market);

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
      return false;
    }

    const periodStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const candles = await getHistoricalChart(
      normalizedAsset,
      market,
      periodStart,
      getChartIntervalForWindow(windowMinutes),
    );

    const baselineCandle = candles.find(
      (candle) => typeof candle?.close === "number" && Number.isFinite(candle.close),
    );
    const baselinePriceRaw = baselineCandle?.close;
    if (
      typeof baselinePriceRaw !== "number" ||
      !Number.isFinite(baselinePriceRaw) ||
      baselinePriceRaw <= 0
    ) {
      return false;
    }

    const delta = currentPrice - baselinePriceRaw;
    const directionalMatch = normalizedDirection === "increase" ? delta >= 0 : delta <= 0;
    if (!directionalMatch) {
      return false;
    }

    const magnitude = Math.abs(delta);
    const observedChange =
      normalizedType === "percent" ? (magnitude / baselinePriceRaw) * 100 : magnitude;

    return observedChange >= requiredChange;
  }

  if (!condition || typeof targetPrice !== "number") {
    console.error("Invalid threshold price trigger metadata");
    return false;
  }

  if (condition === "above") {
    return currentPrice > targetPrice;
  }

  if (condition === "below") {
    return currentPrice < targetPrice;
  }

  return false;
}
