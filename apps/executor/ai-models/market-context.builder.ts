import {
  SUPPORTED_INDIAN_MARKET_ASSETS,
  SUPPORTED_WEB3_ASSETS,
} from "@quantnest-trading/types";
import type {
  IndicatorMarket,
  IndicatorReference,
} from "@quantnest-trading/types";
import {
  calculateEmaSeries,
  calculatePctChangeSeries,
  calculateRsiSeries,
  calculateSmaSeries,
  getCurrentPrice,
  getHistoricalChart,
  getVolume,
} from "@quantnest-trading/market";
import { indicatorEngine } from "../services/indicator.engine";
import type { NotificationDetails } from "../types";

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

export class MarketContextBuilder {
  async build(
    symbol: string,
    market: IndicatorMarket,
  ): Promise<MarketDataContext> {
    const fallback = this.emptyContext(symbol, market);
    try {
      const currentPrice = await getCurrentPrice(symbol, market);
      const volume = await getVolume(symbol, market);

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const candles5m = await getHistoricalChart(
        symbol,
        market,
        oneHourAgo,
        "5m",
      );
      const candles200 = await getHistoricalChart(
        symbol,
        market,
        fiveDaysAgo,
        "1d",
      );

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

  buildDefaultReferences(details: NotificationDetails): IndicatorReference[] {
    const marketType: IndicatorMarket =
      details.aiContext?.marketType || "Indian";
    const symbols = [
      ...(details.aiContext?.connectedSymbols || []),
      details.aiContext?.symbol,
      details.symbol,
    ].filter(
      (symbol): symbol is string =>
        typeof symbol === "string" && symbol.length > 0,
    );

    const uniqueSymbols = [...new Set(symbols)];
    if (!uniqueSymbols.length) {
      const fallbackSymbol =
        marketType === "Crypto"
          ? SUPPORTED_WEB3_ASSETS[0]
          : SUPPORTED_INDIAN_MARKET_ASSETS[0];
      if (fallbackSymbol) uniqueSymbols.push(fallbackSymbol);
    }

    const refs: IndicatorReference[] = [];
    for (const symbol of uniqueSymbols) {
      refs.push(
        { symbol, marketType, timeframe: "5m", indicator: "price" },
        { symbol, marketType, timeframe: "5m", indicator: "volume" },
        {
          symbol,
          marketType,
          timeframe: "5m",
          indicator: "rsi",
          params: { period: 14 },
        },
        {
          symbol,
          marketType,
          timeframe: "5m",
          indicator: "ema",
          params: { period: 20 },
        },
        {
          symbol,
          marketType,
          timeframe: "5m",
          indicator: "ema",
          params: { period: 50 },
        },
        { symbol, marketType, timeframe: "5m", indicator: "macd" },
        { symbol, marketType, timeframe: "5m", indicator: "macd_signal" },
        { symbol, marketType, timeframe: "5m", indicator: "macd_histogram" },
        {
          symbol,
          marketType,
          timeframe: "15m",
          indicator: "ema",
          params: { period: 20 },
        },
        {
          symbol,
          marketType,
          timeframe: "15m",
          indicator: "ema",
          params: { period: 50 },
        },
        {
          symbol,
          marketType,
          timeframe: "5m",
          indicator: "pct_change",
          params: { period: 3 },
        },
      );
    }
    return refs;
  }

  async buildIndicatorSnapshot(
    details: NotificationDetails,
    defaultReferences: IndicatorReference[],
  ): Promise<unknown[]> {
    let indicatorSnapshot: unknown[] = [];

    if (details.aiContext?.expression) {
      indicatorEngine.registerExpression(details.aiContext.expression);
      indicatorEngine.registerReferences(defaultReferences);
      await indicatorEngine.refreshSubscribedSymbols();
      const expressionSnapshot = await indicatorEngine.getExpressionSnapshot(
        details.aiContext.expression,
      );
      const defaultSnapshot =
        await indicatorEngine.getSnapshotForReferences(defaultReferences);
      const merged = new Map<string, unknown>();
      for (const entry of [...expressionSnapshot, ...defaultSnapshot]) {
        merged.set(
          `${entry.marketType}:${entry.symbol}:${entry.timeframe}:${entry.indicator}:${entry.period ?? ""}`,
          entry,
        );
      }
      indicatorSnapshot = [...merged.values()];
    } else if (defaultReferences.length) {
      indicatorEngine.registerReferences(defaultReferences);
      await indicatorEngine.refreshSubscribedSymbols();
      indicatorSnapshot =
        await indicatorEngine.getSnapshotForReferences(defaultReferences);
    }

    return indicatorSnapshot;
  }

  private emptyContext(
    symbol: string,
    market: IndicatorMarket,
  ): MarketDataContext {
    return {
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
  }
}

export const marketContextBuilder = new MarketContextBuilder();
