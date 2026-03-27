import type { PriceTriggerNodeMetadata } from "@quantnest-trading/types";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowLivePreview } from "@/components/workflow/useWorkflowLivePreview";

export const PriceTrigger = ({
  data,
  isConnectable,
}: {
  data: {
    metadata: PriceTriggerNodeMetadata;
  };
  isConnectable: boolean;
}) => {
  const { asset = "-", condition = "above", targetPrice = 0 } = data.metadata || {};
  const { preview, loading } = useWorkflowLivePreview(
    asset && typeof targetPrice === "number"
      ? {
          marketType: data.metadata?.marketType,
          asset,
          targetPrice,
          condition,
        }
      : null,
  );

  return (
    <div className="min-w-[220px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
          Price trigger
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {asset}
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {condition} {targetPrice}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        Executes when {asset} crosses this level.
      </div>
      {(loading || preview) ? (
        <div className="mt-2 rounded-lg border border-neutral-800 bg-black/40 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">Live</span>
            <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${preview?.conditionMet ? "text-emerald-300" : "text-neutral-400"}`}>
              {loading ? "Fetching" : preview?.conditionMet ? "Triggered" : "Watching"}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">Price</div>
              <div className="text-[11px] font-semibold text-neutral-100">
                {typeof preview?.currentPrice === "number" ? preview.currentPrice.toFixed(2) : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">Delta</div>
              <div className="text-[11px] font-semibold text-neutral-100">
                {typeof preview?.distanceToTarget === "number" ? preview.distanceToTarget.toFixed(2) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!h-2 !w-2 !bg-[#f17463] border border-neutral-900"
      />
    </div>
  );
}
