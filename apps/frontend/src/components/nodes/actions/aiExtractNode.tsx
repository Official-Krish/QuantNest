import { Handle, Position } from "@xyflow/react";
import { ScanSearch, Lock, Search, Bookmark } from "lucide-react";

export const aiExtractNode = ({
  data,
}: {
  data: {
    metadata?: {
      model?: string;
      fields?: string[];
      approvalRequired?: boolean;
      reasoningEnabled?: boolean;
      memoryEnabled?: boolean;
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
      {(data.metadata?.approvalRequired ||
        data.metadata?.reasoningEnabled ||
        data.metadata?.memoryEnabled) && (
        <div className="mt-2 flex items-center gap-1.5">
          {data.metadata?.approvalRequired && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
              <Lock className="h-2.5 w-2.5" />
              Approval
            </span>
          )}
          {data.metadata?.reasoningEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-300">
              <Search className="h-2.5 w-2.5" />
              Reasoning
            </span>
          )}
          {data.metadata?.memoryEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
              <Bookmark className="h-2.5 w-2.5" />
              Memory
            </span>
          )}
        </div>
      )}
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
