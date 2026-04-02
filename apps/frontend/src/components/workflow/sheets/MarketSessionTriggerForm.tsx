import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { MarketSessionTriggerNodeMetadata } from "@quantnest-trading/types";

type MarketSessionPreset = {
  id: string;
  label: string;
  description: string;
  marketType: "Indian" | "Crypto";
  event: "at-time" | "pause-at-time";
  triggerTime: string;
};

const MARKET_SESSION_PRESETS: MarketSessionPreset[] = [
  {
    id: "indian-after-5m",
    label: "Indian: After first 5 minutes",
    description: "Starts after opening noise settles.",
    marketType: "Indian",
    event: "at-time",
    triggerTime: "09:20",
  },
  {
    id: "indian-after-15m",
    label: "Indian: After first 15 minutes",
    description: "Opening range stabilizes before running.",
    marketType: "Indian",
    event: "at-time",
    triggerTime: "09:30",
  },
  {
    id: "indian-avoid-10m",
    label: "Indian: Avoid first 10 minutes",
    description: "Start at 09:25 IST.",
    marketType: "Indian",
    event: "at-time",
    triggerTime: "09:25",
  },
  {
    id: "indian-avoid-lunch",
    label: "Indian: Resume after 12:00-13:30",
    description: "Starts at 13:30 IST after midday pause window.",
    marketType: "Indian",
    event: "at-time",
    triggerTime: "13:30",
  },
  {
    id: "indian-stop-new-trades",
    label: "Indian: Stop new trades after 15:00",
    description: "Pauses workflow at 15:00 IST.",
    marketType: "Indian",
    event: "pause-at-time",
    triggerTime: "15:00",
  },
  {
    id: "indian-close-by-1520",
    label: "Indian: Close all positions by 15:20",
    description: "Trigger at 15:20 IST (add closing actions downstream).",
    marketType: "Indian",
    event: "at-time",
    triggerTime: "15:20",
  },
  {
    id: "crypto-us-session",
    label: "Crypto: Trade during US session",
    description: "Starts at 19:00 IST (approx US session open).",
    marketType: "Crypto",
    event: "at-time",
    triggerTime: "19:00",
  },
];

interface MarketSessionTriggerFormProps {
  marketType: "Indian" | "Crypto" | null;
  setMarketType: Dispatch<SetStateAction<"Indian" | "Crypto" | null>>;
  metadata: MarketSessionTriggerNodeMetadata;
  setMetadata: Dispatch<SetStateAction<MarketSessionTriggerNodeMetadata>>;
}

export const MarketSessionTriggerForm = ({
  marketType,
  setMarketType,
  metadata,
  setMetadata,
}: MarketSessionTriggerFormProps) => {
  const resolvedEvent = metadata.event || "market-open";
  const resolvedTriggerTime = metadata.triggerTime || "14:30";
  const [event, setEvent] = useState(resolvedEvent);
  const [triggerTime, setTriggerTime] = useState(resolvedTriggerTime);

  useEffect(() => {
    setEvent(resolvedEvent);
    setTriggerTime(resolvedTriggerTime);
  }, [resolvedEvent, resolvedTriggerTime]);

  useEffect(() => {
    setMetadata((prev) => ({
      marketType: prev.marketType || (marketType === "Crypto" ? "web3" : "indian"),
      event: prev.event || "market-open",
      triggerTime: prev.event === "at-time" || prev.event === "pause-at-time" ? (prev.triggerTime || "14:30") : undefined,
    }));
  }, [marketType, setMetadata]);

  const handleMarketTypeChange = (newMarketType: "Indian" | "Crypto") => {
    setMarketType(newMarketType);
    const triggerMarketType = newMarketType === "Crypto" ? "web3" : "indian";
    setMetadata((prev) => ({
      ...prev,
      marketType: triggerMarketType,
    }));
  };

  const handleEventChange = (newEvent: "market-open" | "market-close" | "at-time" | "pause-at-time") => {
    setEvent(newEvent);
    setMetadata((prev) => ({
      ...prev,
      event: newEvent,
      triggerTime: newEvent === "at-time" || newEvent === "pause-at-time" ? triggerTime : undefined,
    }));
  };

  const handlePresetSelect = (preset: MarketSessionPreset) => {
    setMarketType(preset.marketType);
    setEvent(preset.event);
    setTriggerTime(preset.triggerTime);

    setMetadata((prev) => ({
      ...prev,
      marketType: preset.marketType === "Crypto" ? "web3" : "indian",
      event: preset.event,
      triggerTime: preset.triggerTime,
    }));
  };

  const handleTimeChange = (newTime: string) => {
    setTriggerTime(newTime);
    setMetadata((prev) => ({
      ...prev,
      triggerTime: newTime,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">Market</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleMarketTypeChange("Indian")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              marketType === "Indian"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Indian (NSE/BSE)
          </button>
          <button
            onClick={() => handleMarketTypeChange("Crypto")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              marketType === "Crypto"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Crypto
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">Event</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleEventChange("market-open")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              event === "market-open"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Market Opens (9:15 AM)
          </button>
          <button
            onClick={() => handleEventChange("market-close")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              event === "market-close"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Market Closes (3:30 PM)
          </button>
          <button
            onClick={() => handleEventChange("at-time")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              event === "at-time"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            At Specific Time
          </button>
          <button
            onClick={() => handleEventChange("pause-at-time")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              event === "pause-at-time"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Pause Workflow At Time
          </button>
        </div>
      </div>

      {(event === "at-time" || event === "pause-at-time") && (
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Time (24-hour format)</label>
          <input
            type="time"
            value={triggerTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-neutral-400 mt-1">
            Use cases: Trade between 9:20 and 2:30, Close workflow at 3:20 PM
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-300">Quick presets</label>
        <div className="grid gap-2">
          {MARKET_SESSION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-neutral-900"
            >
              <div className="text-xs font-medium text-neutral-100">{preset.label}</div>
              <div className="text-[11px] text-neutral-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-lg p-3 text-xs text-neutral-400 space-y-1">
        <div className="font-medium text-neutral-300">Timing:</div>
        {event === "market-open" && (
          <div>Triggers every weekday when market opens at 9:15 AM IST</div>
        )}
        {event === "market-close" && (
          <div>Triggers every weekday when market closes at 3:30 PM IST</div>
        )}
        {event === "at-time" && (
          <div>Triggers every weekday at {triggerTime} IST</div>
        )}
        {event === "pause-at-time" && (
          <div>Pauses this workflow every weekday at {triggerTime} IST</div>
        )}
        {marketType === "Crypto" && (
          <div>Market session events are IST-based. Crypto markets operate 24/7.</div>
        )}
      </div>
    </div>
  );
};
