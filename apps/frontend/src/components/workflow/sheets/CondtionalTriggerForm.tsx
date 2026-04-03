import { useEffect, useMemo, useState } from "react";
import type {
  ConditionalTriggerMetadata,
  IndicatorComparator,
  IndicatorConditionClause,
  IndicatorConditionGroup,
  IndicatorKind,
  IndicatorOperand,
  IndicatorTimeframe,
} from "@quantnest-trading/types";
import { apiPreviewWorkflowMetrics } from "@/http";
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
import type { WorkflowLivePreview } from "@/types/api";
import {
  SUPPORTED_INDIAN_MARKET_ASSETS,
  SUPPORTED_MARKETS,
  SUPPORTED_WEB3_ASSETS,
} from "@quantnest-trading/types";
import { WorkflowLivePreviewPanel } from "./WorkflowLivePreviewPanel";

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

type TriggerTemplateMode = "custom" | "volume-spike";

const TIMEFRAMES: IndicatorTimeframe[] = ["1m", "5m", "15m", "1h"];
const OPERATOR_OPTIONS: Array<{ value: IndicatorComparator; label: string }> = [
  { value: ">", label: ">" },
  { value: ">=", label: ">=" },
  { value: "<", label: "<" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
  { value: "crosses_above", label: "Crosses Above" },
  { value: "crosses_below", label: "Crosses Below" },
];
const INDICATORS: IndicatorKind[] = [
  "price",
  "volume",
  "ema",
  "sma",
  "rsi",
  "pct_change",
  "macd",
  "macd_signal",
  "macd_histogram",
];
const PERIOD_INDICATORS: IndicatorKind[] = ["ema", "sma", "rsi", "pct_change"];

const DEFAULT_VOLUME_SPIKE_THRESHOLD = 1_000_000;

function defaultSymbolForMarket(marketType: "Indian" | "Crypto" | null): string {
  return (marketType === "Crypto" ? SUPPORTED_WEB3_ASSETS[0] : SUPPORTED_INDIAN_MARKET_ASSETS[0]) || "";
}

function defaultIndicator(marketType: "Indian" | "Crypto" | null): UIIndicator {
  return {
    symbol: defaultSymbolForMarket(marketType),
    timeframe: "5m",
    indicator: "rsi",
    period: 14,
  };
}

function buildVolumeSpikePreset(
  marketType: "Indian" | "Crypto" | null,
  symbol?: string,
  timeframe: IndicatorTimeframe = "5m",
  threshold: number = DEFAULT_VOLUME_SPIKE_THRESHOLD,
): { rootOperator: "AND" | "OR"; groups: UIGroup[] } {
  const resolvedSymbol = symbol || defaultSymbolForMarket(marketType);
  return {
    rootOperator: "AND",
    groups: [
      {
        operator: "AND",
        clauses: [
          {
            left: {
              symbol: resolvedSymbol,
              timeframe,
              indicator: "volume",
            },
            operator: ">",
            rightMode: "value",
            rightValue: threshold,
          },
        ],
      },
    ],
  };
}

function tryExtractVolumeSpikePreset(expression: IndicatorConditionGroup | undefined): {
  symbol: string;
  timeframe: IndicatorTimeframe;
  threshold: number;
} | null {
  if (!expression || expression.type !== "group" || !Array.isArray(expression.conditions) || expression.conditions.length !== 1) {
    return null;
  }

  const firstGroup = expression.conditions[0];
  if (firstGroup.type !== "group" || !Array.isArray(firstGroup.conditions) || firstGroup.conditions.length !== 1) {
    return null;
  }

  const clause = firstGroup.conditions[0];
  if (
    clause.type !== "clause" ||
    clause.left.type !== "indicator" ||
    clause.left.indicator.indicator !== "volume" ||
    clause.operator !== ">" ||
    clause.right.type !== "value"
  ) {
    return null;
  }

  const threshold = Number(clause.right.value);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    return null;
  }

  return {
    symbol: clause.left.indicator.symbol,
    timeframe: clause.left.indicator.timeframe,
    threshold,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseLooseIndicatorOperand(operand: unknown): UIIndicator {
  if (!isRecord(operand)) {
    return defaultIndicator(null);
  }

  const indicator = operand.indicator as Record<string, unknown> | undefined;
  const params = indicator?.params as Record<string, unknown> | undefined;

  if (operand.type === "indicator" && indicator) {
    return {
      symbol: String(indicator.symbol || defaultSymbolForMarket(null)),
      timeframe: String(indicator.timeframe || "5m") as IndicatorTimeframe,
      indicator: String(indicator.indicator || "rsi") as IndicatorKind,
      period: typeof params?.period === "number" ? (params.period as number) : undefined,
    };
  }

  if (indicator) {
    return {
      symbol: String(indicator.symbol || defaultSymbolForMarket(null)),
      timeframe: String(indicator.timeframe || "5m") as IndicatorTimeframe,
      indicator: String(indicator.indicator || "rsi") as IndicatorKind,
      period: typeof params?.period === "number" ? (params.period as number) : undefined,
    };
  }

  return defaultIndicator(null);
}

function parseLooseClause(condition: unknown, marketType: "Indian" | "Crypto" | null): UIClause | null {
  if (!isRecord(condition)) {
    return null;
  }

  const conditionType = String(condition.type || "").toLowerCase();
  if (conditionType === "clause" || (condition.left && condition.right)) {
    const looseCondition = condition as Record<string, any>;
    const left = parseLooseIndicatorOperand(looseCondition.left);
    const right = looseCondition.right as Record<string, unknown> | undefined;
    const rightIndicator = right && (right.type === "indicator" || isRecord(right.indicator));

    return {
      left,
      operator: String(looseCondition.operator || ">") as IndicatorComparator,
      rightMode: rightIndicator ? "indicator" : "value",
      rightValue: !rightIndicator ? Number(right?.value) : undefined,
      rightIndicator: rightIndicator ? parseLooseIndicatorOperand(right) : defaultIndicator(marketType),
    };
  }

  return null;
}

function fromExpression(
  expression: IndicatorConditionGroup | undefined,
  marketType: "Indian" | "Crypto" | null,
): { rootOperator: "AND" | "OR"; groups: UIGroup[] } {
  const conditions: unknown[] = Array.isArray((expression as any)?.conditions) ? (expression as any).conditions : [];

  if (!expression || !conditions.length) {
    const firstClause = defaultClause(marketType);
    const secondClause = {
      ...defaultClause(marketType),
      operator: "crosses_above" as IndicatorComparator,
      rightMode: "indicator" as OperandMode,
      rightIndicator: {
        symbol: firstClause.left.symbol,
        timeframe: firstClause.left.timeframe,
        indicator: "ema" as IndicatorKind,
        period: 20,
      },
    };

    return {
      rootOperator: "AND",
      groups: [{
        operator: "AND",
        clauses: [firstClause, secondClause],
      }],
    };
  }

  const rootClauses = conditions
    .map((condition: unknown) => parseLooseClause(condition, marketType))
    .filter((entry: UIClause | null): entry is UIClause => Boolean(entry));

  if (rootClauses.length === conditions.length) {
    return {
      rootOperator: "AND",
      groups: [{
        operator: expression?.operator === "OR" ? "OR" : "AND",
        clauses: rootClauses,
      }],
    };
  }

  const groups: UIGroup[] = [];
  for (const condition of conditions) {
    const looseClause = parseLooseClause(condition, marketType);
    if (looseClause) {
      groups.push({
        operator: "AND",
        clauses: [looseClause],
      });
      continue;
    }

    if (isRecord(condition) && condition.type === "group" && Array.isArray(condition.conditions)) {
      const clauses: UIClause[] = condition.conditions
        .filter((entry): entry is IndicatorConditionClause | Record<string, unknown> => isRecord(entry))
        .map((entry) => {
          if ((entry as any).type === "clause" || ((entry as any).left && (entry as any).right)) {
            const looseEntry = parseLooseClause(entry, marketType);
            if (looseEntry) {
              return looseEntry;
            }
          }

          return defaultClause(marketType);
        });

      groups.push({
        operator: condition.operator === "OR" ? "OR" : "AND",
        clauses: clauses.length ? clauses : [defaultClause(marketType)],
      });
      continue;
    }

    if (isRecord(condition) && condition.type === "clause") {
      const typedCondition = condition as Record<string, any>;
      const left = typedCondition.left?.type === "indicator"
        ? parseIndicatorOperand(typedCondition.left)
        : defaultIndicator(marketType);
      const rightMode: OperandMode = typedCondition.right?.type === "indicator" ? "indicator" : "value";
      groups.push({
        operator: "AND",
        clauses: [{
          left,
          operator: typedCondition.operator as IndicatorComparator,
          rightMode,
          rightValue: typedCondition.right?.type === "value" ? typedCondition.right.value : undefined,
          rightIndicator: typedCondition.right?.type === "indicator" ? parseIndicatorOperand(typedCondition.right) : defaultIndicator(marketType),
        }],
      });
      continue;
    }
  }

  return {
    rootOperator: expression?.operator === "AND" ? "AND" : "OR",
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
  const extractedVolumePreset = useMemo(
    () => tryExtractVolumeSpikePreset(metadata.expression),
    // only for mount/edit open state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const initial = useMemo(
    () => fromExpression(metadata.expression, marketType),
    // only for mount/edit open state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [rootOperator, setRootOperator] = useState<"AND" | "OR">(initial.rootOperator);
  const [groups, setGroups] = useState<UIGroup[]>(initial.groups);
  const [templateMode, setTemplateMode] = useState<TriggerTemplateMode>(
    extractedVolumePreset ? "volume-spike" : "custom",
  );
  const [volumeSpikeSymbol, setVolumeSpikeSymbol] = useState<string>(
    extractedVolumePreset?.symbol || defaultSymbolForMarket(marketType),
  );
  const [volumeSpikeTimeframe, setVolumeSpikeTimeframe] = useState<IndicatorTimeframe>(
    extractedVolumePreset?.timeframe || "5m",
  );
  const [volumeSpikeThreshold, setVolumeSpikeThreshold] = useState<number>(
    extractedVolumePreset?.threshold || DEFAULT_VOLUME_SPIKE_THRESHOLD,
  );
  const [preview, setPreview] = useState<WorkflowLivePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const activeMarket = marketType || (metadata.marketType as "Indian" | "Crypto" | undefined) || "Indian";
  const marketAssets = activeMarket === "Crypto" ? SUPPORTED_WEB3_ASSETS : SUPPORTED_INDIAN_MARKET_ASSETS;

  useEffect(() => {
    if (!marketAssets.includes(volumeSpikeSymbol as any)) {
      setVolumeSpikeSymbol(marketAssets[0] || "");
    }
  }, [marketAssets, volumeSpikeSymbol]);

  useEffect(() => {
    if (templateMode !== "volume-spike") return;
    const preset = buildVolumeSpikePreset(activeMarket, volumeSpikeSymbol, volumeSpikeTimeframe, volumeSpikeThreshold);
    setRootOperator(preset.rootOperator);
    setGroups(preset.groups);
  }, [activeMarket, templateMode, volumeSpikeSymbol, volumeSpikeThreshold, volumeSpikeTimeframe]);

  useEffect(() => {
    setMetadata((current: ConditionalTriggerMetadata) => ({
      ...current,
      marketType: marketType || current?.marketType || "Indian",
      expression: toExpression(rootOperator, groups, marketType),
    }));
  }, [groups, marketType, rootOperator, setMetadata]);

  useEffect(() => {
    const expression = toExpression(rootOperator, groups, marketType);
    const activeMarket = marketType || (metadata.marketType as "Indian" | "Crypto" | undefined);
    if (!activeMarket || !expression.conditions.length) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let isCancelled = false;

    const fetchPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const next = await apiPreviewWorkflowMetrics({
          marketType: activeMarket,
          expression,
        });
        if (!isCancelled) {
          setPreview(next);
        }
      } catch (error: any) {
        if (!isCancelled) {
          setPreviewError(error?.response?.data?.message || error?.message || "Failed to fetch live preview");
        }
      } finally {
        if (!isCancelled) {
          setPreviewLoading(false);
        }
      }
    };

    void fetchPreview();
    const interval = window.setInterval(() => {
      void fetchPreview();
    }, 15_000);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [groups, rootOperator, marketType, metadata.marketType]);

  const updateGroup = (index: number, next: UIGroup) => {
    setGroups((prev) => prev.map((group, idx) => (idx === index ? next : group)));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Select Market</p>
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
                <SelectItem key={market} value={market} className="cursor-pointer text-sm text-neutral-100">
                  {market}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Template</p>
        <p className="text-sm text-neutral-300">Use a quick setup or switch to full custom condition builder.</p>
        <Select value={templateMode} onValueChange={(value) => setTemplateMode(value as TriggerTemplateMode)}>
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectItem value="volume-spike" className="text-sm cursor-pointer">Volume Spike (Simple)</SelectItem>
            <SelectItem value="custom" className="text-sm cursor-pointer">Custom (Advanced)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {templateMode === "volume-spike" ? (
        <div className="space-y-3 rounded-2xl border border-neutral-800 p-3 bg-neutral-950/50">
          <p className="text-sm text-neutral-300">
            Triggers when volume is greater than your threshold.
          </p>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Asset</p>
            <Select value={volumeSpikeSymbol} onValueChange={setVolumeSpikeSymbol}>
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                {marketAssets.map((asset) => (
                  <SelectItem key={asset} value={asset} className="text-sm cursor-pointer">
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Timeframe</p>
            <Select value={volumeSpikeTimeframe} onValueChange={(value) => setVolumeSpikeTimeframe(value as IndicatorTimeframe)}>
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                {TIMEFRAMES.map((timeframe) => (
                  <SelectItem key={timeframe} value={timeframe} className="text-sm cursor-pointer">
                    {timeframe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Volume Threshold</p>
            <Input
              type="number"
              min={1}
              value={volumeSpikeThreshold}
              onChange={(e) => setVolumeSpikeThreshold(Number(e.target.value) || DEFAULT_VOLUME_SPIKE_THRESHOLD)}
              className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="e.g. 1000000"
            />
          </div>
        </div>
      ) : null}

      {templateMode === "custom" ? (
        <>
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Condition Set Joiner</p>
        <p className="text-sm text-neutral-300">Join all groups using a root operator.</p>
        <Select value={rootOperator} onValueChange={(value) => setRootOperator(value as "AND" | "OR")}>
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Root operator" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectItem value="AND" className="text-sm cursor-pointer">AND</SelectItem>
            <SelectItem value="OR" className="text-sm cursor-pointer">OR</SelectItem>
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
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
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
              <SelectItem value="AND" className="text-xs cursor-pointer">AND (all clauses)</SelectItem>
              <SelectItem value="OR" className="text-xs cursor-pointer">OR (any clause)</SelectItem>
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
                      {OPERATOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs cursor-pointer">
                          {option.label}
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
                      <SelectItem value="value" className="text-xs cursor-pointer">Numeric Value</SelectItem>
                      <SelectItem value="indicator" className="text-xs cursor-pointer">Indicator</SelectItem>
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
                    <span className="rounded-full border border-[#f17463]/45 bg-[#f17463]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffb8ad]">
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
            className="w-full border-neutral-800 bg-neutral-900 text-xs cursor-pointer"
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
        className="w-full border-neutral-800 bg-neutral-900 text-xs cursor-pointer"
        onClick={() => setGroups((prev) => [...prev, defaultGroup(marketType)])}
      >
        + Add Group
      </Button>
        </>
      ) : null}

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Time Window (minutes)</p>
        <p className="text-sm text-neutral-300">
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

      <WorkflowLivePreviewPanel
        preview={preview}
        loading={previewLoading}
        error={previewError}
        title="Live indicator preview"
      />
    </div>
  );
};
