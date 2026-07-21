import type {
  IndicatorConditionGroup,
  IndicatorMarket,
  IndicatorSnapshotEntry,
  IndicatorTimeframe,
} from "@quantnest-trading/types";

export interface Candle {
  startTime: number;
  endTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickInput {
  symbol: string;
  marketType: IndicatorMarket;
  price: number;
  volume?: number;
  timestamp?: number;
}

export interface ICandleManager {
  fetchCandles(
    symbol: string,
    market: IndicatorMarket,
    timeframe: IndicatorTimeframe,
    from: Date,
    to?: Date,
  ): Promise<Candle[]>;
  invalidate(symbol: string, market: IndicatorMarket): void;
  clear(): void;
}

export interface IIndicatorCalculator {
  calculateSma(candles: Candle[], period: number): number | null;
  calculateEma(candles: Candle[], period: number): number | null;
  calculateRsi(candles: Candle[], period: number): number | null;
  calculateMacd(candles: Candle[]): {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  calculateVolume(candles: Candle[]): number | null;
  calculatePctChange(current: number, previous: number): number;
  calculatePrice(candles: Candle[]): number | null;
}

export interface IExpressionEvaluator {
  registerExpression(expression: IndicatorConditionGroup): void;
  evaluateExpression(expression: IndicatorConditionGroup): Promise<boolean>;
  getExpressionSnapshot(
    expression: IndicatorConditionGroup,
  ): Promise<IndicatorSnapshotEntry[]>;
}

export interface IIndicatorCache {
  getCandles(
    symbol: string,
    market: IndicatorMarket,
    timeframe: string,
  ): Candle[] | undefined;
  setCandles(
    symbol: string,
    market: IndicatorMarket,
    timeframe: string,
    candles: Candle[],
  ): void;
  invalidate(symbol?: string, market?: IndicatorMarket): void;
}
