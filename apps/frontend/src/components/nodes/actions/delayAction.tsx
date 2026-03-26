import { Handle, Position } from "@xyflow/react";

export const delayAction = ({
  data,
}: {
  data: {
    metadata: {
      durationSeconds?: number;
    };
  };
}) => {
  const durationSeconds = Number(data.metadata?.durationSeconds || 0);

  return (
    <div className="min-w-[220px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          Delay
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          WAIT
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {durationSeconds > 0 ? `${durationSeconds}s pause` : "No delay set"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Pauses execution before continuing downstream
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-amber-300! border border-neutral-900"
      />
    </div>
  );
};
