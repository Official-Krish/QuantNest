import type { TradingMetadata } from "@quantnest-trading/types";
import { Handle, Position } from "@xyflow/react";
import { ServiceLogo } from "@/components/workflow/service-branding";

export const lighterAction = ({
  data,
}: {
  data: {
    metadata: TradingMetadata;
  };
}) => {
  const { type, qty, symbol, secretId } = (data.metadata || {}) as TradingMetadata & {
    secretId?: string;
  };
  const hasSecret = Boolean(String(secretId || "").trim());

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#34d399] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          <ServiceLogo service="lighter" size={14} />
          Lighter
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {type?.toUpperCase()}
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {qty ?? "-"} units on {symbol ?? "-"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        Sends an order to Lighter when the previous step completes.
      </div>
      {hasSecret ? (
        <div className="mt-1 text-[11px] text-[#f7b2a7]">
          Credentials from stored secret.
        </div>
      ) : null}
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#f17463]! border border-neutral-900"
      />
    </div>
  );
}
