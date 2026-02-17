import { useEffect, useMemo, useState } from "react";
import type {
  ConditionalTriggerMetadata,
  IndicatorComparator,
  IndicatorConditionClause,
  IndicatorConditionGroup,
  IndicatorKind,
  IndicatorOperand,
  IndicatorTimeframe,
} from "@n8n-trading/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUPPORTED_INDIAN_MARKET_ASSETS,
  SUPPORTED_MARKETS,
  SUPPORTED_WEB3_ASSETS,
} from "@n8n-trading/types";

interface ConditionalTriggerFormProps {
  marketType: "Indian" | "Crypto" | null;
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
  metadata: ConditionalTriggerMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

type OperandMode = "indicator" | "value";

interface UIIndicator {
  symbol: string;
  timeframe: IndicatorTimeframe;
  indicator: IndicatorKind;
  period?: number;
}

interface UIClause {
  left: UIIndicator;
  operator: IndicatorComparator;
  rightMode: OperandMode;
  rightValue?: number;
  rightIndicator?: UIIndicator;
}

interface UIGroup {
  operator: "AND" | "OR";
  clauses: UIClause[];
}

const TIMEFRAMES: IndicatorTimeframe[] = ["1m", "5m", "15m", "1h"];
const OPERATORS: IndicatorComparator[] = [">", ">=", "<", "<=", "==", "!="];
const INDICATORS: IndicatorKind[] = ["price", "volume", "ema", "sma", "rsi", "pct_change"];
const PERIOD_INDICATORS: IndicatorKind[] = ["ema", "sma", "rsi", "pct_change"];

function defaultIndicator(marketType: "Indian" | "Crypto" | null): UIIndicator {
  return {
    symbol: (marketType === "Crypto" ? SUPPORTED_WEB3_ASSETS[0] : SUPPORTED_INDIAN_MARKET_ASSETS[0]) || "",
    timeframe: "5m",
    indicator: "rsi",
    period: 14,
  };
}

function defaultClause(marketType: "Indian" | "Crypto" | null): UIClause {
  return {
    left: defaultIndicator(marketType),
    operator: "<",
    rightMode: "value",
    rightValue: 30,
    rightIndicator: defaultIndicator(marketType),
  };
}

function defaultGroup(marketType: "Indian" | "Crypto" | null): UIGroup {
  return {
    operator: "AND",
    clauses: [defaultClause(marketType)],
  };
}

function parseIndicatorOperand(operand: IndicatorOperand): UIIndicator {
  return {
    symbol: operand.indicator.symbol,
    timeframe: operand.indicator.timeframe,
    indicator: operand.indicator.indicator,
    period: operand.indicator.params?.period,
  };
}

function fromExpression(
  expression: IndicatorConditionGroup | undefined,
  marketType: "Indian" | "Crypto" | null,
): { rootOperator: "AND" | "OR"; groups: UIGroup[] } {
  if (!expression || !expression.conditions?.length) {
    return {
      rootOperator: "OR",
      groups: [defaultGroup(marketType), defaultGroup(marketType)],
    };
  }

  const groups: UIGroup[] = [];
  for (const condition of expression.conditions) {
    if (condition.type === "clause") {
      const left = condition.left.type === "indicator"
        ? parseIndicatorOperand(condition.left)
        : defaultIndicator(marketType);
      const rightMode: OperandMode = condition.right.type === "indicator" ? "indicator" : "value";
      groups.push({
        operator: "AND",
        clauses: [{
          left,
          operator: condition.operator,
          rightMode,
          rightValue: condition.right.type === "value" ? condition.right.value : undefined,
          rightIndicator: condition.right.type === "indicator" ? parseIndicatorOperand(condition.right) : defaultIndicator(marketType),
        }],
      });
      continue;
    }

    const clauses: UIClause[] = condition.conditions
      .filter((entry): entry is IndicatorConditionClause => entry.type === "clause")
      .map((clause) => ({
        left: clause.left.type === "indicator" ? parseIndicatorOperand(clause.left) : defaultIndicator(marketType),
        operator: clause.operator,
        rightMode: clause.right.type === "indicator" ? "indicator" : "value",
        rightValue: clause.right.type === "value" ? clause.right.value : undefined,
        rightIndicator: clause.right.type === "indicator" ? parseIndicatorOperand(clause.right) : defaultIndicator(marketType),
      }));

    groups.push({
      operator: condition.operator,
      clauses: clauses.length ? clauses : [defaultClause(marketType)],
    });
  }

  return {
    rootOperator: expression.operator,
    groups: groups.length ? groups : [defaultGroup(marketType)],
  };
}

function toExpression(
  rootOperator: "AND" | "OR",
  groups: UIGroup[],
  marketType: "Indian" | "Crypto" | null,
): IndicatorConditionGroup {
  const normalizedMarket = marketType || "Indian";
  return {
    type: "group",
    operator: rootOperator,
    conditions: groups.map((group) => ({
      type: "group" as const,
      operator: group.operator,
      conditions: group.clauses.map((clause) => ({
        type: "clause" as const,
        left: {
          type: "indicator" as const,
          indicator: {
            symbol: clause.left.symbol,
            timeframe: clause.left.timeframe,
            indicator: clause.left.indicator,
            marketType: normalizedMarket,
            params: PERIOD_INDICATORS.includes(clause.left.indicator) && clause.left.period
              ? { period: clause.left.period }
              : undefined,
          },
        },
        operator: clause.operator,
        right: clause.rightMode === "value"
          ? {
              type: "value" as const,
              value: Number(clause.rightValue ?? 0),
            }
          : {
              type: "indicator" as const,
              indicator: {
                symbol: clause.rightIndicator?.symbol || clause.left.symbol,
                timeframe: clause.rightIndicator?.timeframe || clause.left.timeframe,
                indicator: clause.rightIndicator?.indicator || clause.left.indicator,
                marketType: normalizedMarket,
                params:
                  clause.rightIndicator &&
                  PERIOD_INDICATORS.includes(clause.rightIndicator.indicator) &&
                  clause.rightIndicator.period
                    ? { period: clause.rightIndicator.period }
                    : undefined,
              },
            },
      })),
    })),
  };
}

function ExpressionIndicatorEditor({
  label,
  value,
  marketType,
  onChange,
}: {
  label: string;
  value: UIIndicator;
  marketType: "Indian" | "Crypto" | null;
  onChange: (next: UIIndicator) => void;
}) {
  const assets = marketType === "Crypto" ? SUPPORTED_WEB3_ASSETS : SUPPORTED_INDIAN_MARKET_ASSETS;
  const needsPeriod = PERIOD_INDICATORS.includes(value.indicator);

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      <Select
        value={value.symbol}
        onValueChange={(symbol) => onChange({ ...value, symbol })}
      >
        <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-100">
          <SelectValue placeholder="Symbol" />
        </SelectTrigger>
        <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
          {assets.map((asset) => (
            <SelectItem key={asset} value={asset} className="text-xs">
              {asset}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={value.timeframe}
          onValueChange={(timeframe) => onChange({ ...value, timeframe: timeframe as IndicatorTimeframe })}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-100">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {TIMEFRAMES.map((timeframe) => (
              <SelectItem key={timeframe} value={timeframe} className="text-xs">
                {timeframe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.indicator}
          onValueChange={(indicator) => {
            const next = indicator as IndicatorKind;
            onChange({
              ...value,
              indicator: next,
              period: PERIOD_INDICATORS.includes(next) ? value.period || 14 : undefined,
            });
          }}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-100">
            <SelectValue placeholder="Indicator" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {INDICATORS.map((indicator) => (
              <SelectItem key={indicator} value={indicator} className="text-xs uppercase">
                {indicator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsPeriod && (
        <Input
          type="number"
          value={value.period || 14}
          min={1}
          onChange={(e) =>
            onChange({
              ...value,
              period: Number(e.target.value) || 14,
            })
          }
          className="border-neutral-800 bg-neutral-900 text-xs text-neutral-100"
          placeholder="Period"
        />
      )}
    </div>
  );
}

export const ConditionalTriggerForm = ({
  marketType,
  setMarketType,
  metadata,
  setMetadata,
}: ConditionalTriggerFormProps) => {
  const initial = useMemo(
    () => fromExpression(metadata.expression, marketType),
    // only for mount/edit open state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [rootOperator, setRootOperator] = useState<"AND" | "OR">(initial.rootOperator);
  const [groups, setGroups] = useState<UIGroup[]>(initial.groups);

  useEffect(() => {
    setMetadata((current: ConditionalTriggerMetadata) => ({
      ...current,
      marketType: marketType || current?.marketType || "Indian",
      expression: toExpression(rootOperator, groups, marketType),
    }));
  }, [groups, marketType, rootOperator, setMetadata]);

  const updateGroup = (index: number, next: UIGroup) => {
    setGroups((prev) => prev.map((group, idx) => (idx === index ? next : group)));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Select Market</p>
        <Select
          onValueChange={(value) => setMarketType(value as "Indian" | "Crypto")}
          value={marketType || (metadata.marketType as "Indian" | "Crypto" | undefined) || undefined}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select a market" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Select market</SelectLabel>
              {SUPPORTED_MARKETS.map((market) => (
                <SelectItem key={market} value={market} className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800">
                  {market}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Condition Set Joiner</p>
        <p className="text-xs text-neutral-400">Join all groups using a root operator.</p>
        <Select value={rootOperator} onValueChange={(value) => setRootOperator(value as "AND" | "OR")}>
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Root operator" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectItem value="AND" className="text-sm">AND</SelectItem>
            <SelectItem value="OR" className="text-sm">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {groups.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} className="space-y-3 rounded-2xl border border-neutral-800 p-3 bg-neutral-950/50">
          {groupIndex > 0 && (
            <div className="flex items-center justify-center py-1">
              <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f17463]">
                {rootOperator}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Group {groupIndex + 1}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-7 border-neutral-700 bg-transparent px-2 text-[11px]"
              onClick={() =>
                setGroups((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== groupIndex) : prev))
              }
            >
              Remove
            </Button>
          </div>

          <Select
            value={group.operator}
            onValueChange={(value) =>
              updateGroup(groupIndex, { ...group, operator: value as "AND" | "OR" })
            }
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-100">
              <SelectValue placeholder="Operator inside group" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectItem value="AND" className="text-xs">AND (all clauses)</SelectItem>
              <SelectItem value="OR" className="text-xs">OR (any clause)</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            {group.clauses.map((clause, clauseIndex) => (
              <div key={`group-${groupIndex}-clause-${clauseIndex}`} className="space-y-2">
                <div className="space-y-2 rounded-xl border border-neutral-800 p-3 bg-black/40">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      Clause {clauseIndex + 1}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 border-neutral-700 bg-transparent px-2 text-[11px]"
                      onClick={() => {
                        const nextClauses = group.clauses.filter((_, idx) => idx !== clauseIndex);
                        updateGroup(groupIndex, {
                          ...group,
                          clauses: nextClauses.length ? nextClauses : [defaultClause(marketType)],
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>

                  <ExpressionIndicatorEditor
                    label="Left Operand"
                    value={clause.left}
                    marketType={marketType}
                    onChange={(left) => {
                      const nextClauses = [...group.clauses];
                      nextClauses[clauseIndex] = { ...clause, left };
                      updateGroup(groupIndex, { ...group, clauses: nextClauses });
                    }}
                  />

                  <Select
                    value={clause.operator}
                    onValueChange={(value) => {
                      const nextClauses = [...group.clauses];
                      nextClauses[clauseIndex] = { ...clause, operator: value as IndicatorComparator };
                      updateGroup(groupIndex, { ...group, clauses: nextClauses });
                    }}
                  >
                    <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-100">
                      <SelectValue placeholder="Comparator" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                      {OPERATORS.map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">
                          {op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={clause.rightMode}
                    onValueChange={(value) => {
                      const rightMode = value as OperandMode;
                      const nextClauses = [...group.clauses];
                      nextClauses[clauseIndex] = {
                        ...clause,
                        rightMode,
                        rightValue: rightMode === "value" ? clause.rightValue ?? 0 : undefined,
                        rightIndicator: rightMode === "indicator" ? clause.rightIndicator || defaultIndicator(marketType) : clause.rightIndicator,
                      };
                      updateGroup(groupIndex, { ...group, clauses: nextClauses });
                    }}
                  >
                    <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-100">
                      <SelectValue placeholder="Right operand type" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                      <SelectItem value="value" className="text-xs">Numeric Value</SelectItem>
                      <SelectItem value="indicator" className="text-xs">Indicator</SelectItem>
                    </SelectContent>
                  </Select>

                  {clause.rightMode === "value" ? (
                    <Input
                      type="number"
                      value={clause.rightValue ?? 0}
                      onChange={(e) => {
                        const nextClauses = [...group.clauses];
                        nextClauses[clauseIndex] = { ...clause, rightValue: Number(e.target.value) };
                        updateGroup(groupIndex, { ...group, clauses: nextClauses });
                      }}
                      className="border-neutral-800 bg-neutral-900 text-xs text-neutral-100"
                      placeholder="Numeric value"
                    />
                  ) : (
                    <ExpressionIndicatorEditor
                      label="Right Operand"
                      value={clause.rightIndicator || defaultIndicator(marketType)}
                      marketType={marketType}
                      onChange={(rightIndicator) => {
                        const nextClauses = [...group.clauses];
                        nextClauses[clauseIndex] = { ...clause, rightIndicator };
                        updateGroup(groupIndex, { ...group, clauses: nextClauses });
                      }}
                    />
                  )}
                </div>

                {clauseIndex < group.clauses.length - 1 && (
                  <div className="flex items-center justify-center py-1">
                    <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      {group.operator}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-neutral-800 bg-neutral-900 text-xs"
            onClick={() =>
              updateGroup(groupIndex, {
                ...group,
                clauses: [...group.clauses, defaultClause(marketType)],
              })
            }
          >
            + Add Clause
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-neutral-800 bg-neutral-900 text-xs"
        onClick={() => setGroups((prev) => [...prev, defaultGroup(marketType)])}
      >
        + Add Group
      </Button>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Time Window (minutes)</p>
        <p className="text-xs text-neutral-400">
          Optional. If set, condition is evaluated only within this window from start time.
        </p>
        <Input
          type="number"
          value={metadata.timeWindowMinutes || ""}
          onChange={(e) =>
            setMetadata((current: ConditionalTriggerMetadata) => ({
              ...current,
              timeWindowMinutes: Number(e.target.value),
              startTime: new Date(),
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Enter minutes (e.g., 15)"
        />
      </div>
    </div>
  );
};
