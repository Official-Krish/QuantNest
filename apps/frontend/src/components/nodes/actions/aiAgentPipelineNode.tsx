import { Handle, Position } from "@xyflow/react";
import { Bot, ShieldCheck, Zap, AlertTriangle } from "lucide-react";

export const aiAgentPipelineNode = ({
  data,
}: {
  data: {
    metadata?: {
      broker?: string;
      symbol?: string;
      qty?: number;
      side?: string;
      executionMode?: "auto" | "require-approval";
      riskLimits?: { maxOrderAmount?: number; maxDailyExposure?: number };
      memoryEnabled?: boolean;
    };
  };
}) => {
  const metadata = data.metadata ?? {};
  const broker = metadata.broker ?? "zerodha";
  const symbol = metadata.symbol ?? "—";
  const qty = metadata.qty;
  const side = metadata.side ?? "buy";
  const mode = metadata.executionMode ?? "require-approval";
  const riskLimits = metadata.riskLimits ?? {};

  return (
    <div className="min-w-[260px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-violet-500 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            AI Pipeline
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
          <AlertTriangle className="h-2.5 w-2.5" />
          Beta
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-100">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
            side === "buy"
              ? "bg-teal-900/40 text-teal-300"
              : "bg-red-900/40 text-red-300"
          }`}
        >
          {side}
        </span>
        <span className="truncate text-xs text-neutral-300">
          {qty !== undefined ? `${qty} ` : ""}
          {symbol}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
          {broker}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
            mode === "auto"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-blue-500/30 bg-blue-500/10 text-blue-300"
          }`}
        >
          {mode === "auto" ? (
            <>
              <Zap className="h-2.5 w-2.5" />
              Auto
            </>
          ) : (
            <>
              <ShieldCheck className="h-2.5 w-2.5" />
              Approval
            </>
          )}
        </span>
        {riskLimits.maxOrderAmount !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-300">
            <ShieldCheck className="h-2.5 w-2.5" />
            Risk
          </span>
        )}
        {metadata.memoryEnabled && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
            Memory
          </span>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-violet-400! border border-neutral-900"
      />
    </div>
  );
};
