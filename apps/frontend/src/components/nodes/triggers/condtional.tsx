import { Handle, Position } from "@xyflow/react";

export const conditionTrigger = ({
  data,
}: {
  data: {
    metadata: {
      conditionType?: string;
      expectedEvent?: string;
      marketType?: string;
      asset?: string;
      targetPrice?: number;
      timeWindowMinutes?: number;
    };
  };
}) => {
  const { marketType, asset, targetPrice, timeWindowMinutes } = data.metadata || {};

  // Compose extra details if present
  const details: Array<{ label: string; value: string | number }> = [];
  if (marketType) details.push({ label: "Market", value: marketType });
  if (asset) details.push({ label: "Asset", value: asset });
  if (typeof targetPrice === "number") details.push({ label: "Target Price", value: targetPrice });
  if (typeof timeWindowMinutes === "number") details.push({ label: "Time Window (min)", value: timeWindowMinutes });

  return (
    <div className="min-w-[230px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
          Condition
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          IF
        </span>
      </div>
      {details.length > 0 && (
        <div className="mt-1 space-y-0.5 text-xs text-neutral-300">
          {details.map((d) => (
            <div key={d.label}>
              <span className="font-semibold text-neutral-400">{d.label}:</span> {d.value}
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 text-[11px] text-neutral-400">
        True branch runs if condition matches; otherwise false.
      </div>
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        style={{ top: "35%" }}
        className="h-2! w-2! bg-emerald-400! border border-neutral-900"
      />
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        style={{ top: "65%" }}
        className="h-2! w-2! bg-red-400! border border-neutral-900"
      />
      <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-neutral-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          True
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          False
        </span>
      </div>
    </div>
  );
};
