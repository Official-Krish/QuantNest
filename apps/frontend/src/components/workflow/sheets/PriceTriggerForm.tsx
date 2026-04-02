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

    const allowedAssets = activeMarket === "Indian" ? SUPPORTED_INDIAN_MARKET_ASSETS : SUPPORTED_WEB3_ASSETS;
    if (!allowedAssets.includes(asset as any)) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let isCancelled = false;

    const fetchPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const mode = metadata.mode || "threshold";
        const next = await apiPreviewWorkflowMetrics(
          mode === "change"
            ? {
                marketType: activeMarket,
                asset,
                mode,
                changeType: metadata.changeType,
                changeDirection: metadata.changeDirection,
                changeValue: Number(metadata.changeValue),
                changeWindowMinutes: Number(metadata.changeWindowMinutes),
              }
            : {
                marketType: activeMarket,
                asset,
                mode: "threshold",
                targetPrice: Number(metadata.targetPrice),
                condition: metadata.condition,
              },
        );
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
  }, [
    marketType,
    metadata.asset,
    metadata.changeDirection,
    metadata.changeType,
    metadata.changeValue,
    metadata.changeWindowMinutes,
    metadata.condition,
    metadata.marketType,
    metadata.mode,
    metadata.targetPrice,
  ]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Condition */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
          Trigger mode
        </p>
        <p className="text-sm text-neutral-300">
          Choose a fixed threshold or a change over a time window.
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({
              ...current,
              mode: value as "threshold" | "change",
              ...(value === "threshold"
                ? {
                    condition: current.condition || "above",
                    targetPrice: Number(current.targetPrice) > 0 ? Number(current.targetPrice) : undefined,
                  }
                : {
                    changeType: current.changeType || "percent",
                    changeDirection: current.changeDirection || "increase",
                    changeValue: Number(current.changeValue) > 0 ? Number(current.changeValue) : 2,
                    changeWindowMinutes: Number(current.changeWindowMinutes) > 0 ? Number(current.changeWindowMinutes) : 60,
                  }),
            }))
          }
          value={metadata.mode || "threshold"}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select trigger mode" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectItem value="threshold" className="cursor-pointer text-sm">
                Price threshold
              </SelectItem>
              <SelectItem value="change" className="cursor-pointer text-sm">
                Price change
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {metadata.mode !== "change" ? (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              Condition
            </p>
            <p className="text-sm text-neutral-300">
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

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              Price threshold
            </p>
            <p className="text-sm text-neutral-300">
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
        </>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              Change direction
            </p>
            <Select
              onValueChange={(value) =>
                setMetadata((current: any) => ({
                  ...current,
                  changeDirection: value as "increase" | "decrease",
                }))
              }
              value={metadata.changeDirection || "increase"}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectGroup>
                  <SelectItem value="increase" className="cursor-pointer text-sm">Increase</SelectItem>
                  <SelectItem value="decrease" className="cursor-pointer text-sm">Decrease</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              Change type
            </p>
            <Select
              onValueChange={(value) =>
                setMetadata((current: any) => ({
                  ...current,
                  changeType: value as "absolute" | "percent",
                }))
              }
              value={metadata.changeType || "percent"}
            >
              <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select change type" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectGroup>
                  <SelectItem value="percent" className="cursor-pointer text-sm">Percent (%)</SelectItem>
                  <SelectItem value="absolute" className="cursor-pointer text-sm">Absolute (price points)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              Change value
            </p>
            <Input
              type="number"
              min={0}
              value={metadata.changeValue || ""}
              onChange={(e) =>
                setMetadata((current: any) => ({
                  ...current,
                  changeValue: Number(e.target.value),
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder={metadata.changeType === "absolute" ? "e.g. 50" : "e.g. 2"}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              Window (minutes)
            </p>
            <Input
              type="number"
              min={1}
              value={metadata.changeWindowMinutes || ""}
              onChange={(e) =>
                setMetadata((current: any) => ({
                  ...current,
                  changeWindowMinutes: Number(e.target.value),
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="e.g. 60"
            />
          </div>
        </>
      )}


      {/* Market Selection Indian/Web3 */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            Select Market
        </p>
        <Select
          onValueChange={(value) => {
                setMarketType(value as "Indian" | "Crypto")
                setMetadata((current: any) => ({
                ...current,
                marketType: value,
                asset: undefined,
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
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
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
