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
        case "crosses_above":
        case "crosses_below":
            return false;
        default:
            return false;
    }
}

async function resolveOperandPair(
    operand: ConditionOperand,
    valueCache: Map<string, number | null>,
    historicalCache: Map<string, MarketCandle[]>,
): Promise<{ current: number | null; previous: number | null }> {
    if (operand.type === "value") {
        return {
            current: operand.value,
            previous: operand.value,
        };
    }

    const ref = {
        ...operand.indicator,
        marketType: normalizeMarket(operand.indicator.marketType),
    };

    const current = await computeIndicatorValue(ref, historicalCache, 0);
    const previous = await computeIndicatorValue(ref, historicalCache, 1);

    valueCache.set(refKey(ref), current);

    return { current, previous };
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
    offsetFromEnd = 0,
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

    const evaluationCandles = offsetFromEnd > 0
        ? candles.slice(0, Math.max(0, candles.length - offsetFromEnd))
        : candles;

    switch (ref.indicator) {
        case "volume":
            return calculateVolume(evaluationCandles);
        case "sma":
            return calculateSma(evaluationCandles, period);
        case "ema":
            return calculateEma(evaluationCandles, period);
        case "rsi":
            return calculateRsi(evaluationCandles, period);
        case "pct_change":
            return calculatePctChange(evaluationCandles, period);
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

            if (condition.operator === "crosses_above" || condition.operator === "crosses_below") {
                const leftPair = await resolveOperandPair(condition.left, valueCache, historicalCache);
                const rightPair = await resolveOperandPair(condition.right, valueCache, historicalCache);

                if (
                    leftPair.current == null ||
                    leftPair.previous == null ||
                    rightPair.current == null ||
                    rightPair.previous == null
                ) {
                    return false;
                }

                if (condition.operator === "crosses_above") {
                    return leftPair.previous <= rightPair.previous && leftPair.current > rightPair.current;
                }

                return leftPair.previous >= rightPair.previous && leftPair.current < rightPair.current;
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