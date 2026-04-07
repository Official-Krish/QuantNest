import type { PortfolioPnlDrawdownTriggerMetadata } from "@quantnest-trading/types";
import { Handle, Position } from "@xyflow/react";

const MODE_LABELS: Record<string, string> = {
  "daily-loss-cap": "Daily loss cap",
  "profit-target": "Profit target",
  "drawdown-limit": "Drawdown limit",
};

const BROKER_LABELS: Record<string, string> = {
  zerodha: "Zerodha",
  groww: "Groww",
  lighter: "Lighter",
};

export function PortfolioPnlDrawdownTrigger({
  data,
  isConnectable,
}: {
  data: {
    metadata: PortfolioPnlDrawdownTriggerMetadata;
  };
  isConnectable: boolean;
}) {
  const accent = "#fb7185";
  const metadata = data.metadata || {};
  const broker = metadata.broker || "zerodha";
  const mode = metadata.mode || "daily-loss-cap";
  const unit = metadata.thresholdUnit === "percent" ? "%" : metadata.broker === "lighter" ? "USD" : "INR";
  const value = Number(metadata.thresholdValue || 0);
  const displayThreshold = metadata.thresholdUnit === "percent"
    ? `${value || "-"}%`
    : `${unit} ${value || "-"}`;

  return (
    <div
      className="min-w-61.25 rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{ borderLeft: `5px solid ${accent}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
          Portfolio risk
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {BROKER_LABELS[broker] || broker}
        </span>
      </div>

      <div className="mt-2 text-sm font-medium text-neutral-100">
        {MODE_LABELS[mode] || "Risk threshold"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        Fire once when account risk crosses {displayThreshold}.
      </div>

      <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-[0.16em] text-rose-200/70">One-shot</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-200">
            Risk control
          </span>
        </div>
        <div className="mt-1.5 text-[11px] leading-5 text-neutral-200">
          Evaluates account-level PnL/drawdown from one broker connection.
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="h-2! w-2! border border-neutral-900"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}
