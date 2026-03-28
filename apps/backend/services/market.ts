import {
    calculateEma,
    calculatePctChange,
    calculateRsi,
    calculateSma,
    calculateVolume,
    getCurrentPrice,
    getHistoricalChart,
    type MarketCandle,
} from '@quantnest-trading/market';

import type {
    ConditionOperand,
    IndicatorComparator,
    IndicatorConditionClause,
    IndicatorConditionGroup,
    IndicatorMarket,
    IndicatorReference,
    IndicatorTimeframe,
} from '@quantnest-trading/types';

export const TIMEFRAME_TO_INTERVAL: Record<IndicatorTimeframe, "1m" | "5m" | "15m" | "1h"> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
};

export const TIMEFRAME_TO_MS: Record<IndicatorTimeframe, number> = {
    "1m": 60_000,
    "5m": 5 * 60_000,
    "15m": 15 * 60_000,
    "1h": 60 * 60_000,
};

export function normalizeMarket(marketType?: string): IndicatorMarket {
    return marketType === "Crypto" || marketType === "web3" ? "Crypto" : "Indian";
}

export function normalizePeriod(period?: number, fallback = 14): number {
    if (!period || !Number.isFinite(period) || period <= 0) {
        return fallback;
    }
    return Math.floor(period);
}

export function refKey(ref: IndicatorReference): string {
    return `${normalizeMarket(ref.marketType)}:${ref.symbol}:${ref.timeframe}:${ref.indicator}:${ref.params?.period || ""}`;
}

export function isGroup(value: IndicatorConditionClause | IndicatorConditionGroup): value is IndicatorConditionGroup {
    return value.type === "group";
}

export function compareValues(left: number, right: number, operator: IndicatorComparator): boolean {
    switch (operator) {
        case ">":
            return left > right;
        case ">=":
            return left >= right;
        case "<":
            return left < right;
        case "<=":
            return left <= right;
        case "==":
            return left === right;
        case "!=":
            return left !== right;
        default:
            return false;
    }
}

export function collectIndicatorReferences(expression: IndicatorConditionGroup): IndicatorReference[] {
    const refs: IndicatorReference[] = [];

    const visitOperand = (operand: ConditionOperand) => {
        if (operand.type === "indicator") {
            refs.push({
                ...operand.indicator,
                marketType: normalizeMarket(operand.indicator.marketType),
            });
        }
    };

    const visitGroup = (group: IndicatorConditionGroup) => {
        group.conditions.forEach((condition) => {
            if (isGroup(condition)) {
                visitGroup(condition);
                return;
            }

            visitOperand(condition.left);
            visitOperand(condition.right);
        });
    };

    visitGroup(expression);

    const unique = new Map<string, IndicatorReference>();
    refs.forEach((ref) => unique.set(refKey(ref), ref));
    return Array.from(unique.values());
}

export async function computeIndicatorValue(
    ref: IndicatorReference,
    historicalCache: Map<string, MarketCandle[]>,
): Promise<number | null> {
    const marketType = normalizeMarket(ref.marketType);
    if (ref.indicator === "price") {
        return getCurrentPrice(ref.symbol, marketType);
    }

    const period = normalizePeriod(ref.params?.period, ref.indicator === "pct_change" ? 1 : 14);
    const candleCacheKey = `${marketType}:${ref.symbol}:${ref.timeframe}:${period}`;

    let candles = historicalCache.get(candleCacheKey);
    if (!candles) {
        const barsToFetch = Math.max(period * 4, 60);
        const period1 = new Date(Date.now() - barsToFetch * TIMEFRAME_TO_MS[ref.timeframe]);
        const historical = await getHistoricalChart(
            ref.symbol,
            marketType,
            period1,
            TIMEFRAME_TO_INTERVAL[ref.timeframe],
        );
        candles = historical.map((bar) => ({
            date: bar.date,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
        }));
        historicalCache.set(candleCacheKey, candles);
    }

    switch (ref.indicator) {
        case "volume":
            return calculateVolume(candles);
        case "sma":
            return calculateSma(candles, period);
        case "ema":
            return calculateEma(candles, period);
        case "rsi":
            return calculateRsi(candles, period);
        case "pct_change":
            return calculatePctChange(candles, period);
        default:
            return null;
    }
}

export async function resolveOperandValue(
    operand: ConditionOperand,
    valueCache: Map<string, number | null>,
    historicalCache: Map<string, MarketCandle[]>,
): Promise<number | null> {
    if (operand.type === "value") {
        return operand.value;
    }

    const ref = {
        ...operand.indicator,
        marketType: normalizeMarket(operand.indicator.marketType),
    };
    const key = refKey(ref);

    if (!valueCache.has(key)) {
        valueCache.set(key, await computeIndicatorValue(ref, historicalCache));
    }

    return valueCache.get(key) ?? null;
}

export async function evaluateExpression(
    expression: IndicatorConditionGroup,
    valueCache: Map<string, number | null>,
    historicalCache: Map<string, MarketCandle[]>,
): Promise<boolean> {
    const outcomes = await Promise.all(
        expression.conditions.map(async (condition) => {
            if (isGroup(condition)) {
                return evaluateExpression(condition, valueCache, historicalCache);
            }

            const left = await resolveOperandValue(condition.left, valueCache, historicalCache);
            const right = await resolveOperandValue(condition.right, valueCache, historicalCache);
            if (left == null || right == null) {
                return false;
            }
            return compareValues(left, right, condition.operator);
        }),
    );

    return expression.operator === "AND" ? outcomes.every(Boolean) : outcomes.some(Boolean);
}