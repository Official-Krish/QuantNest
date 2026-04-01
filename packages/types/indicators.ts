export type IndicatorTimeframe = "1m" | "5m" | "15m" | "1h";

export type IndicatorMarket = "Indian" | "Crypto";

export type IndicatorKind =
    | "price"
    | "volume"
    | "ema"
    | "sma"
    | "rsi"
    | "pct_change"
    | "macd"
    | "macd_signal"
    | "macd_histogram";

export type IndicatorComparator =
    | ">"
    | ">="
    | "<"
    | "<="
    | "=="
    | "!="
    | "crosses_above"
    | "crosses_below";

export interface IndicatorParams {
    period?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
}

export interface IndicatorReference {
    symbol: string;
    timeframe: IndicatorTimeframe;
    marketType?: IndicatorMarket;
    indicator: IndicatorKind;
    params?: IndicatorParams;
}

export interface IndicatorOperand {
    type: "indicator";
    indicator: IndicatorReference;
}

export interface NumericOperand {
    type: "value";
    value: number;
}

export type ConditionOperand = IndicatorOperand | NumericOperand;

export interface IndicatorConditionClause {
    type: "clause";
    left: ConditionOperand;
    operator: IndicatorComparator;
    right: ConditionOperand;
}

export interface IndicatorConditionGroup {
    type: "group";
    operator: "AND" | "OR";
    conditions: Array<IndicatorConditionClause | IndicatorConditionGroup>;
}

