import { useState } from "react";
import type { TimerNodeMetadata } from "@quantnest-trading/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_MARKETS } from "@quantnest-trading/types";

interface TimerFormProps {
  setMarketType: React.Dispatch<
    React.SetStateAction<"Indian" | "Crypto" | null>
  >;
  metadata: TimerNodeMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
  marketType: "Indian" | "Crypto" | null;
}

const UNIT_MULTIPLIER: Record<string, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
};

function pickUnit(seconds: number): string {
  if (Number.isFinite(seconds) && seconds > 0) {
    if (seconds % 3600 === 0) return "hours";
    if (seconds % 60 === 0) return "minutes";
  }
  return "seconds";
}

export const TimerForm = ({
  setMarketType,
  metadata,
  setMetadata,
}: TimerFormProps) => {
  const [unit, setUnit] = useState<string>(() =>
    pickUnit(Number(metadata.time)),
  );

  const seconds = Number(metadata.time) || 0;
  const displayValue =
    seconds > 0
      ? String(Math.round((seconds / UNIT_MULTIPLIER[unit]) * 10000) / 10000)
      : "";

  const handleUnitChange = (nextUnit: string) => {
    const currentSeconds = Number(metadata.time) || 0;
    setUnit(nextUnit);
    setMetadata((current: any) => ({
      ...current,
      time:
        Math.round(currentSeconds / UNIT_MULTIPLIER[nextUnit]) *
        UNIT_MULTIPLIER[nextUnit],
    }));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
        Interval
      </p>
      <p className="text-sm text-neutral-300">
        How often should this workflow run?
      </p>
      <div className="mt-1 grid grid-cols-[1fr_7rem] items-center gap-2">
        <Input
          type="number"
          min={0}
          value={displayValue}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              time: Number(e.target.value) * UNIT_MULTIPLIER[unit],
            }))
          }
          placeholder="e.g. 5"
          className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectItem
              value="seconds"
              className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
            >
              Seconds
            </SelectItem>
            <SelectItem
              value="minutes"
              className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
            >
              Minutes
            </SelectItem>
            <SelectItem
              value="hours"
              className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
            >
              Hours
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
          Select Market
        </p>
        <Select
          onValueChange={(value) => {
            setMarketType(value as "Indian" | "Crypto");
            setMetadata((current: any) => ({
              ...current,
              marketType: value,
            }));
          }}
          value={metadata.marketType}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select a market" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
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
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
