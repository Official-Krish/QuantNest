import type {
    ConditionOperand,
    IndicatorComparator,
    IndicatorConditionClause,
    IndicatorConditionGroup,
    IndicatorMarket,
    IndicatorReference,
    IndicatorTimeframe,
} from "@quantnest-trading/types";
import {
    calculateEma,
    calculatePctChange,
    calculatePrice,
    calculateRsi,
    calculateSma,
    calculateVolume,
    getCurrentPrice,
    getHistoricalChart,
    type MarketCandle,
} from "@quantnest-trading/market";
import { indicatorCache } from "./indicator.cache";

interface Candle {
    startTime: number;
    endTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface TickInput {
    symbol: string;
    marketType: IndicatorMarket;
    price: number;
    volume?: number;
    timestamp?: number;
}

export interface IndicatorSnapshotEntry {
    symbol: string;
    marketType: IndicatorMarket;
    timeframe: IndicatorTimeframe;
    indicator: string;
    period?: number;
    value: number | null;
}

const timeframeMs: Record<IndicatorTimeframe, number> = {
    "1m": 60_000,
    "5m": 5 * 60_000,
    "15m": 15 * 60_000,
    "1h": 60 * 60_000,
};

const MAX_CANDLES = 1_000;

function toMarketType(market?: string): IndicatorMarket {
    if (market === "Crypto" || market === "web3") {
        return "Crypto";
    }
    return "Indian";
}

function normalizePeriod(value: number | undefined, fallback: number): number {
    if (!value || !Number.isFinite(value) || value <= 0) {
        return fallback;
    }
    return Math.floor(value);
}

function isGroup(value: IndicatorConditionClause | IndicatorConditionGroup): value is IndicatorConditionGroup {
    return value.type === "group";
}

export class IndicatorEngine {
    private readonly candles = new Map<string, Candle[]>();
    private readonly activeCandles = new Map<string, Candle>();
    private readonly subscriptions = new Map<string, IndicatorReference>();

    registerExpression(expression?: IndicatorConditionGroup): void {
        if (!expression) {
            return;
        }
        this.collectIndicators(expression).forEach((ref) => {
            this.subscriptions.set(this.referenceKey(ref), ref);
        });
    }

    registerReferences(references: IndicatorReference[]): void {
        references.forEach((ref) => {
            this.subscriptions.set(this.referenceKey(ref), {
                ...ref,
                marketType: toMarketType(ref.marketType),
            });
        });
    }

