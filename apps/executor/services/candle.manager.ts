import {
  getHistoricalChart,
  type MarketCandle,
} from "@quantnest-trading/market";
import { circuitBreaker } from "./circuit-breaker";
import type {
  IndicatorMarket,
  IndicatorReference,
  IndicatorTimeframe,
} from "@quantnest-trading/types";
import type { Candle, ICandleManager, TickInput } from "./interfaces";

const timeframeMs: Record<IndicatorTimeframe, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  day: 24 * 60 * 60_000,
  "1w": 7 * 24 * 60 * 60_000,
  "1mon": 30 * 24 * 60 * 60_000,
};

const MAX_CANDLES = 1_000;

function toMarketType(market?: string): IndicatorMarket {
  if (market === "Crypto" || market === "web3") return "Crypto";
  return "Indian";
}

function normalizeTimeframe(timeframe?: string): IndicatorTimeframe {
  switch (String(timeframe || "").toLowerCase()) {
    case "1d":
    case "d":
    case "day":
      return "day";
    case "1wk":
    case "wk":
    case "week":
    case "1w":
      return "1w";
    case "1mo":
    case "mo":
    case "month":
    case "1mon":
      return "1mon";
    case "1m":
    case "5m":
    case "15m":
    case "1h":
      return timeframe as IndicatorTimeframe;
    default:
      return "5m";
  }
}

