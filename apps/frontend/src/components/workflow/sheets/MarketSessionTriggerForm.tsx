import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { MarketSessionTriggerNodeMetadata } from "@quantnest-trading/types";

type MarketSessionPreset = {
  id: string;
  label: string;
  description: string;
  marketType: "Indian" | "Crypto";
  event: "at-time" | "pause-at-time" | "session-window";
  triggerTime: string;
  endTime?: string;
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
    id: "indian-session-window",
    label: "Indian: Session window",
    description: "Trade between 09:20 IST and 15:20 IST.",
    marketType: "Indian",
    event: "session-window",
    triggerTime: "09:20",
    endTime: "15:20",
  },
  {
    id: "crypto-us-session",
    label: "Crypto: US session window",
    description: "Starts at 19:00 IST and stops at 02:00 IST.",
    marketType: "Crypto",
    event: "session-window",
    triggerTime: "19:00",
    endTime: "02:00",
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
  const resolvedEndTime = metadata.endTime || "02:00";
  const [event, setEvent] = useState(resolvedEvent);
  const [triggerTime, setTriggerTime] = useState(resolvedTriggerTime);
  const [endTime, setEndTime] = useState(resolvedEndTime);
  const needsTime = event === "at-time" || event === "pause-at-time" || event === "session-window";
  const needsEndTime = event === "session-window";
  const visiblePresets = MARKET_SESSION_PRESETS.filter((preset) => !marketType || preset.marketType === marketType);

  useEffect(() => {
    setEvent(resolvedEvent);
    setTriggerTime(resolvedTriggerTime);
    setEndTime(resolvedEndTime);
  }, [resolvedEndTime, resolvedEvent, resolvedTriggerTime]);

  useEffect(() => {
    setMetadata((prev) => ({
      marketType: prev.marketType || (marketType === "Crypto" ? "web3" : "indian"),
      event: prev.event || "market-open",
      triggerTime: prev.event === "at-time" || prev.event === "pause-at-time" || prev.event === "session-window"
        ? (prev.triggerTime || (marketType === "Crypto" ? "19:00" : "14:30"))
        : undefined,
      endTime: prev.event === "session-window" ? (prev.endTime || "02:00") : undefined,
    }));
  }, [marketType, setMetadata]);

  const handleMarketTypeChange = (newMarketType: "Indian" | "Crypto") => {
    setMarketType(newMarketType);
    const triggerMarketType = newMarketType === "Crypto" ? "web3" : "indian";
    setMetadata((prev) => ({
      ...prev,
      marketType: triggerMarketType,
      event:
        newMarketType === "Crypto"
          ? prev.event === "session-window"
            ? "session-window"
            : prev.event === "market-open" || prev.event === "market-close"
              ? "session-window"
              : prev.event || "session-window"
          : prev.event || "market-open",
      triggerTime:
        newMarketType === "Crypto"
          ? prev.event === "session-window"
            ? prev.triggerTime || "19:00"
            : prev.triggerTime || "19:00"
          : prev.triggerTime || (prev.event === "market-open" ? undefined : prev.triggerTime),
      endTime:
        newMarketType === "Crypto"
          ? prev.event === "session-window"
            ? prev.endTime || "02:00"
            : prev.endTime || "02:00"
          : undefined,
    }));

    if (newMarketType === "Crypto" && (event === "market-open" || event === "market-close" || event === "at-time")) {
      setEvent("session-window");
      setTriggerTime((current) => current || "19:00");
      setEndTime((current) => current || "02:00");
    }
  };

  const handleEventChange = (newEvent: "market-open" | "market-close" | "at-time" | "pause-at-time" | "session-window") => {
    setEvent(newEvent);
    setMetadata((prev) => ({
      ...prev,
      event: newEvent,
      triggerTime: newEvent === "at-time" || newEvent === "pause-at-time" || newEvent === "session-window" ? triggerTime : undefined,
      endTime: newEvent === "session-window" ? endTime : undefined,
    }));
  };

  const handlePresetSelect = (preset: MarketSessionPreset) => {
    setMarketType(preset.marketType);
    setEvent(preset.event);
    setTriggerTime(preset.triggerTime);
    setEndTime(preset.endTime || endTime);

    setMetadata((prev) => ({
      ...prev,
      marketType: preset.marketType === "Crypto" ? "web3" : "indian",
      event: preset.event,
      triggerTime: preset.triggerTime,
      endTime: preset.endTime,
    }));
  };

  const handleTimeChange = (newTime: string) => {
    setTriggerTime(newTime);
    setMetadata((prev) => ({
      ...prev,
      triggerTime: newTime,
    }));
  };

  const handleEndTimeChange = (newTime: string) => {
    setEndTime(newTime);
    setMetadata((prev) => ({
      ...prev,
      endTime: newTime,
    }));
  };

  const marketTitle = marketType === "Crypto" ? "Crypto market" : "Indian market";
  const marketDescription =
    marketType === "Crypto"
      ? "Crypto workflows are 24/7, so use a session window instead of open/close sessions."
      : "Use NSE/BSE session timing and intraday windows.";

  const eventLabel =
    event === "market-open"
      ? "Market open"
      : event === "market-close"
        ? "Market close"
        : event === "session-window"
          ? marketType === "Crypto"
            ? "US session window"
            : "Indian session window"
        : event === "pause-at-time"
          ? "Pause workflow"
          : "Run at a time";

  const eventDescription =
    event === "market-open"
      ? "Start when the market opens each trading day."
      : event === "market-close"
        ? "Fire when the market closes each trading day."
        : event === "session-window"
          ? marketType === "Crypto"
            ? "Keep the workflow active throughout the crypto session window."
            : "Keep the workflow active for an Indian session window."
        : event === "pause-at-time"
          ? "Pause the workflow at a fixed time each day."
          : "Run the workflow at a specific IST time.";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-300">
              Market Session Trigger
            </p>
            <h3 className="mt-2 text-sm font-medium text-neutral-100">
              Keep the workflow tied to a session window
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-neutral-300">
              Choose the market, select when it should fire, and optionally pause the workflow at a fixed time.
            </p>
          </div>
          <div className="rounded-full border border-[#f17463]/45 bg-[#f17463]/12 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#ffb8ad]">
            {marketTitle}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleMarketTypeChange("Indian")}
            className={`rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
              marketType === "Indian"
                ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.15)]"
                : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-100">Indian</span>
              <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                NSE / BSE
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-300">
              Intraday session timing for Indian markets.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleMarketTypeChange("Crypto")}
            className={`rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
              marketType === "Crypto"
                ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.15)]"
                : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-100">Crypto</span>
              <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                24 / 7
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-300">
              IST-based session timing for crypto workflows.
            </p>
          </button>
        </div>
        <p className="mt-3 text-sm text-neutral-300">{marketDescription}</p>
      </div>

      <div className="space-y-2 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-300">
              Timing
            </p>
            <p className="mt-1 text-sm text-neutral-300">{eventDescription}</p>
          </div>
          <div className="rounded-full border border-[#f17463]/45 bg-[#f17463]/12 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#ffb8ad]">
            {eventLabel}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {marketType !== "Crypto" && (
            <>
              <button
                type="button"
                onClick={() => handleEventChange("market-open")}
                className={`rounded-xl border px-3 py-3 text-left transition cursor-pointer ${
                  event === "market-open"
                    ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
                }`}
              >
                <div className="text-sm font-medium text-neutral-100">Market open</div>
                <div className="mt-1 text-xs text-neutral-300">Starts at 9:15 AM IST.</div>
              </button>

              <button
                type="button"
                onClick={() => handleEventChange("market-close")}
                className={`rounded-xl border px-3 py-3 text-left transition cursor-pointer ${
                  event === "market-close"
                    ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
                }`}
              >
                <div className="text-sm font-medium text-neutral-100">Market close</div>
                <div className="mt-1 text-xs text-neutral-300">Starts at 3:30 PM IST.</div>
              </button>
            </>
          )}

          {marketType === "Crypto" ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-3 sm:col-span-2 cursor-pointer">
              <div className="text-sm font-medium text-neutral-100">Use the crypto preset below</div>
              <div className="mt-1 text-xs text-neutral-300">
                Select a session window from presets, or set start and stop times manually.
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleEventChange("at-time")}
                className={`rounded-xl border px-3 py-3 text-left transition cursor-pointer ${
                  event === "at-time"
                    ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
                }`}
              >
                <div className="text-sm font-medium text-neutral-100">Run at time</div>
                <div className="mt-1 text-xs text-neutral-300">Use a specific IST time.</div>
              </button>

              <button
                type="button"
                onClick={() => handleEventChange("pause-at-time")}
                className={`rounded-xl border px-3 py-3 text-left transition cursor-pointer ${
                  event === "pause-at-time"
                    ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
                }`}
              >
                <div className="text-sm font-medium text-neutral-100">Pause workflow</div>
                <div className="mt-1 text-xs text-neutral-300">Stop execution at a fixed time.</div>
              </button>

              <button
                type="button"
                onClick={() => handleEventChange("session-window")}
                className={`rounded-xl border px-3 py-3 text-left transition cursor-pointer sm:col-span-2 ${
                  event === "session-window"
                    ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
                }`}
              >
                <div className="text-sm font-medium text-neutral-100">Indian session window</div>
                <div className="mt-1 text-xs text-neutral-300">Set a full session range with explicit start and end time.</div>
              </button>
            </>
          )}
        </div>

        {needsTime && (
          <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {event === "session-window" ? "Session start" : "Time"}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="time"
                value={triggerTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-[#f17463]"
              />
              <span className="hidden shrink-0 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-400 sm:inline-flex">
                IST
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              Use this for precise session opens, close-outs, pauses, or window starts.
            </p>
          </div>
        )}

        {needsEndTime && (
          <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {marketType === "Crypto" ? "Session stop" : "Session end"}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-[#f17463]"
              />
              <span className="hidden shrink-0 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-400 sm:inline-flex">
                IST
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              The workflow stays active during this window and stops after the end time.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-300">
            Quick presets
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            Common session setups for Indian and crypto workflows.
          </p>
        </div>
        <div className="grid gap-2">
          {visiblePresets.map((preset) => {
            const isActive =
              marketType === preset.marketType &&
              event === preset.event &&
              triggerTime === preset.triggerTime &&
              (preset.endTime ? endTime === preset.endTime : true);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`rounded-2xl border px-3 py-3 text-left transition cursor-pointer ${
                  isActive
                    ? "border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-100">{preset.label}</div>
                    <div className="mt-1 text-xs text-neutral-300">{preset.description}</div>
                  </div>
                  <div className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-mono text-neutral-300">
                    {preset.endTime ? `${preset.triggerTime} - ${preset.endTime}` : preset.triggerTime}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-black/30 p-4 text-xs text-neutral-400">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Summary
          </span>
          <span className="rounded-full border border-[#f17463]/45 bg-[#f17463]/12 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#ffb8ad]">
            Active
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Market</div>
            <div className="mt-1 text-sm text-neutral-100">{marketType || "Indian"}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Event</div>
            <div className="mt-1 text-sm text-neutral-100">
              {event === "session-window"
                ? `${eventLabel} · ${triggerTime} - ${endTime}`
                : event === "at-time" || event === "pause-at-time"
                  ? `${eventLabel} · ${triggerTime}`
                  : eventLabel}
            </div>
          </div>
        </div>
        {marketType === "Crypto" && (
          <p className="mt-3 text-[11px] text-neutral-500">
            Timing is still entered in IST for consistency across the builder.
          </p>
        )}
      </div>
    </div>
  );
};
