import type { IndicatorReference } from "@n8n-trading/types";

export interface CachedIndicatorValue {
    value: number;
    updatedAt: number;
    candleCloseTime: number;
}

function normalizeParams(ref: IndicatorReference): string {
    const params = ref.params || {};
    const keys = Object.keys(params).sort();
    return keys.map((key) => `${key}:${(params as Record<string, unknown>)[key]}`).join("|");
}

export function getIndicatorCacheKey(ref: IndicatorReference): string {
    const market = ref.marketType || "Indian";
    return `${market}:${ref.symbol}:${ref.timeframe}:${ref.indicator}:${normalizeParams(ref)}`;
}

export class IndicatorCache {
    private readonly store = new Map<string, CachedIndicatorValue>();

    get(ref: IndicatorReference): CachedIndicatorValue | undefined {
        return this.store.get(getIndicatorCacheKey(ref));
    }

    set(ref: IndicatorReference, value: CachedIndicatorValue): void {
        this.store.set(getIndicatorCacheKey(ref), value);
    }
}

export const indicatorCache = new IndicatorCache();

