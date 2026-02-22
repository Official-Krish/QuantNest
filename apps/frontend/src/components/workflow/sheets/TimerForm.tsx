import type { TimerNodeMetadata } from "@n8n-trading/types";
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
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_MARKETS, SUPPORTED_WEB3_ASSETS } from "@n8n-trading/types";

interface TimerFormProps {
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
  metadata: TimerNodeMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
  marketType: "Indian" | "Crypto" | null;
}

export const TimerForm = ({ setMarketType, metadata, setMetadata, marketType }: TimerFormProps) => {
  return (
    <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
        Interval
      </p>
      <p className="text-xs text-neutral-400">
        Number of seconds after which the trigger should run.
      </p>
      <Input
        type="number"
        value={metadata.time}
        onChange={(e) =>
          setMetadata((current: any) => ({
            ...current,
            time: Number(e.target.value),
          }))
        }
        className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
      />
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
    </div>
  );
};
