import type { TimerNodeMetadata } from "@quantnest-trading/types";
import { Handle, Position } from "@xyflow/react";

export const Timer = ({
  data,
  isConnectable,
}: {
  data: {
    metadata: TimerNodeMetadata;
  };
  isConnectable: boolean;
}) => {
  const time = data.metadata?.time || 3600;
  const hours = time / 3600;

  return (
    <div className="min-w-[220px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
          Timer
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          {hours}h
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        Every {hours} hours
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        Schedules downstream actions on this cadence.
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!h-2 !w-2 !bg-[#f17463] border border-neutral-900"
      />
    </div>
  );
}
