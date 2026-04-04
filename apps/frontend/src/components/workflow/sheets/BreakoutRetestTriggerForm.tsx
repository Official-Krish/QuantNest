import { useEffect, useState } from "react";
import type { BreakoutRetestTriggerMetadata } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_MARKETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPreviewWorkflowMetrics } from "@/http";
import type { WorkflowLivePreview } from "@/types/api";
import { WorkflowLivePreviewPanel } from "./WorkflowLivePreviewPanel";

interface BreakoutRetestTriggerFormProps {
  marketType: "Indian" | "Crypto" | null;
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
  metadata: BreakoutRetestTriggerMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export function BreakoutRetestTriggerForm({
  marketType,
  setMarketType,
  metadata,
  setMetadata,
}: BreakoutRetestTriggerFormProps) {
  const [preview, setPreview] = useState<WorkflowLivePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const asset = metadata.asset;
    const activeMarket = marketType || (metadata.marketType === "indian" ? "Indian" : metadata.marketType === "web3" ? "Crypto" : null);
    if (!asset || !activeMarket) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    const allowedAssets = activeMarket === "Indian" ? SUPPORTED_INDIAN_MARKET_ASSETS : SUPPORTED_WEB3_ASSETS;
    if (!allowedAssets.includes(asset as any)) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    const fetchPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const next = await apiPreviewWorkflowMetrics({
          marketType: activeMarket,
          asset,
          mode: "breakout-retest",
          direction: metadata.direction,
          breakoutLevel: Number(metadata.breakoutLevel),
          retestTolerancePct: Number(metadata.retestTolerancePct),
          confirmationMovePct: Number(metadata.confirmationMovePct),
          retestWindowMinutes: Number(metadata.retestWindowMinutes),
          confirmationWindowMinutes: Number(metadata.confirmationWindowMinutes),
        });
        if (!cancelled) {
          setPreview(next);
        }
      } catch (error: any) {
        if (!cancelled) {
          setPreviewError(error?.response?.data?.message || error?.message || "Failed to fetch live preview");
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    };

    void fetchPreview();
    const interval = window.setInterval(() => void fetchPreview(), 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    marketType,
    metadata.asset,
    metadata.breakoutLevel,
    metadata.confirmationMovePct,
    metadata.direction,
    metadata.marketType,
    metadata.retestTolerancePct,
    metadata.retestWindowMinutes,
    metadata.confirmationWindowMinutes,
  ]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Structure</p>
        <p className="text-sm text-neutral-300">
          This waits for breakout, then a pullback retest, and only fires after confirmation back in the breakout direction.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Direction</p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({
              ...current,
              direction: value as "bullish" | "bearish",
            }))
          }
          value={metadata.direction || "bullish"}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select direction" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectItem value="bullish">Bullish breakout retest</SelectItem>
              <SelectItem value="bearish">Bearish breakdown retest</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Select market</p>
        <Select
          onValueChange={(value) => {
            setMarketType(value as "Indian" | "Crypto");
            setMetadata((current: any) => ({
              ...current,
              marketType: value === "Crypto" ? "web3" : "indian",
              asset: undefined,
            }));
          }}
          value={marketType || (metadata.marketType === "web3" ? "Crypto" : metadata.marketType === "indian" ? "Indian" : "")}
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

      {marketType ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Asset</p>
          <Select
            onValueChange={(value) =>
              setMetadata((current: any) => ({
                ...current,
                asset: value,
              }))
            }
            value={metadata.asset}
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectGroup>
                {(marketType === "Indian" ? SUPPORTED_INDIAN_MARKET_ASSETS : SUPPORTED_WEB3_ASSETS).map((asset) => (
                  <SelectItem key={asset} value={asset} className="cursor-pointer">
                    {asset}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Breakout level</p>
          <Input
            type="number"
            value={metadata.breakoutLevel || ""}
            onChange={(e) => setMetadata((current: any) => ({ ...current, breakoutLevel: Number(e.target.value) }))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="1750"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Retest tolerance %</p>
          <Input
            type="number"
            value={metadata.retestTolerancePct || ""}
            onChange={(e) => setMetadata((current: any) => ({ ...current, retestTolerancePct: Number(e.target.value) }))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="0.35"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Confirmation move %</p>
          <Input
            type="number"
            value={metadata.confirmationMovePct || ""}
            onChange={(e) => setMetadata((current: any) => ({ ...current, confirmationMovePct: Number(e.target.value) }))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="0.25"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Retest window (min)</p>
          <Input
            type="number"
            value={metadata.retestWindowMinutes || ""}
            onChange={(e) => setMetadata((current: any) => ({ ...current, retestWindowMinutes: Number(e.target.value) }))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="45"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">Confirmation window (min)</p>
        <Input
          type="number"
          value={metadata.confirmationWindowMinutes || ""}
          onChange={(e) => setMetadata((current: any) => ({ ...current, confirmationWindowMinutes: Number(e.target.value) }))}
          className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="20"
        />
      </div>

      <WorkflowLivePreviewPanel
        preview={preview}
        loading={previewLoading}
        error={previewError}
        title="Breakout Retest Preview"
      />
    </div>
  );
}
