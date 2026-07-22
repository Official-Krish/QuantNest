import type {
  IndicatorConditionGroup,
  IndicatorReference,
  IndicatorSnapshotEntry,
} from "@quantnest-trading/types";
import { CandleManager } from "./candle.manager";
import { ExpressionEvaluator } from "./expression.evaluator";
import { IndicatorCache, indicatorCache } from "./indicator.cache";
import { IndicatorCalculator } from "./indicator.calculator";
import type { TickInput } from "./interfaces";

export class IndicatorEngine {
  readonly candleManager: CandleManager;
  readonly calculator: IndicatorCalculator;
  readonly evaluator: ExpressionEvaluator;
  readonly cache: IndicatorCache;

  constructor() {
    this.cache = indicatorCache;
    this.candleManager = new CandleManager();
    this.calculator = new IndicatorCalculator();
    this.evaluator = new ExpressionEvaluator(
      this.candleManager,
      this.calculator,
      this.cache,
    );

    this.candleManager.onCandleClosed = (
      marketType,
      symbol,
      timeframe,
      closeTime,
    ) => {
      this.evaluator.updateCachedIndicators(
        marketType,
        symbol,
        timeframe,
        closeTime,
      );
    };
  }

  registerExpression(expression?: IndicatorConditionGroup): void {
    this.evaluator.registerExpression(expression);
  }

  registerReferences(references: IndicatorReference[]): void {
    this.candleManager.registerReferences(references);
  }

  async refreshSubscribedSymbols(): Promise<void> {
    await this.candleManager.refreshSubscribedSymbols();
  }

  ingestTick(input: TickInput): void {
    this.candleManager.ingestTick(input);
  }

  async evaluateExpression(
    expression: IndicatorConditionGroup,
  ): Promise<boolean> {
    return this.evaluator.evaluateExpression(expression);
  }

  async getExpressionSnapshot(
    expression: IndicatorConditionGroup,
  ): Promise<IndicatorSnapshotEntry[]> {
    return this.evaluator.getExpressionSnapshot(expression);
  }

  async getSnapshotForReferences(
    references: IndicatorReference[],
  ): Promise<IndicatorSnapshotEntry[]> {
    return this.evaluator.getSnapshotForReferences(references);
  }
}

export const indicatorEngine = new IndicatorEngine();
