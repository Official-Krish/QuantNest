import type { PriceTriggerNodeMetadata } from "@n8n-trading/types";
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
import { SUPPORTED_ASSETS } from "@n8n-trading/types";

interface PriceTriggerFormProps {
  metadata: PriceTriggerNodeMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const PriceTriggerForm = ({
  metadata,
  setMetadata,
}: PriceTriggerFormProps) => {
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

      {/* Asset */}
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
              {SUPPORTED_ASSETS.map((asset) => (
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
    </div>
  );
};
