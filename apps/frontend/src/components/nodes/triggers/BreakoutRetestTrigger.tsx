import type { BreakoutRetestTriggerMetadata } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowLivePreview } from "@/components/workflow/useWorkflowLivePreview";

export function BreakoutRetestTrigger({
  data,
  isConnectable,
}: {
  data: {
    metadata: BreakoutRetestTriggerMetadata;
  };
  isConnectable: boolean;
}) {
  const {
    asset = "-",
    direction = "bullish",
    breakoutLevel = 0,
    retestTolerancePct = 0,
    confirmationMovePct = 0,
    retestWindowMinutes = 0,
    confirmationWindowMinutes = 0,
  } = data.metadata || {};

  const normalizedMarket = String(data.metadata?.marketType || "").toLowerCase();
  const isIndianMarket = normalizedMarket === "indian";
  const isCryptoMarket = normalizedMarket === "crypto" || normalizedMarket === "web3";
  const isAssetValidForMarket = isIndianMarket
    ? SUPPORTED_INDIAN_MARKET_ASSETS.includes(asset as any)
    : isCryptoMarket
      ? SUPPORTED_WEB3_ASSETS.includes(asset as any)
      : false;

  const { preview, loading } = useWorkflowLivePreview(
    asset && isAssetValidForMarket
      ? {
          marketType: data.metadata?.marketType,
          asset,
          mode: "breakout-retest",
          direction,
          breakoutLevel,
          retestTolerancePct,
          confirmationMovePct,
          retestWindowMinutes,
          confirmationWindowMinutes,
        }
      : null,
  );

  const stageLabel = preview?.triggerStageLabel || "Waiting for breakout";

  return (
    <div className="min-w-[245px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#38bdf8] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7dd3fc]">
          Breakout retest
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {asset}
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {direction === "bearish" ? "Bearish" : "Bullish"} {breakoutLevel}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        Breakout, retest within {retestTolerancePct || 0}% and confirm in {confirmationWindowMinutes || 0}m.
      </div>
      {(loading || preview) ? (
        <div className="mt-2 rounded-lg border border-neutral-800 bg-black/40 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">Stage</span>
            <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${preview?.conditionMet ? "text-emerald-300" : "text-sky-300"}`}>
              {loading ? "Fetching" : preview?.triggerStage?.replaceAll("-", " ") || "Monitoring"}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] font-semibold text-neutral-100">{stageLabel}</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">Price</div>
              <div className="text-[11px] font-semibold text-neutral-100">
                {typeof preview?.currentPrice === "number" ? preview.currentPrice.toFixed(2) : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">Retest</div>
              <div className="text-[11px] font-semibold text-neutral-100">
                {typeof preview?.lowerRetestBand === "number" && typeof preview?.upperRetestBand === "number"
                  ? `${preview.lowerRetestBand.toFixed(2)} - ${preview.upperRetestBand.toFixed(2)}`
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!h-2 !w-2 !bg-[#38bdf8] border border-neutral-900"
      />
    </div>
  );
}