    async refreshSubscribedSymbols(): Promise<void> {
        const uniqueRefs = new Map<
            string,
            { symbol: string; marketType: IndicatorMarket; timeframe: IndicatorTimeframe; maxPeriod: number }
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
                await this.hydrateSeries(entry.symbol, entry.marketType, entry.timeframe, entry.maxPeriod);
            } catch (error) {
                console.error(`Failed to refresh symbol ${entry.symbol} (${entry.timeframe})`, error);
            }
        }
    }

    ingestTick(input: TickInput): void {
        const timestamp = input.timestamp || Date.now();
        const refs = this.getSubscriptionsForSymbol(input.symbol, input.marketType);
        const timeframes = [...new Set(refs.map((ref) => ref.timeframe))];

        for (const timeframe of timeframes) {
            const tfMs = timeframeMs[timeframe];
            const bucketStart = Math.floor(timestamp / tfMs) * tfMs;
            const bucketEnd = bucketStart + tfMs;
            const candleKey = this.candleKey(input.marketType, input.symbol, timeframe);
            const current = this.activeCandles.get(candleKey);

            if (!current || current.startTime !== bucketStart) {
                if (current) {
                    this.pushClosedCandle(candleKey, current);
                    this.updateIndicatorsForCandle(input.marketType, input.symbol, timeframe, current.endTime);
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

    async evaluateExpression(expression: IndicatorConditionGroup): Promise<boolean> {
        const outcomes = await Promise.all(
            expression.conditions.map(async (condition) => {
                if (isGroup(condition)) {
                    return this.evaluateExpression(condition);
                }
                return this.evaluateClause(condition);
            }),
        );

        if (expression.operator === "AND") {
            return outcomes.every(Boolean);
        }
        return outcomes.some(Boolean);
    }

    async getExpressionSnapshot(expression: IndicatorConditionGroup): Promise<IndicatorSnapshotEntry[]> {
        const refs = this.collectIndicators(expression);
        return this.getSnapshotForReferences(refs);
    }

    async getSnapshotForReferences(references: IndicatorReference[]): Promise<IndicatorSnapshotEntry[]> {
        const uniqueRefs = new Map<string, IndicatorReference>();
        references.forEach((ref) => {
            uniqueRefs.set(this.referenceKey(ref), ref);
        });

        const snapshot: IndicatorSnapshotEntry[] = [];
        for (const ref of uniqueRefs.values()) {
            const value = await this.resolveOperand({
                type: "indicator",
                indicator: ref,
            });
            snapshot.push({
                symbol: ref.symbol,
                marketType: toMarketType(ref.marketType),
                timeframe: ref.timeframe,
                indicator: ref.indicator,
                period: ref.params?.period,
                value,
            });
        }

        return snapshot;
    }

    private async evaluateClause(clause: IndicatorConditionClause): Promise<boolean> {
        if (clause.operator === "crosses_above" || clause.operator === "crosses_below") {
            const leftPair = await this.resolveOperandPair(clause.left);
            const rightPair = await this.resolveOperandPair(clause.right);

            if (
                leftPair.current == null ||
                leftPair.previous == null ||
                rightPair.current == null ||
                rightPair.previous == null
            ) {
                return false;
            }

            if (clause.operator === "crosses_above") {
                return leftPair.previous <= rightPair.previous && leftPair.current > rightPair.current;
            }

            return leftPair.previous >= rightPair.previous && leftPair.current < rightPair.current;
        }

        const left = await this.resolveOperand(clause.left);
        const right = await this.resolveOperand(clause.right);
        if (left == null || right == null) {
            return false;
        }
        return compareValues(left, right, clause.operator);
    }

    private async resolveOperandPair(operand: ConditionOperand): Promise<{ current: number | null; previous: number | null }> {
        if (operand.type === "value") {
            return {
                current: operand.value,
                previous: operand.value,
            };
        }

        await this.resolveOperand(operand);

        const ref: IndicatorReference = {
            ...operand.indicator,
            marketType: toMarketType(operand.indicator.marketType),
        };

        return this.computeFromHistoryPair(ref);
    }

    private async resolveOperand(operand: ConditionOperand): Promise<number | null> {
        if (operand.type === "value") {
            return operand.value;
        }

        const ref: IndicatorReference = {
            ...operand.indicator,
            marketType: toMarketType(operand.indicator.marketType),
        };

        const cached = indicatorCache.get(ref);
        if (cached) {
            return cached.value;
        }

        const computed = this.computeFromHistory(ref);
        if (computed != null) {
            indicatorCache.set(ref, {
                value: computed,
                updatedAt: Date.now(),
                candleCloseTime: Date.now(),
            });
            return computed;
        }

        try {
            const marketType = toMarketType(ref.marketType);
            const period = normalizePeriod(ref.params?.period, 14);
            await this.hydrateSeries(ref.symbol, marketType, ref.timeframe, period);

            const hydrated = this.computeFromHistory(ref);
            if (hydrated != null) {
                indicatorCache.set(ref, {
                    value: hydrated,
                    updatedAt: Date.now(),
                    candleCloseTime: Date.now(),
                });
                return hydrated;
            }

            if (ref.indicator !== "price") {
                return null;
            }

            const price = await getCurrentPrice(ref.symbol, marketType);
            this.ingestTick({
                symbol: ref.symbol,
                marketType,
                price,
                timestamp: Date.now(),
            });

            const livePrice = this.computeFromHistory(ref);
            if (livePrice != null) {
                indicatorCache.set(ref, {
                    value: livePrice,
                    updatedAt: Date.now(),
                    candleCloseTime: Date.now(),
                });
            }
            return livePrice;
        } catch {
            return null;
        }
    }

    private updateIndicatorsForCandle(marketType: string, symbol: string, timeframe: IndicatorTimeframe, candleCloseTime: number): void {
        const refs = [...this.subscriptions.values()].filter((ref) => {
            return (
                toMarketType(ref.marketType) === toMarketType(marketType) &&
                ref.symbol === symbol &&
                ref.timeframe === timeframe
            );
        });

        for (const ref of refs) {
            const value = this.computeFromHistory(ref);
            if (value == null || Number.isNaN(value)) {
                continue;
            }
            indicatorCache.set(ref, {
                value,
                updatedAt: Date.now(),
                candleCloseTime,
            });
        }
    }

    private computeFromHistory(ref: IndicatorReference): number | null {
        const marketType = toMarketType(ref.marketType);
        const key = this.candleKey(marketType, ref.symbol, ref.timeframe);
        const history = this.candles.get(key) || [];
        const active = this.activeCandles.get(key);
        const series = active ? [...history, active] : history;

        return this.computeFromSeries(ref, series);
    }

    private computeFromHistoryPair(ref: IndicatorReference): { current: number | null; previous: number | null } {
        const marketType = toMarketType(ref.marketType);
        const key = this.candleKey(marketType, ref.symbol, ref.timeframe);
        const history = this.candles.get(key) || [];
        const active = this.activeCandles.get(key);
        const series = active ? [...history, active] : history;

        const current = this.computeFromSeries(ref, series);
        const previous = series.length > 1
            ? this.computeFromSeries(ref, series.slice(0, -1))
            : null;

        return { current, previous };
    }

    private computeFromSeries(ref: IndicatorReference, series: Candle[]): number | null {
        if (series.length === 0) {
            return null;
        }

        const period = normalizePeriod(ref.params?.period, 14);
        const marketCandles: MarketCandle[] = series.map((candle) => ({
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
        }));

        switch (ref.indicator) {
            case "price":
                return calculatePrice(marketCandles);
            case "volume":
                return calculateVolume(marketCandles);
            case "sma":
                return calculateSma(marketCandles, period);
            case "ema":
                return calculateEma(marketCandles, period);
            case "rsi":
                return calculateRsi(marketCandles, period);
            case "pct_change":
                return calculatePctChange(marketCandles, period);
            default:
                return null;
        }
    }

    private collectIndicators(group: IndicatorConditionGroup): IndicatorReference[] {
        const refs: IndicatorReference[] = [];
        for (const condition of group.conditions) {
            if (isGroup(condition)) {
                refs.push(...this.collectIndicators(condition));
                continue;
            }
            [condition.left, condition.right].forEach((operand) => {
                if (operand.type === "indicator") {
                    refs.push({
                        ...operand.indicator,
                        marketType: toMarketType(operand.indicator.marketType),
                    });
                }
            });
        }
        return refs;
    }

    private getSubscriptionsForSymbol(symbol: string, marketType: IndicatorMarket): IndicatorReference[] {
        return [...this.subscriptions.values()].filter((ref) => {
            return ref.symbol === symbol && toMarketType(ref.marketType) === toMarketType(marketType);
        });
    }

    private candleKey(marketType: string, symbol: string, timeframe: IndicatorTimeframe): string {
        return `${toMarketType(marketType)}:${symbol}:${timeframe}`;
    }

    private referenceKey(ref: IndicatorReference): string {
        return `${toMarketType(ref.marketType)}:${ref.symbol}:${ref.timeframe}:${ref.indicator}:${ref.params?.period || ""}`;
    }

    private pushClosedCandle(key: string, candle: Candle): void {
        const history = this.candles.get(key) || [];
        history.push(candle);
        if (history.length > MAX_CANDLES) {
            history.shift();
        }
        this.candles.set(key, history);
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
        const chart = await getHistoricalChart(symbol, marketType, period1, interval);

        if (!chart.length) {
            return;
        }

        const candles = chart
            .filter((bar: MarketCandle) => Number.isFinite(bar.close))
            .map((bar: MarketCandle) => {
                if (!bar.date) {
                    return null;
                }
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
}

function timeframeToChartInterval(timeframe: IndicatorTimeframe): "1m" | "5m" | "15m" | "1h" {
    switch (timeframe) {
        case "1m":
            return "1m";
        case "5m":
            return "5m";
        case "15m":
            return "15m";
        case "1h":
            return "1h";
        default:
            return "5m";
    }
}

function compareValues(left: number, right: number, operator: IndicatorComparator): boolean {
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

export const indicatorEngine = new IndicatorEngine();
