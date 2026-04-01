export interface MarketCandle {
  date?: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function normalizePeriod(period: number | undefined, fallback: number): number {
  if (!period || !Number.isFinite(period) || period <= 0) {
    return fallback;
  }
  return Math.floor(period);
}

export function getCloseSeries(candles: MarketCandle[]): number[] {
  return candles.map((candle) => candle.close).filter((value) => Number.isFinite(value));
}

export function getVolumeSeries(candles: MarketCandle[]): number[] {
  return candles.map((candle) => candle.volume).filter((value) => Number.isFinite(value));
}

export function calculatePrice(candles: MarketCandle[]): number | null {
  return candles[candles.length - 1]?.close ?? null;
}

export function calculateVolume(candles: MarketCandle[]): number | null {
  return candles[candles.length - 1]?.volume ?? null;
}

export function calculateSma(candles: MarketCandle[], period?: number): number | null {
  const normalizedPeriod = normalizePeriod(period, 14);
  const closes = getCloseSeries(candles);
  if (closes.length < normalizedPeriod) {
    return null;
  }
  const slice = closes.slice(-normalizedPeriod);
  const sum = slice.reduce((acc, value) => acc + value, 0);
  return sum / normalizedPeriod;
}

// Calculate SMA series (array of SMA values over time)
export function calculateSmaSeries(candles: MarketCandle[], period?: number): number[] {
  const normalizedPeriod = normalizePeriod(period, 14);
  const closes = getCloseSeries(candles);
  if (closes.length < normalizedPeriod) {
    return [];
  }

  const series: number[] = [];
  for (let i = normalizedPeriod; i <= closes.length; i++) {
    const slice = closes.slice(i - normalizedPeriod, i);
    const sum = slice.reduce((acc, value) => acc + value, 0);
    series.push(sum / normalizedPeriod);
  }
  return series;
}

export function calculateEma(candles: MarketCandle[], period?: number): number | null {
  const normalizedPeriod = normalizePeriod(period, 14);
  const closes = getCloseSeries(candles);
  if (closes.length < normalizedPeriod) {
    return null;
  }

  const multiplier = 2 / (normalizedPeriod + 1);
  let ema = closes.slice(0, normalizedPeriod).reduce((acc, value) => acc + value, 0) / normalizedPeriod;

  for (let i = normalizedPeriod; i < closes.length; i++) {
    const close = closes[i];
    if (close == null) {
      return null;
    }
    ema = (close - ema) * multiplier + ema;
  }

  return ema;
}

// Calculate EMA series (array of EMA values over time)
export function calculateEmaSeries(candles: MarketCandle[], period?: number): number[] {
  const normalizedPeriod = normalizePeriod(period, 14);
  const closes = getCloseSeries(candles);
  if (closes.length < normalizedPeriod) {
    return [];
  }

  const series: number[] = [];
  const multiplier = 2 / (normalizedPeriod + 1);

  // Calculate initial SMA
  let ema = closes.slice(0, normalizedPeriod).reduce((acc, value) => acc + value, 0) / normalizedPeriod;
  series.push(ema);

  // Calculate EMA for remaining candles
  for (let i = normalizedPeriod; i < closes.length; i++) {
    const close = closes[i];
    if (close == null) {
      break;
    }
    ema = (close - ema) * multiplier + ema;
    series.push(ema);
  }

  return series;
}

export function calculatePctChange(candles: MarketCandle[], period?: number): number | null {
  const normalizedPeriod = normalizePeriod(period, 1);
  const closes = getCloseSeries(candles);
  if (closes.length <= normalizedPeriod) {
    return null;
  }

  const latest = closes[closes.length - 1];
  const previous = closes[closes.length - 1 - normalizedPeriod];
  if (latest == null || previous == null || !Number.isFinite(previous) || previous === 0) {
    return null;
  }

  return ((latest - previous) / previous) * 100;
}

// Calculate percentage change series (array of pct change values over time)
export function calculatePctChangeSeries(candles: MarketCandle[], period?: number): number[] {
  const normalizedPeriod = normalizePeriod(period, 1);
  const closes = getCloseSeries(candles);
  if (closes.length <= normalizedPeriod) {
    return [];
  }

  const series: number[] = [];
  for (let i = normalizedPeriod; i < closes.length; i++) {
    const latest = closes[i];
    const previous = closes[i - normalizedPeriod];
    if (latest == null || previous == null || !Number.isFinite(previous) || previous === 0) {
      series.push(0);
      continue;
    }
    series.push(((latest - previous) / previous) * 100);
  }
  return series;
}

export function calculateRsi(candles: MarketCandle[], period?: number): number | null {
  const normalizedPeriod = normalizePeriod(period, 14);
  const closes = getCloseSeries(candles);
  if (closes.length <= normalizedPeriod) {
    return null;
  }

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= normalizedPeriod; i++) {
    const current = closes[i];
    const prior = closes[i - 1];
    if (current == null || prior == null) {
      return null;
    }
    const delta = current - prior;
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / normalizedPeriod;
  let avgLoss = losses / normalizedPeriod;

  for (let i = normalizedPeriod + 1; i < closes.length; i++) {
    const current = closes[i];
    const prior = closes[i - 1];
    if (current == null || prior == null) {
      return null;
    }
    const delta = current - prior;
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    avgGain = (avgGain * (normalizedPeriod - 1) + gain) / normalizedPeriod;
    avgLoss = (avgLoss * (normalizedPeriod - 1) + loss) / normalizedPeriod;
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Calculate RSI series (array of RSI values over time)
export function calculateRsiSeries(candles: MarketCandle[], period?: number): number[] {
  const normalizedPeriod = normalizePeriod(period, 14);
  const closes = getCloseSeries(candles);
  if (closes.length <= normalizedPeriod) {
    return [];
  }

  const series: number[] = [];

  // Initial RSI calculation
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= normalizedPeriod; i++) {
    const current = closes[i];
    const prior = closes[i - 1];
    if (current == null || prior == null) {
      return [];
    }
    const delta = current - prior;
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / normalizedPeriod;
  let avgLoss = losses / normalizedPeriod;

  // Calculate RSI for each subsequent candle
  for (let i = normalizedPeriod + 1; i < closes.length; i++) {
    const current = closes[i];
    const prior = closes[i - 1];
    if (current == null || prior == null) {
      break;
    }
    const delta = current - prior;
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    avgGain = (avgGain * (normalizedPeriod - 1) + gain) / normalizedPeriod;
    avgLoss = (avgLoss * (normalizedPeriod - 1) + loss) / normalizedPeriod;

    if (avgLoss === 0) {
      series.push(100);
    } else {
      const rs = avgGain / avgLoss;
      series.push(100 - 100 / (1 + rs));
    }
  }

  return series;
}

function calculateEmaFromSeries(values: number[], period: number): number[] {
  const normalizedPeriod = normalizePeriod(period, 14);
  if (values.length < normalizedPeriod) {
    return [];
  }

  const multiplier = 2 / (normalizedPeriod + 1);
  const seed = values.slice(0, normalizedPeriod).reduce((acc, value) => acc + value, 0) / normalizedPeriod;
  const emaSeries = [seed];
  let ema = seed;

  for (let i = normalizedPeriod; i < values.length; i++) {
    const value = values[i];
    if (value == null) break;
    ema = (value - ema) * multiplier + ema;
    emaSeries.push(ema);
  }

  return emaSeries;
}

function calculateMacdComponents(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): {
  macdSeries: number[];
  signalSeries: number[];
  histogramSeries: number[];
} {
  const closes = getCloseSeries(candles);
  const normalizedFast = normalizePeriod(fastPeriod, 12);
  const normalizedSlow = normalizePeriod(slowPeriod, 26);
  const normalizedSignal = normalizePeriod(signalPeriod, 9);

  if (closes.length < normalizedSlow) {
    return {
      macdSeries: [],
      signalSeries: [],
      histogramSeries: [],
    };
  }

  const fastEma = calculateEmaFromSeries(closes, normalizedFast);
  const slowEma = calculateEmaFromSeries(closes, normalizedSlow);

  if (!fastEma.length || !slowEma.length) {
    return {
      macdSeries: [],
      signalSeries: [],
      histogramSeries: [],
    };
  }

  const slowSeedIndex = normalizedSlow - 1;
  const macdSeries = closes
    .map((_, idx) => {
      if (idx < slowSeedIndex) return null;
      const fastIndex = idx - (normalizedFast - 1);
      const slowIndex = idx - (normalizedSlow - 1);
      const fastValue = fastEma[fastIndex];
      const slowValue = slowEma[slowIndex];
      if (fastValue == null || slowValue == null) return null;
      if (!Number.isFinite(fastValue) || !Number.isFinite(slowValue)) return null;
      return fastValue - slowValue;
    })
    .filter((value): value is number => value != null);

  const signalSeries = calculateEmaFromSeries(macdSeries, normalizedSignal);
  if (!signalSeries.length) {
    return {
      macdSeries,
      signalSeries: [],
      histogramSeries: [],
    };
  }

  const histogramSeries = macdSeries
    .slice(macdSeries.length - signalSeries.length)
    .map((macd, index) => {
      const signalValue = signalSeries[index];
      if (signalValue == null) return null;
      return macd - signalValue;
    })
    .filter((value): value is number => value != null);

  return {
    macdSeries,
    signalSeries,
    histogramSeries,
  };
}

export function calculateMacd(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number | null {
  const { macdSeries, signalSeries } = calculateMacdComponents(candles, fastPeriod, slowPeriod, signalPeriod);
  if (!macdSeries.length || !signalSeries.length) return null;
  return macdSeries[macdSeries.length - 1] ?? null;
}

export function calculateMacdSignal(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number | null {
  const { signalSeries } = calculateMacdComponents(candles, fastPeriod, slowPeriod, signalPeriod);
  if (!signalSeries.length) return null;
  return signalSeries[signalSeries.length - 1] ?? null;
}

export function calculateMacdHistogram(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number | null {
  const { histogramSeries } = calculateMacdComponents(candles, fastPeriod, slowPeriod, signalPeriod);
  if (!histogramSeries.length) return null;
  return histogramSeries[histogramSeries.length - 1] ?? null;
}

export function calculateMacdSeries(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number[] {
  return calculateMacdComponents(candles, fastPeriod, slowPeriod, signalPeriod).macdSeries;
}

export function calculateMacdSignalSeries(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number[] {
  return calculateMacdComponents(candles, fastPeriod, slowPeriod, signalPeriod).signalSeries;
}

export function calculateMacdHistogramSeries(
  candles: MarketCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): number[] {
  return calculateMacdComponents(candles, fastPeriod, slowPeriod, signalPeriod).histogramSeries;
}
