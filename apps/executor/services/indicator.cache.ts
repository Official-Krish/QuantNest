import type {
  IndicatorMarket,
  IndicatorReference,
} from "@quantnest-trading/types";
import type { Candle, IIndicatorCache } from "./interfaces";

export interface CachedIndicatorValue {
  value: number;
  updatedAt: number;
  candleCloseTime: number;
}

function normalizeParams(ref: IndicatorReference): string {
  const params = ref.params || {};
  const keys = Object.keys(params).sort();
  return keys
    .map((key) => `${key}:${(params as Record<string, unknown>)[key]}`)
    .join("|");
}

export function getIndicatorCacheKey(ref: IndicatorReference): string {
  const market = ref.marketType || "Indian";
  return `${market}:${ref.symbol}:${ref.timeframe}:${ref.indicator}:${normalizeParams(ref)}`;
}

export class IndicatorCache implements IIndicatorCache {
  private readonly indicatorStore = new Map<string, CachedIndicatorValue>();
  private readonly candleStore = new Map<string, Candle[]>();

  get(ref: IndicatorReference): CachedIndicatorValue | undefined {
    return this.indicatorStore.get(getIndicatorCacheKey(ref));
  }

  set(ref: IndicatorReference, value: CachedIndicatorValue): void {
    this.indicatorStore.set(getIndicatorCacheKey(ref), value);
  }

  getCandles(
    symbol: string,
    market: IndicatorMarket,
    timeframe: string,
  ): Candle[] | undefined {
    return this.candleStore.get(`${market}:${symbol}:${timeframe}`);
  }

  setCandles(
    symbol: string,
    market: IndicatorMarket,
    timeframe: string,
    candles: Candle[],
  ): void {
    this.candleStore.set(`${market}:${symbol}:${timeframe}`, candles);
  }

  invalidate(symbol?: string, market?: IndicatorMarket): void {
    if (!symbol && !market) {
      this.indicatorStore.clear();
      this.candleStore.clear();
      return;
    }
    const prefix = `${market || ""}:${symbol || ""}`;
    for (const key of this.indicatorStore.keys()) {
      if (key.startsWith(prefix)) this.indicatorStore.delete(key);
    }
    for (const key of this.candleStore.keys()) {
      if (key.startsWith(prefix)) this.candleStore.delete(key);
    }
  }
}

export const indicatorCache = new IndicatorCache();
