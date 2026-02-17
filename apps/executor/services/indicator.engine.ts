import type {
    ConditionOperand,
    IndicatorComparator,
    IndicatorConditionClause,
    IndicatorConditionGroup,
    IndicatorMarket,
    IndicatorReference,
    IndicatorTimeframe,
} from "@n8n-trading/types";
import { getCurrentPrice } from "./price.service";
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

interface RsiState {
    prevClose: number;
    avgGain: number;
    avgLoss: number;
}

interface TickInput {
    symbol: string;
    marketType: IndicatorMarket;
    price: number;
    volume?: number;
    timestamp?: number;
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
    private readonly rsiStates = new Map<string, RsiState>();

    registerExpression(expression?: IndicatorConditionGroup): void {
        if (!expression) {
            return;
        }
        this.collectIndicators(expression).forEach((ref) => {
            this.subscriptions.set(this.referenceKey(ref), ref);
        });
    }

    async refreshSubscribedSymbols(): Promise<void> {
        const uniqueSymbols = new Map<string, { symbol: string; marketType: IndicatorMarket }>();
        for (const ref of this.subscriptions.values()) {
            const marketType = toMarketType(ref.marketType);
            uniqueSymbols.set(`${marketType}:${ref.symbol}`, { symbol: ref.symbol, marketType });
        }

        for (const entry of uniqueSymbols.values()) {
            try {
                const price = await getCurrentPrice(entry.symbol, entry.marketType);
                this.ingestTick({
                    symbol: entry.symbol,
                    marketType: entry.marketType,
                    price,
                    timestamp: Date.now(),
                });
            } catch (error) {
                console.error(`Failed to refresh symbol ${entry.symbol}`, error);
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

    private async evaluateClause(clause: IndicatorConditionClause): Promise<boolean> {
        const left = await this.resolveOperand(clause.left);
        const right = await this.resolveOperand(clause.right);
        if (left == null || right == null) {
            return false;
        }
        return compareValues(left, right, clause.operator);
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
            const price = await getCurrentPrice(ref.symbol, marketType);
            this.ingestTick({
                symbol: ref.symbol,
                marketType,
                price,
                timestamp: Date.now(),
            });
            return this.computeFromHistory(ref);
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
        const history = this.candles.get(this.candleKey(marketType, ref.symbol, ref.timeframe)) || [];
        if (history.length === 0) {
            return null;
        }

        const period = normalizePeriod(ref.params?.period, 14);
        const closes = history.map((candle) => candle.close);

        switch (ref.indicator) {
            case "price":
                return closes[closes.length - 1] ?? null;
            case "volume":
                return history[history.length - 1]?.volume ?? null;
            case "sma":
                if (closes.length < period) {
                    return null;
                }
                return average(closes.slice(-period));
            case "ema": {
                if (closes.length < period) {
                    return null;
                }
                const prev = indicatorCache.get(ref)?.value;
                const alpha = 2 / (period + 1);
                if (prev == null) {
                    return average(closes.slice(-period));
                }
                const close = closes[closes.length - 1];
                if (close == null) {
                    return null;
                }
                return prev + alpha * (close - prev);
            }
            case "rsi":
                return this.computeRsi(ref, closes, period);
            case "pct_change": {
                if (closes.length <= period) {
                    return null;
                }
                const prevClose = closes[closes.length - 1 - period];
                if (prevClose === 0) {
                    return null;
                }
                const close = closes[closes.length - 1];
                if (close == null || prevClose == null) {
                    return null;
                }
                return ((close - prevClose) / prevClose) * 100;
            }
            default:
                return null;
        }
    }

    private computeRsi(ref: IndicatorReference, closes: number[], period: number): number | null {
        if (closes.length <= period) {
            return null;
        }

        const key = this.referenceKey(ref);
        const close = closes[closes.length - 1];
        if (close == null) {
            return null;
        }
        const existing = this.rsiStates.get(key);

        if (existing) {
            const change = close - existing.prevClose;
            const gain = Math.max(change, 0);
            const loss = Math.max(-change, 0);
            const avgGain = (existing.avgGain * (period - 1) + gain) / period;
            const avgLoss = (existing.avgLoss * (period - 1) + loss) / period;

            this.rsiStates.set(key, { prevClose: close, avgGain, avgLoss });
            return rsiFromAverages(avgGain, avgLoss);
        }

        let gains = 0;
        let losses = 0;
        const start = closes.length - period - 1;
        for (let i = start + 1; i < closes.length; i++) {
            const currentClose = closes[i];
            const previousClose = closes[i - 1];
            if (currentClose == null || previousClose == null) {
                continue;
            }
            const delta = currentClose - previousClose;
            if (delta >= 0) {
                gains += delta;
            } else {
                losses += Math.abs(delta);
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        this.rsiStates.set(key, { prevClose: close, avgGain, avgLoss });
        return rsiFromAverages(avgGain, avgLoss);
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
}

function average(values: number[]): number {
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
}

function rsiFromAverages(avgGain: number, avgLoss: number): number {
    if (avgLoss === 0) {
        return 100;
    }
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
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
