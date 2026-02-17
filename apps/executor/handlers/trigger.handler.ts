import type { ConditionalTriggerMetadata, IndicatorConditionGroup } from "@n8n-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@n8n-trading/types";
import type { NodeType, WorkflowType } from "../types";
import { getCurrentPrice } from "../services/price.service";
import { indicatorEngine } from "../services/indicator.engine";

export async function handlePriceTrigger(
    workflow: WorkflowType,
    trigger: NodeType
): Promise<boolean> {
    const { condition, targetPrice } = trigger.data?.metadata || {};
    
    if (!condition || typeof targetPrice !== "number") {
        console.error("Invalid price trigger metadata");
        return false;
    }

    const market = workflow.nodes[0]?.data?.metadata?.marketType || "Indian";

    const actions = workflow.nodes.filter(
        (n: any) => n?.data?.kind === "action" || n?.data?.kind === "ACTION"
    );

    if (actions.length === 0) return false;

    const assets = [
        ...new Set(
            actions
                .map((a: any) => a.data?.metadata?.symbol)
                .filter(Boolean)
        ),
    ];

    for (const asset of assets) {
        if ((market === "Indian" && !SUPPORTED_INDIAN_MARKET_ASSETS.includes(asset as string)) || (market === "Crypto" && !SUPPORTED_WEB3_ASSETS.includes(asset as string))) {
            console.error(`Unsupported asset ${asset}`);
            return false;
        }
    }

    const priceMap: Record<string, number> = {};

    for (const asset of assets) {
        priceMap[asset as string] = await getCurrentPrice(asset as string, market);
    }

    for (const action of actions) {
        const asset = action.data?.metadata?.symbol;
        const currentPrice = priceMap[asset];
        if (currentPrice === undefined) continue;

        if (
            (condition === "above" && currentPrice > targetPrice) ||
            (condition === "below" && currentPrice < targetPrice)
        ) {
            return true;
        }
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
