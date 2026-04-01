import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { MarketSessionTriggerNodeMetadata } from "@quantnest-trading/types";

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
      triggerTime: prev.event === "at-time" ? (prev.triggerTime || "14:30") : undefined,
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

  const handleEventChange = (newEvent: "market-open" | "market-close" | "at-time") => {
    setEvent(newEvent);
    setMetadata((prev) => ({
      ...prev,
      event: newEvent,
      triggerTime: newEvent === "at-time" ? triggerTime : undefined,
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
        </div>
      </div>

      {event === "at-time" && (
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
        {marketType === "Crypto" && (
          <div>Market session events are IST-based. Crypto markets operate 24/7.</div>
        )}
      </div>
    </div>
  );
};
