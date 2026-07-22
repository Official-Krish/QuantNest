import { getCurrentPrice } from "@quantnest-trading/market";
import type {
  ConditionOperand,
  IndicatorConditionClause,
  IndicatorConditionGroup,
  IndicatorMarket,
  IndicatorReference,
  IndicatorSnapshotEntry,
  IndicatorTimeframe,
} from "@quantnest-trading/types";
import type { CandleManager } from "./candle.manager";
import type { IndicatorCalculator } from "./indicator.calculator";
import type { IndicatorCache } from "./indicator.cache";

interface NormalizedRef extends IndicatorReference {
  marketType: IndicatorMarket;
  timeframe: IndicatorTimeframe;
}

export class ExpressionEvaluator {
  private readonly subscriptions = new Map<string, NormalizedRef>();

  constructor(
    private readonly candleManager: CandleManager,
    private readonly calculator: IndicatorCalculator,
    private readonly indicatorCache: IndicatorCache,
  ) {}

  registerExpression(expression?: IndicatorConditionGroup): void {
    if (!expression) return;
    for (const ref of this.collectIndicators(expression)) {
      this.subscriptions.set(this.referenceKey(ref), ref);
      this.candleManager.registerReferences([ref]);
    }
  }

  async evaluateExpression(
    expression: IndicatorConditionGroup,
  ): Promise<boolean> {
    const outcomes = await Promise.all(
      expression.conditions.map(async (condition) => {
        if (isGroup(condition)) return this.evaluateExpression(condition);
        return this.evaluateClause(condition);
      }),
    );
    if (expression.operator === "AND") return outcomes.every(Boolean);
    return outcomes.some(Boolean);
  }

  async getExpressionSnapshot(
    expression: IndicatorConditionGroup,
  ): Promise<IndicatorSnapshotEntry[]> {
    const refs = this.collectIndicators(expression);
    return this.getSnapshotForReferences(refs);
  }

  async getSnapshotForReferences(
    references: IndicatorReference[],
  ): Promise<IndicatorSnapshotEntry[]> {
    const uniqueRefs = new Map<string, NormalizedRef>();
    for (const ref of references) {
      const normalized = normalizeRef(ref);
      uniqueRefs.set(this.referenceKey(normalized), normalized);
    }
    const snapshot: IndicatorSnapshotEntry[] = [];
    for (const ref of uniqueRefs.values()) {
      const value = await this.resolveOperand({
        type: "indicator",
        indicator: ref,
      });
      snapshot.push({
        symbol: ref.symbol,
        marketType: ref.marketType,
        timeframe: ref.timeframe,
        indicator: ref.indicator,
        period: ref.params?.period,
        value,
      });
    }
    return snapshot;
  }

  updateCachedIndicators(
    marketType: string,
    symbol: string,
    timeframe: IndicatorTimeframe,
    closeTime: number,
  ): void {
    const refs = [...this.subscriptions.values()].filter((ref) => {
      return (
        ref.symbol === symbol &&
        ref.marketType === marketType &&
        ref.timeframe === timeframe
      );
    });
    for (const ref of refs) {
      const series = this.candleManager.getCandleSeries(
        marketType,
        symbol,
        timeframe,
      );
      const value = this.calculator.computeFromSeries(ref, series);
      if (value == null || Number.isNaN(value)) continue;
      this.indicatorCache.set(ref, {
        value,
        updatedAt: Date.now(),
        candleCloseTime: closeTime,
      });
    }
  }

