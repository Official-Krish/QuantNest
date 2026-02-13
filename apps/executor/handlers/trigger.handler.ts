import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@n8n-trading/types";
import type { NodeType, WorkflowType } from "../types";
import { getCurrentPrice } from "../services/price.service";

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
