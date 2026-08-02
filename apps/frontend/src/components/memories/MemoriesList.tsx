import { Database, RefreshCw, Trash2 } from "lucide-react";
import type { MemoryEntry } from "@/http";
import { LoadingState } from "@/components/LoadingState";

interface MemoriesListProps {
  loading: boolean;
  memories: MemoryEntry[];
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
  workflowFilter: string;
  onWorkflowFilterChange: (id: string) => void;
  workflowIds: string[];
}

export const MemoriesList = ({
  loading,
  memories,
  onRefresh,
  onDelete,
  workflowFilter,
  onWorkflowFilterChange,
  workflowIds,
}: MemoriesListProps) => {
  return (
    <section className="rounded-2xl border border-white/6 bg-[#0d0f13]">
      <div className="flex flex-col gap-4 border-b border-white/6 px-5 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
              AI Memory
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Stored context that AI nodes remember across workflow runs.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {workflowIds.length > 1 && (
          <div className="inline-flex flex-nowrap gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => onWorkflowFilterChange("")}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                !workflowFilter
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/[0.07] bg-transparent text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >
              All
            </button>
            {workflowIds.map((wid) => (
              <button
                key={wid}
                type="button"
                onClick={() => onWorkflowFilterChange(wid)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  workflowFilter === wid
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-white/[0.07] bg-transparent text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                {wid.slice(0, 8)}…
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="Loading memories…" height="md" />
      ) : memories.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center px-6 py-10">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/8">
              <Database className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              No memories stored
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              Enable "Persist memory across runs" on an AI node to store context
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4 md:px-5">
          {memories.map((memory) => (
            <article
              key={memory.id}
              className="rounded-2xl border border-white/[0.07] bg-[#0b0b10] px-5 py-4 transition-all duration-200 hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/8 bg-white/3 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                      {memory.nodeId}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      TTL: {memory.ttl}h
                    </span>
                  </div>

                  <p className="truncate text-xs text-zinc-600">
                    Workflow: {memory.workflowId}
                  </p>

                  <div className="rounded-lg border border-white/6 bg-[#080a0c] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      {memory.key}
                    </p>
                    <pre className="mt-1 max-h-40 overflow-auto text-[11px] text-zinc-300">
                      {JSON.stringify(memory.value, null, 2)}
                    </pre>
                  </div>

                  <p className="text-[11px] text-zinc-600">
                    Updated {new Date(memory.updatedAt).toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void onDelete(memory.id)}
                  className="shrink-0 rounded-lg border border-red-500/20 p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                  title="Delete memory"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