  private async evaluateClause(
    clause: IndicatorConditionClause,
  ): Promise<boolean> {
    if (
      clause.operator === "crosses_above" ||
      clause.operator === "crosses_below"
    ) {
      const leftPair = await this.resolveOperandPair(clause.left);
      const rightPair = await this.resolveOperandPair(clause.right);
      if (
        leftPair.current == null ||
        leftPair.previous == null ||
        rightPair.current == null ||
        rightPair.previous == null
      )
        return false;
      if (clause.operator === "crosses_above")
        return (
          leftPair.previous <= rightPair.previous &&
          leftPair.current > rightPair.current
        );
      return (
        leftPair.previous >= rightPair.previous &&
        leftPair.current < rightPair.current
      );
    }
    const left = await this.resolveOperand(clause.left);
    const right = await this.resolveOperand(clause.right);
    if (left == null || right == null) return false;
    return this.calculator.compareValues(left, right, clause.operator);
  }

  private async resolveOperandPair(
    operand: ConditionOperand,
  ): Promise<{ current: number | null; previous: number | null }> {
    if (operand.type === "value")
      return { current: operand.value, previous: operand.value };
    const ref = normalizeRef(operand.indicator);
    const series = this.candleManager.getCandleSeries(
      ref.marketType,
      ref.symbol,
      ref.timeframe,
    );
    return this.calculator.computeFromHistoryPair(ref, series);
  }

  private async resolveOperand(
    operand: ConditionOperand,
  ): Promise<number | null> {
    if (operand.type === "value") return operand.value;
    const ref = normalizeRef(operand.indicator);
    const cached = this.indicatorCache.get(ref);
    if (cached) return cached.value;
    return this.computeAndCache(ref);
  }

  private async computeAndCache(ref: NormalizedRef): Promise<number | null> {
    const series = this.candleManager.getCandleSeries(
      ref.marketType,
      ref.symbol,
      ref.timeframe,
    );
    const computed = this.calculator.computeFromSeries(ref, series);
    if (computed != null) {
      this.indicatorCache.set(ref, {
        value: computed,
        updatedAt: Date.now(),
        candleCloseTime: Date.now(),
      });
      return computed;
    }
    try {
      await this.candleManager.refreshSubscribedSymbols();
      const freshSeries = this.candleManager.getCandleSeries(
        ref.marketType,
        ref.symbol,
        ref.timeframe,
      );
      const hydrated = this.calculator.computeFromSeries(ref, freshSeries);
      if (hydrated != null) {
        this.indicatorCache.set(ref, {
          value: hydrated,
          updatedAt: Date.now(),
          candleCloseTime: Date.now(),
        });
        return hydrated;
      }
      if (ref.indicator !== "price") return null;
      const price = await getCurrentPrice(ref.symbol, ref.marketType as never);
      this.candleManager.ingestTick({
        symbol: ref.symbol,
        marketType: ref.marketType,
        price,
        timestamp: Date.now(),
      });
      const liveSeries = this.candleManager.getCandleSeries(
        ref.marketType,
        ref.symbol,
        ref.timeframe,
      );
      const livePrice = this.calculator.computeFromSeries(ref, liveSeries);
      if (livePrice != null) {
        this.indicatorCache.set(ref, {
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

  private collectIndicators(group: IndicatorConditionGroup): NormalizedRef[] {
    const refs: NormalizedRef[] = [];
    for (const condition of group.conditions) {
      if (isGroup(condition)) {
        refs.push(...this.collectIndicators(condition));
        continue;
      }
      [condition.left, condition.right].forEach((operand) => {
        if (operand.type === "indicator")
          refs.push(normalizeRef(operand.indicator));
      });
    }
    return refs;
  }

  private referenceKey(ref: NormalizedRef): string {
    return `${ref.marketType}:${ref.symbol}:${ref.timeframe}:${ref.indicator}:${ref.params?.period || ""}`;
  }
}

function isGroup(
  value: IndicatorConditionClause | IndicatorConditionGroup,
): value is IndicatorConditionGroup {
  return value.type === "group";
}

function normalizeRef(ref: IndicatorReference): NormalizedRef {
  const marketType: IndicatorMarket =
    ref.marketType === "Crypto" ? "Crypto" : "Indian";
  const timeframe = normalizeTimeframe(ref.timeframe);
  return { ...ref, marketType, timeframe };
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
