import type { IndicatorMarket, IndicatorReference } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import { indicatorEngine } from "../services/indicator.engine";
import type { NotificationDetails } from "../types";
import {
  getCurrentPrice,
  getVolume,
  getHistoricalChart,
  calculateEmaSeries,
  calculateRsiSeries,
  calculatePctChangeSeries,
  calculateSmaSeries,
} from "@quantnest-trading/market";

export interface MarketDataContext {
  symbol: string;
  market: IndicatorMarket;
  currentPrice: number | null;
  volume: number | null;
  priceChangeSeries: number[];
  emaSeries20: number[];
  emaSeries50: number[];
  rsiSeries14: number[];
  smaSeries200: number[];
  timestamp: string;
}

export async function buildMarketDataContext(
  symbol: string,
  market: IndicatorMarket,
): Promise<MarketDataContext> {
  const fallback: MarketDataContext = {
    symbol,
    market,
    currentPrice: null,
    volume: null,
    priceChangeSeries: [],
    emaSeries20: [],
    emaSeries50: [],
    rsiSeries14: [],
    smaSeries200: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const currentPrice = await getCurrentPrice(symbol, market);
    const volume = await getVolume(symbol, market);

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const candles1m = await getHistoricalChart(symbol, market, oneHourAgo, "1m");
    const candles5m = await getHistoricalChart(symbol, market, oneHourAgo, "5m");
    const candles200 = await getHistoricalChart(symbol, market, fiveDaysAgo, "1d");

    return {
      symbol,
      market,
      currentPrice,
      volume,
      priceChangeSeries: calculatePctChangeSeries(candles5m, 1),
      emaSeries20: calculateEmaSeries(candles5m, 20),
      emaSeries50: calculateEmaSeries(candles5m, 50),
      rsiSeries14: calculateRsiSeries(candles5m, 14),
      smaSeries200: calculateSmaSeries(candles200, 200),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to build market data context for", symbol, error);
    return fallback;
  }
}

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
