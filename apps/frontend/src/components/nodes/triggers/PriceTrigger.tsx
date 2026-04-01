import type { PriceTriggerNodeMetadata } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
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
  const {
    asset = "-",
    mode = "threshold",
    condition = "above",
    targetPrice = 0,
    changeDirection = "increase",
    changeType = "percent",
    changeValue = 0,
    changeWindowMinutes = 60,
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
      ? mode === "change"
        ? {
            marketType: data.metadata?.marketType,
            asset,
            mode,
            changeDirection,
            changeType,
            changeValue,
            changeWindowMinutes,
          }
        : {
            marketType: data.metadata?.marketType,
            asset,
            mode: "threshold",
            targetPrice,
            condition,
          }
      : null,
  );

  const title = mode === "change"
    ? `${changeDirection} ${changeValue}${changeType === "percent" ? "%" : " pts"} in ${changeWindowMinutes}m`
    : `${condition} ${targetPrice}`;

  const description = mode === "change"
    ? `Executes when ${asset} ${changeDirection}s by ${changeValue}${changeType === "percent" ? "%" : " points"} in ${changeWindowMinutes}m.`
    : `Executes when ${asset} crosses this level.`;

  return (
    <div className="min-w-[220px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#f17463] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
          Price trigger
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {asset}
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {title}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        {description}
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
                {mode === "change"
                  ? changeType === "percent"
                    ? typeof preview?.priceChangePercent === "number"
                      ? `${preview.priceChangePercent.toFixed(2)}%`
                      : "N/A"
                    : typeof preview?.priceChange === "number"
                      ? preview.priceChange.toFixed(2)
                      : "N/A"
                  : typeof preview?.distanceToTarget === "number"
                    ? preview.distanceToTarget.toFixed(2)
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
        className="!h-2 !w-2 !bg-[#f17463] border border-neutral-900"
      />
    </div>
  );
}
