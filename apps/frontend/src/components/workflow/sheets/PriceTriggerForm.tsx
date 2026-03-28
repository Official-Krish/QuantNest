import { useEffect, useState } from "react";
import type { PriceTriggerNodeMetadata } from "@quantnest-trading/types";
import { Input } from "@/components/ui/input";
import { apiPreviewWorkflowMetrics } from "@/http";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_MARKETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import type { WorkflowLivePreview } from "@/types/api";
import { WorkflowLivePreviewPanel } from "./WorkflowLivePreviewPanel";

interface PriceTriggerFormProps {
    marketType: "Indian" | "Crypto" | null;
    setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
    metadata: PriceTriggerNodeMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const PriceTriggerForm = ({
    marketType,
    setMarketType,
    metadata,
    setMetadata,
}: PriceTriggerFormProps) => {
  const [preview, setPreview] = useState<WorkflowLivePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const asset = metadata.asset;
    const activeMarket = marketType || (metadata.marketType as "Indian" | "Crypto" | null);
    if (!asset || !activeMarket) {
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
          asset,
          targetPrice: Number(metadata.targetPrice),
          condition: metadata.condition,
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
  }, [marketType, metadata.asset, metadata.condition, metadata.marketType, metadata.targetPrice]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Condition */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Condition
        </p>
        <p className="text-xs text-neutral-400">
          Run when price is above or below the threshold.
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({
              ...current,
              condition: value as "above" | "below",
            }))
          }
          value={metadata.condition || "above"}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectItem value="above" className="cursor-pointer text-sm">
                Above
              </SelectItem>
              <SelectItem value="below" className="cursor-pointer text-sm">
                Below
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Price Threshold */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Price threshold
        </p>
        <p className="text-xs text-neutral-400">
          Run this workflow when the selected asset crosses this price.
        </p>
        <Input
          type="number"
          value={metadata.targetPrice || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              targetPrice: Number(e.target.value),
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Enter price threshold"
        />
      </div>


      {/* Market Selection Indian/Web3 */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Select Market
        </p>
        <Select
          onValueChange={(value) => {
                setMarketType(value as "Indian" | "Crypto")
                setMetadata((current: any) => ({
                ...current,
                marketType: value,
                }))
            }
          }
          value={metadata.marketType}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select a market" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Select market
              </SelectLabel>
              {SUPPORTED_MARKETS.map((market) => (
                <SelectItem
                  key={market}
                  value={market}
                  className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
                >
                  <div className="w-64">
                    <div className="font-medium text-neutral-50">{market}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Asset according to market */}
      {marketType && 
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Asset
          </p>
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
              <SelectValue placeholder="Select an asset" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectGroup>
                <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                  Select asset
                </SelectLabel>
                {(marketType === "Indian" ? SUPPORTED_INDIAN_MARKET_ASSETS : SUPPORTED_WEB3_ASSETS).map((asset) => (
                  <SelectItem
                    key={asset}
                    value={asset}
                    className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
                  >
                    <div className="w-64">
                      <div className="font-medium text-neutral-50">{asset}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
      </div>
    }

    <WorkflowLivePreviewPanel
      preview={preview}
      loading={previewLoading}
      error={previewError}
      title="Live price preview"
    />
    </div>
  );
};
