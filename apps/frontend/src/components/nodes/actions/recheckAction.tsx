import { Handle, Position } from "@xyflow/react";

function formatDelay(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function countClausesInExpression(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const expressionNode = node as { type?: unknown; conditions?: unknown[] };

  if (expressionNode.type === "clause") return 1;
  if (!Array.isArray(expressionNode.conditions)) return 0;

  let total = 0;
  for (const condition of expressionNode.conditions) {
    if (!condition || typeof condition !== "object") continue;
    const typedCondition = condition as { type?: unknown; conditions?: unknown[] };
    if (typedCondition.type === "clause") {
      total += 1;
      continue;
    }
    if (typedCondition.type === "group") {
      total += countClausesInExpression(typedCondition);
    }
  }

  return total;
}

export const recheckAction = ({
  data,
}: {
  data: {
    metadata: {
      durationSeconds?: number;
      recheckMode?: "trigger" | "custom";
      expression?: { conditions?: unknown[] };
      asset?: string;
    };
  };
}) => {
  const durationSeconds = Number(data.metadata?.durationSeconds || 0);
  const recheckMode = String(data.metadata?.recheckMode || "trigger").toLowerCase() === "custom"
    ? "custom"
    : "trigger";
  const customGroups = Array.isArray(data.metadata?.expression?.conditions)
    ? data.metadata.expression.conditions.length
    : 0;
  const customClauses = countClausesInExpression(data.metadata?.expression);
  const formattedDelay = formatDelay(durationSeconds);

  const modeSummary = recheckMode === "custom"
    ? `Custom condition${customGroups ? ` (${customGroups} group${customGroups > 1 ? "s" : ""}` : ""}${customClauses ? `, ${customClauses} clause${customClauses > 1 ? "s" : ""}` : ""}${customGroups ? ")" : ""}`
    : "Re-check using trigger condition";
  const modeLabel = recheckMode === "custom" ? "Custom condition" : "Same as trigger";

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#60a5fa] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
          Re-check
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          GATE
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {durationSeconds > 0 ? `Wait ${formattedDelay}, then validate` : "No re-check delay set"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400">
        {modeSummary}
      </div>
      <div className="mt-2 space-y-1.5 rounded-md border border-neutral-800 bg-neutral-900/70 px-2.5 py-2 text-[10px] uppercase tracking-[0.14em] text-neutral-300">
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500">Delay</span>
          <span className="text-neutral-100">{formattedDelay}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500">Mode</span>
          <span className="text-neutral-100">{modeLabel}</span>
        </div>
        {recheckMode === "custom" ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-neutral-500">Groups</span>
              <span className="text-neutral-100">{customGroups || 0}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-neutral-500">Clauses</span>
              <span className="text-neutral-100">{customClauses || 0}</span>
            </div>
          </>
        ) : null}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
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
      <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-neutral-400">
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
