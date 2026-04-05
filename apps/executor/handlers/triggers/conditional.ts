import type { ConditionalTriggerMetadata, IndicatorConditionGroup } from "@quantnest-trading/types";
import { getCurrentPrice } from "@quantnest-trading/market";
import { indicatorEngine } from "../../services/indicator.engine";

export async function handleConditionalTrigger(
  timeWindowMinutes?: number,
  startTime?: Date,
): Promise<boolean> {
  if (!timeWindowMinutes || !startTime) {
    return true;
  }
  const now = Date.now();
  const start = startTime.getTime();
  return now >= start && now <= start + timeWindowMinutes * 60 * 1000;
}

export async function checkCondition(
  targetPrice: number,
  marketType: "Indian" | "Crypto",
  asset: string,
  condition: "above" | "below",
): Promise<boolean> {
  const currentPrice = await getCurrentPrice(asset, marketType);
  if (condition === "above") {
    return currentPrice > targetPrice;
  }
  return currentPrice < targetPrice;
}

export async function evaluateConditionalMetadata(metadata?: ConditionalTriggerMetadata): Promise<boolean> {
  if (!metadata) {
    return false;
  }

  const expression = metadata.expression as IndicatorConditionGroup | undefined;
  if (expression) {
    indicatorEngine.registerExpression(expression);
    return indicatorEngine.evaluateExpression(expression);
  }

  if (
    typeof metadata.targetPrice === "number" &&
    typeof metadata.asset === "string" &&
    (metadata.condition === "above" || metadata.condition === "below")
  ) {
    return checkCondition(
      metadata.targetPrice,
      metadata.marketType === "Crypto" || metadata.marketType === "web3" ? "Crypto" : "Indian",
      metadata.asset,
      metadata.condition,
    );
  }

  return false;
}