function normalizePeriod(value: number | undefined, fallback: number): number {
  if (!value || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function timeframeToChartInterval(
  timeframe: IndicatorTimeframe,
): "1m" | "5m" | "15m" | "1h" | "1d" | "1wk" | "1mo" {
  switch (timeframe) {
    case "1m":
      return "1m";
    case "5m":
      return "5m";
    case "15m":
      return "15m";
    case "1h":
      return "1h";
    case "day":
      return "1d";
    case "1w":
      return "1wk";
    case "1mon":
      return "1mo";
    default:
      return "5m";
  }
}

export type CandleClosedCallback = (
  marketType: string,
  symbol: string,
  timeframe: IndicatorTimeframe,
  closeTime: number,
) => void;

export class CandleManager implements ICandleManager {
  onCandleClosed: CandleClosedCallback | null = null;

  private readonly candles = new Map<string, Candle[]>();
  private readonly activeCandles = new Map<string, Candle>();
  readonly subscriptions = new Map<string, IndicatorReference>();

  registerReferences(references: IndicatorReference[]): void {
    for (const ref of references) {
      this.subscriptions.set(this.referenceKey(ref), {
        ...ref,
        marketType: toMarketType(ref.marketType),
        timeframe: normalizeTimeframe(ref.timeframe),
      });
    }
  }

  async refreshSubscribedSymbols(): Promise<void> {
    const uniqueRefs = new Map<
      string,
      {
        symbol: string;
        marketType: IndicatorMarket;
        timeframe: IndicatorTimeframe;
        maxPeriod: number;
      }
    >();
    for (const ref of this.subscriptions.values()) {
      const marketType = toMarketType(ref.marketType);
      const key = `${marketType}:${ref.symbol}:${ref.timeframe}`;
      const period = normalizePeriod(ref.params?.period, 14);
      const existing = uniqueRefs.get(key);
      uniqueRefs.set(key, {
        symbol: ref.symbol,
        marketType,
        timeframe: ref.timeframe,
        maxPeriod: Math.max(existing?.maxPeriod ?? 0, period),
      });
    }
    for (const entry of uniqueRefs.values()) {
      try {
        await this.hydrateSeries(
          entry.symbol,
          entry.marketType,
          entry.timeframe,
          entry.maxPeriod,
        );
      } catch (error) {
        console.error(
          `Failed to refresh symbol ${entry.symbol} (${entry.timeframe})`,
          error,
        );
      }
    }
  }

  async fetchCandles(
    symbol: string,
    market: IndicatorMarket,
    timeframe: IndicatorTimeframe,
    from: Date,
    to?: Date,
  ): Promise<Candle[]> {
    const barsBack = Math.max(
      120,
      Math.ceil((Date.now() - from.getTime()) / timeframeMs[timeframe]) + 10,
    );
    const period = new Date(Date.now() - timeframeMs[timeframe] * barsBack);
    const interval = timeframeToChartInterval(timeframe);
    const chart = await getHistoricalChart(
      symbol,
      market,
      to ? from : period,
      interval,
    );
    return chart
      .filter((bar: MarketCandle) => Number.isFinite(bar.close))
      .map((bar: MarketCandle) => {
        if (!bar.date) return null;
        const startTime = bar.date.getTime();
        return {
          startTime,
          endTime: startTime + timeframeMs[timeframe],
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        } satisfies Candle;
      })
      .filter((c): c is Candle => c !== null)
      .slice(-MAX_CANDLES);
  }

  invalidate(symbol: string, market: IndicatorMarket): void {
    for (const key of this.candles.keys()) {
      if (key.startsWith(`${toMarketType(market)}:${symbol}:`)) {
        this.candles.delete(key);
        this.activeCandles.delete(key);
      }
    }
  }

  clear(): void {
    this.candles.clear();
    this.activeCandles.clear();
  }

  ingestTick(input: TickInput): void {
    const timestamp = input.timestamp || Date.now();
    const marketType = toMarketType(input.marketType);
    const refs = this.getSubscriptionsForSymbol(input.symbol, marketType);
    const timeframes = [...new Set(refs.map((ref) => ref.timeframe))];

    for (const timeframe of timeframes) {
      const tfMs = timeframeMs[timeframe];
      const bucketStart = Math.floor(timestamp / tfMs) * tfMs;
      const bucketEnd = bucketStart + tfMs;
      const candleKey = this.candleKey(marketType, input.symbol, timeframe);
      const current = this.activeCandles.get(candleKey);

      if (!current || current.startTime !== bucketStart) {
        if (current) {
          this.pushClosedCandle(candleKey, current);
          this.onCandleClosed?.(
            marketType,
            input.symbol,
            timeframe,
            current.endTime,
          );
        }
        this.activeCandles.set(candleKey, {
          startTime: bucketStart,
          endTime: bucketEnd,
          open: input.price,
          high: input.price,
          low: input.price,
          close: input.price,
          volume: input.volume || 0,
        });
        continue;
      }

      current.high = Math.max(current.high, input.price);
      current.low = Math.min(current.low, input.price);
      current.close = input.price;
      current.volume += input.volume || 0;
    }
  }

  getCandleSeries(
    marketType: string,
    symbol: string,
    timeframe: IndicatorTimeframe,
  ): Candle[] {
    const key = this.candleKey(marketType, symbol, timeframe);
    const history = this.candles.get(key) || [];
    const active = this.activeCandles.get(key);
    return active ? [...history, active] : [...history];
  }

  private getSubscriptionsForSymbol(
    symbol: string,
    marketType: IndicatorMarket,
  ): IndicatorReference[] {
    return [...this.subscriptions.values()].filter(
      (ref) =>
        ref.symbol === symbol && toMarketType(ref.marketType) === marketType,
    );
  }

  private async hydrateSeries(
    symbol: string,
    marketType: IndicatorMarket,
    timeframe: IndicatorTimeframe,
    maxPeriod: number,
  ): Promise<void> {
    const key = this.candleKey(marketType, symbol, timeframe);
    const barsBack = Math.max(maxPeriod * 4, 120);
    const period1 = new Date(Date.now() - timeframeMs[timeframe] * barsBack);
    const interval = timeframeToChartInterval(timeframe);
    const chart = await circuitBreaker.wrap("market-data", () =>
      getHistoricalChart(symbol, marketType, period1, interval),
    );

    if (!chart.length) return;

    const candles = chart
      .filter((bar: MarketCandle) => Number.isFinite(bar.close))
      .map((bar: MarketCandle) => {
        if (!bar.date) return null;
        const startTime = bar.date.getTime();
        return {
          startTime,
          endTime: startTime + timeframeMs[timeframe],
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        } satisfies Candle;
      })
      .filter((candle): candle is Candle => candle !== null)
      .slice(-MAX_CANDLES);

    this.candles.set(key, candles);
    this.activeCandles.delete(key);
  }

  private pushClosedCandle(key: string, candle: Candle): void {
    const history = this.candles.get(key) || [];
    history.push(candle);
    if (history.length > MAX_CANDLES) history.shift();
    this.candles.set(key, history);
  }

  private candleKey(
    marketType: string,
    symbol: string,
    timeframe: IndicatorTimeframe,
  ): string {
    return `${toMarketType(marketType)}:${symbol}:${timeframe}`;
  }

  private referenceKey(ref: IndicatorReference): string {
    const timeframe = normalizeTimeframe(ref.timeframe);
    return `${toMarketType(ref.marketType)}:${ref.symbol}:${timeframe}:${ref.indicator}:${ref.params?.period || ""}`;
  }
}

export { toMarketType, normalizeTimeframe, normalizePeriod, timeframeMs };
