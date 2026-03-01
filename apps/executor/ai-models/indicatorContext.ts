import type { IndicatorMarket, IndicatorReference } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import { indicatorEngine } from "../services/indicator.engine";
import type { NotificationDetails } from "../types";

export function buildDefaultReferences(details: NotificationDetails): IndicatorReference[] {
    const marketType: IndicatorMarket = details.aiContext?.marketType || "Indian";
    const symbols = [
        ...(details.aiContext?.connectedSymbols || []),
        details.aiContext?.symbol,
        details.symbol,
    ].filter((symbol): symbol is string => typeof symbol === "string" && symbol.length > 0);

    const uniqueSymbols = [...new Set(symbols)];
    if (!uniqueSymbols.length) {
        const fallbackSymbol = marketType === "Crypto"
            ? SUPPORTED_WEB3_ASSETS[0]
            : SUPPORTED_INDIAN_MARKET_ASSETS[0];
        if (fallbackSymbol) {
            uniqueSymbols.push(fallbackSymbol);
        }
    }
    const refs: IndicatorReference[] = [];

    uniqueSymbols.forEach((symbol) => {
        refs.push(
            { symbol, marketType, timeframe: "5m", indicator: "price" },
            { symbol, marketType, timeframe: "5m", indicator: "volume" },
            { symbol, marketType, timeframe: "5m", indicator: "rsi", params: { period: 14 } },
            { symbol, marketType, timeframe: "5m", indicator: "ema", params: { period: 20 } },
            { symbol, marketType, timeframe: "5m", indicator: "ema", params: { period: 50 } },
            { symbol, marketType, timeframe: "15m", indicator: "ema", params: { period: 20 } },
            { symbol, marketType, timeframe: "15m", indicator: "ema", params: { period: 50 } },
            { symbol, marketType, timeframe: "5m", indicator: "pct_change", params: { period: 3 } },
        );
    });

    return refs;
}

export async function buildIndicatorSnapshot(
    details: NotificationDetails,
    defaultReferences: IndicatorReference[]
): Promise<unknown[]> {
    let indicatorSnapshot: unknown[] = [];

    if (details.aiContext?.expression) {
        indicatorEngine.registerExpression(details.aiContext.expression);
        indicatorEngine.registerReferences(defaultReferences);
        await indicatorEngine.refreshSubscribedSymbols();
        const expressionSnapshot = await indicatorEngine.getExpressionSnapshot(details.aiContext.expression);
        const defaultSnapshot = await indicatorEngine.getSnapshotForReferences(defaultReferences);
        const merged = new Map<string, unknown>();
        [...expressionSnapshot, ...defaultSnapshot].forEach((entry: any) => {
            merged.set(
                `${entry.marketType}:${entry.symbol}:${entry.timeframe}:${entry.indicator}:${entry.period || ""}`,
                entry,
            );
        });
        indicatorSnapshot = [...merged.values()];
    } else if (defaultReferences.length) {
        indicatorEngine.registerReferences(defaultReferences);
        await indicatorEngine.refreshSubscribedSymbols();
        indicatorSnapshot = await indicatorEngine.getSnapshotForReferences(defaultReferences);
    }

    return indicatorSnapshot;
}
