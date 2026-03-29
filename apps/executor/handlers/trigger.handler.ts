import type { ConditionalTriggerMetadata, IndicatorConditionGroup } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import { getCurrentPrice } from "@quantnest-trading/market";
import type { NodeType, WorkflowType } from "../types";
import { indicatorEngine } from "../services/indicator.engine";

export async function handlePriceTrigger(
    workflow: WorkflowType,
    trigger: NodeType
): Promise<boolean> {
    const { condition, targetPrice, asset, marketType } = trigger.data?.metadata || {};
    
    if (!condition || typeof targetPrice !== "number" || !asset) {
        console.error("Invalid price trigger metadata");
        return false;
    }

    const normalizedMarket = String(marketType || workflow.nodes[0]?.data?.metadata?.marketType || "Indian").toLowerCase();
    const market = normalizedMarket === "crypto" || normalizedMarket === "web3" ? "Crypto" : "Indian";
    const normalizedAsset = String(asset).trim();

    if (
        (market === "Indian" && !SUPPORTED_INDIAN_MARKET_ASSETS.includes(normalizedAsset as string)) ||
        (market === "Crypto" && !SUPPORTED_WEB3_ASSETS.includes(normalizedAsset as string))
    ) {
        console.error(`Unsupported asset ${normalizedAsset}`);
        return false;
    }

    const currentPrice = await getCurrentPrice(normalizedAsset, market);

    if (condition === "above") {
        return currentPrice > targetPrice;
    }

    if (condition === "below") {
        return currentPrice < targetPrice;
    }

    return false;
}

export async function handleTimerTrigger(
    lastExecutionTime: number | null,
    interval: number
): Promise<boolean> {
    if (!lastExecutionTime) return true;
    return lastExecutionTime + interval * 1000 < Date.now();
}

export async function handleConditionalTrigger(timeWindowMinutes?: number, startTime?: Date): Promise<boolean> {
    if (!timeWindowMinutes || !startTime) {
        return true;
    }
    const now = Date.now();
    const start = startTime.getTime();
    return now >= start && now <= start + timeWindowMinutes * 60 * 1000;   
}

export async function checkCondition(targetPrice: number, marketType: "Indian" | "Crypto", asset: string, condition: "above" | "below"): Promise<boolean> {
    const currentPrice = await getCurrentPrice(asset, marketType);
    if (condition === "above") {
        return currentPrice > targetPrice;
    } else {
        return currentPrice < targetPrice;
    }   
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
            (metadata.marketType === "Crypto" || metadata.marketType === "web3") ? "Crypto" : "Indian",
            metadata.asset,
            metadata.condition
        );
    }

    return false;
}
