import { Handle, Position } from "@xyflow/react";
import { ScanSearch } from "lucide-react";

export const aiExtractNode = ({
  data,
}: {
  data: {
    metadata?: {
      model?: string;
      fields?: string[];
    };
  };
}) => {
  const model = data.metadata?.model ?? "gemini-2.5-flash";
  const fields = data.metadata?.fields ?? [];
  const fieldCount = fields.length;

  return (
    <div className="min-w-[240px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-sky-500 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ScanSearch className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            AI Extract
          </span>
        </div>
        <span className="rounded-full bg-sky-900/40 px-2 py-0.5 text-[10px] font-mono text-sky-300">
          {model}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-100">
        {fieldCount > 0 && (
          <span className="truncate text-xs text-neutral-400">
            {fieldCount} field{fieldCount !== 1 ? "s" : ""}
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
        className="h-2! w-2! bg-sky-400! border border-neutral-900"
      />
    </div>
  );
};
