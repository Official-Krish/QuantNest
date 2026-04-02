import type { MarketSessionTriggerNodeMetadata } from "@quantnest-trading/types";
import { Handle, Position } from "@xyflow/react";

export const MarketSessionTrigger = ({
  data,
  isConnectable,
}: {
  data: {
    metadata: MarketSessionTriggerNodeMetadata;
  };
  isConnectable: boolean;
}) => {
  const { marketType = "indian", event = "market-open", triggerTime, endTime } = data.metadata || {};

  const marketLabel = marketType === "web3" ? "Crypto" : "Indian";
  
  let eventLabel = "Market Opens";
  let timeText = "9:15 AM IST";
  
  if (event === "market-close") {
    eventLabel = "Market Closes";
    timeText = "3:30 PM IST";
  } else if (event === "session-window") {
    eventLabel = triggerTime && endTime ? `Session ${triggerTime} - ${endTime}` : "Session window";
    timeText = triggerTime && endTime ? `${triggerTime} - ${endTime}` : "session window";
  } else if (event === "at-time" && triggerTime) {
    eventLabel = `At ${triggerTime}`;
    timeText = triggerTime;
  } else if (event === "pause-at-time" && triggerTime) {
    eventLabel = `Pause at ${triggerTime}`;
    timeText = triggerTime;
  }

  return (
    <div className="min-w-52 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#10b981] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#10b981]">
          Market Session
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {marketLabel}
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {eventLabel}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        {event === "market-open" && `Executes when market opens at ${timeText}`}
        {event === "market-close" && `Executes when market closes at ${timeText}`}
        {event === "session-window" && `Executes during the session window ${timeText}`}
        {event === "at-time" && `Executes every day at ${timeText}`}
        {event === "pause-at-time" && `Pauses workflow every day at ${timeText}`}
      </div>
      <div className="mt-2 rounded-lg border border-neutral-800 bg-black/40 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">Status</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Active
          </span>
        </div>
        <div className="mt-1.5 text-[11px] font-semibold text-neutral-100">
          {event === "market-open" && "Waiting for market open"}
          {event === "market-close" && "Waiting for market close"}
          {event === "session-window" && `Active from ${timeText}`}
          {event === "at-time" && `Waiting for ${triggerTime}`}
          {event === "pause-at-time" && `Will pause at ${triggerTime}`}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="h-2! w-2! bg-[#10b981] border-2 border-[#10b981]"
      />
    </div>
  );
};
