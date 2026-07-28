import { Handle, Position } from "@xyflow/react";
import { Sparkles, Fingerprint, GitBranch, Cpu } from "lucide-react";

export const aiDecisionNode = ({
  data,
}: {
  data: {
    metadata?: {
      provider?: string;
      model?: string;
      role?: string;
      outputSchema?: Array<{ fieldName: string; choices: string[] }>;
      approvalRequired?: boolean;
      reasoningEnabled?: boolean;
      memoryEnabled?: boolean;
    };
  };
}) => {
  const provider = data.metadata?.provider ?? "gemini";
  const model = data.metadata?.model ?? "gpt-4o";
  const role = data.metadata?.role ?? "analyst";
  const fields = data.metadata?.outputSchema ?? [];
  const fieldLabel = fields
    .map((f) => f.fieldName)
    .filter(Boolean)
    .join(", ");
  const features: string[] = [];
  if (data.metadata?.approvalRequired) features.push("approval");
  if (data.metadata?.reasoningEnabled) features.push("reasoning");
  if (data.metadata?.memoryEnabled) features.push("memory");

  return (
    <div className="min-w-[240px] rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-violet-500 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            AI Decision
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${provider === "openclaw" ? "bg-orange-900/40 text-orange-300" : "bg-violet-900/40 text-violet-300"}`}
        >
          {provider === "openclaw" ? "OpenClaw" : model}
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
      {features.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          {data.metadata?.approvalRequired && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
              <Fingerprint className="h-2.5 w-2.5" />
              Approval
            </span>
          )}
          {data.metadata?.reasoningEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-300">
              <GitBranch className="h-2.5 w-2.5" />
              Reasoning
            </span>
          )}
          {data.metadata?.memoryEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
              <Cpu className="h-2.5 w-2.5" />
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
        className="h-2! w-2! bg-violet-400! border border-neutral-900"
      />
    </div>
  );
};
