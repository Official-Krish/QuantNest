import {
  calculateEma as libEma,
  calculateMacd as libMacd,
  calculateMacdHistogram as libMacdHistogram,
  calculateMacdSignal as libMacdSignal,
  calculatePctChange as libPctChange,
  calculatePrice as libPrice,
  calculateRsi as libRsi,
  calculateSma as libSma,
  calculateVolume as libVolume,
  type MarketCandle,
} from "@quantnest-trading/market";
import type {
  IndicatorComparator,
  IndicatorReference,
} from "@quantnest-trading/types";
import type { Candle, IIndicatorCalculator } from "./interfaces";

export class IndicatorCalculator implements IIndicatorCalculator {
  calculateSma(candles: Candle[], period: number): number | null {
    return libSma(toMarketCandles(candles), period);
  }

  calculateEma(candles: Candle[], period: number): number | null {
    return libEma(toMarketCandles(candles), period);
  }

  calculateRsi(candles: Candle[], period: number): number | null {
    return libRsi(toMarketCandles(candles), period);
  }

  calculateMacd(
    candles: Candle[],
    fastPeriod?: number,
    slowPeriod?: number,
    signalPeriod?: number,
  ): number | null {
    return libMacd(
      toMarketCandles(candles),
      fastPeriod,
      slowPeriod,
      signalPeriod,
    );
  }

  calculateMacdSignal(
    candles: Candle[],
    fastPeriod?: number,
    slowPeriod?: number,
    signalPeriod?: number,
  ): number | null {
    return libMacdSignal(
      toMarketCandles(candles),
      fastPeriod,
      slowPeriod,
      signalPeriod,
    );
  }

  calculateMacdHistogram(
    candles: Candle[],
    fastPeriod?: number,
    slowPeriod?: number,
    signalPeriod?: number,
  ): number | null {
    return libMacdHistogram(
      toMarketCandles(candles),
      fastPeriod,
      slowPeriod,
      signalPeriod,
    );
  }

  calculateVolume(candles: Candle[]): number | null {
    return libVolume(toMarketCandles(candles));
  }

  calculatePctChange(candles: Candle[], period?: number): number | null {
    return libPctChange(toMarketCandles(candles), period);
  }

  calculatePrice(candles: Candle[]): number | null {
    return libPrice(toMarketCandles(candles));
  }

  computeFromSeries(ref: IndicatorReference, series: Candle[]): number | null {
    if (series.length === 0) return null;
    const period = normalizePeriod(ref.params?.period, 14);
    const mc = toMarketCandles(series);

    switch (ref.indicator) {
      case "price":
        return libPrice(mc);
      case "volume":
        return libVolume(mc);
      case "sma":
        return libSma(mc, period);
      case "ema":
        return libEma(mc, period);
      case "rsi":
        return libRsi(mc, period);
      case "pct_change":
        return libPctChange(mc, period);
      case "macd":
        return libMacd(
          mc,
          ref.params?.fastPeriod,
          ref.params?.slowPeriod,
          ref.params?.signalPeriod,
        );
      case "macd_signal":
        return libMacdSignal(
          mc,
          ref.params?.fastPeriod,
          ref.params?.slowPeriod,
          ref.params?.signalPeriod,
        );
      case "macd_histogram":
        return libMacdHistogram(
          mc,
          ref.params?.fastPeriod,
          ref.params?.slowPeriod,
          ref.params?.signalPeriod,
        );
      default:
        return null;
    }
  }

  computeFromHistoryPair(
    ref: IndicatorReference,
    series: Candle[],
  ): { current: number | null; previous: number | null } {
    const current = this.computeFromSeries(ref, series);
    const previous =
      series.length > 1
        ? this.computeFromSeries(ref, series.slice(0, -1))
        : null;
    return { current, previous };
  }

  compareValues(
    left: number,
    right: number,
    operator: IndicatorComparator,
  ): boolean {
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
}

function toMarketCandles(candles: Candle[]): MarketCandle[] {
  return candles.map((c) => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

function normalizePeriod(value: number | undefined, fallback: number): number {
  if (!value || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}
