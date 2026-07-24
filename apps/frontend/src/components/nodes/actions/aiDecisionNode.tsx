import { Handle, Position } from "@xyflow/react";
import { Sparkles } from "lucide-react";

export const aiDecisionNode = ({
  data,
}: {
  data: {
    metadata?: {
      model?: string;
      role?: string;
      outputSchema?: Array<{ fieldName: string; choices: string[] }>;
    };
  };
}) => {
  const model = data.metadata?.model ?? "gpt-4o";
  const role = data.metadata?.role ?? "analyst";
  const fields = data.metadata?.outputSchema ?? [];
  const fieldLabel = fields
    .map((f) => f.fieldName)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-w-[240px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-violet-500 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            AI Decision
          </span>
        </div>
        <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-[10px] font-mono text-violet-300">
          {model}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-100">
        <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] uppercase text-neutral-400">
          {role}
        </span>
        {fieldLabel && (
          <span className="truncate text-xs text-neutral-400">
            out: {fieldLabel}
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
        className="h-2! w-2! bg-violet-400! border border-neutral-900"
      />
    </div>
  );
};
