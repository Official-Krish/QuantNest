import { Handle, Position } from "@xyflow/react";
import { Tags } from "lucide-react";

export const aiClassifyNode = ({
  data,
}: {
  data: {
    metadata?: {
      model?: string;
      labels?: string[];
    };
  };
}) => {
  const model = data.metadata?.model ?? "gemini-2.5-flash";
  const labels = data.metadata?.labels ?? [];
  const labelCount = labels.length;

  return (
    <div className="min-w-[240px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-emerald-500 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tags className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            AI Classify
          </span>
        </div>
        <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          {model}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-100">
        {labelCount > 0 && (
          <span className="truncate text-xs text-neutral-400">
            {labelCount} label{labelCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-emerald-400! border border-neutral-900"
      />
    </div>
  );
};
