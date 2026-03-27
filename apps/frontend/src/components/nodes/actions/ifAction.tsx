import { Handle, Position } from "@xyflow/react";
import type { IndicatorConditionGroup } from "@quantnest-trading/types";
import { useWorkflowLivePreview } from "@/components/workflow/useWorkflowLivePreview";

function formatOperand(operand: any): string {
  if (!operand) return "-";
  if (operand.type === "value") return `${operand.value}`;
  const indicator = operand.indicator;
  if (!indicator) return "-";
  const period = indicator.params?.period ? `(${indicator.params.period})` : "";
  return `${String(indicator.indicator).toUpperCase()}${period} ${indicator.symbol} @${indicator.timeframe}`;
}

function formatClause(clause: any): string {
  return `${formatOperand(clause.left)} ${clause.operator} ${formatOperand(clause.right)}`;
}

export const ifAction = ({
  data,
}: {
  data: {
    metadata: {
      marketType?: string;
      asset?: string;
      targetPrice?: number;
      timeWindowMinutes?: number;
      startTime?: Date;
      expression?: IndicatorConditionGroup;
    };
  };
}) => {
  const { marketType, asset, targetPrice, timeWindowMinutes, startTime, expression } = data.metadata || {};
  const { preview, loading } = useWorkflowLivePreview(
    expression || asset
      ? {
          marketType: marketType as any,
          asset,
          targetPrice,
          condition: data.metadata?.condition as any,
          expression,
        }
      : null,
  );
  const details: Array<{ label: string; value: string | number }> = [];
  if (marketType) details.push({ label: "Market", value: marketType });
  if (asset) details.push({ label: "Asset", value: asset });
  if (typeof targetPrice === "number") details.push({ label: "Target Price", value: targetPrice });
  if (startTime) details.push({ label: "Start Time", value: new Date(startTime).toLocaleString() });
  if (typeof timeWindowMinutes === "number") details.push({ label: "Time Window (min)", value: timeWindowMinutes });
  if (expression) details.push({ label: "Groups", value: expression.conditions.length });

  return (
    <div className="min-w-[230px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
          If
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          BRANCH
        </span>
      </div>
      {details.length > 0 && (
        <div className="mt-1 space-y-0.5 text-xs text-neutral-300">
          {details.map((d) => (
            <div key={d.label}>
              <span className="font-semibold text-neutral-400">{d.label}:</span> {d.value}
            </div>
          ))}
        </div>
      )}
      {expression?.conditions?.length ? (
        <div className="mt-2 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Logic Graph</div>
          {expression.conditions.map((groupOrClause: any, index: number) => {
            const group = groupOrClause?.type === "group"
              ? groupOrClause
              : {
                  type: "group",
                  operator: "AND",
                  conditions: [groupOrClause],
                };
            return (
              <div key={`group-${index}`} className="space-y-1 rounded-lg border border-neutral-800 bg-neutral-900/40 p-2">
                {index > 0 && (
                  <div className="flex justify-center">
                    <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[9px] font-semibold text-sky-300">
                      {expression.operator}
                    </span>
                  </div>
                )}
                {group.conditions.map((clause: any, clauseIndex: number) => (
                  <div key={`clause-${index}-${clauseIndex}`} className="space-y-1">
                    <div className="rounded-md border border-neutral-800 bg-black/40 px-2 py-1 text-[10px] text-neutral-200">
                      {formatClause(clause)}
                    </div>
                    {clauseIndex < group.conditions.length - 1 && (
                      <div className="flex justify-center">
                        <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
                          {group.operator}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
      {(loading || preview) ? (
        <div className="mt-2 rounded-lg border border-neutral-800 bg-black/40 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">Live Snapshot</span>
            <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${preview?.conditionMet ? "text-emerald-300" : "text-neutral-400"}`}>
              {loading ? "Fetching" : preview?.conditionMet ? "True" : "False"}
            </span>
          </div>
          {preview?.indicatorSnapshot?.length ? (
            <div className="mt-1.5 space-y-1">
              {preview.indicatorSnapshot.slice(0, 3).map((entry) => (
                <div key={`${entry.symbol}-${entry.timeframe}-${entry.indicator}-${entry.period || 0}`} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="truncate text-neutral-400">
                    {String(entry.indicator).toUpperCase()}{entry.period ? `(${entry.period})` : ""} {entry.symbol}
                  </span>
                  <span className="font-semibold text-neutral-100">
                    {typeof entry.value === "number" ? entry.value.toFixed(2) : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          ) : typeof preview?.currentPrice === "number" ? (
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
              <span className="text-neutral-400">Current price</span>
              <span className="font-semibold text-neutral-100">{preview.currentPrice.toFixed(2)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1 text-[11px] text-neutral-400">
        Routes execution into true or false branches.
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: "50%" }}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        style={{ top: "35%" }}
        className="h-2! w-2! bg-emerald-400! border border-neutral-900"
      />
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        style={{ top: "65%" }}
        className="h-2! w-2! bg-red-400! border border-neutral-900"
      />
      <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-neutral-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          True
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          False
        </span>
      </div>
    </div>
  );
};
