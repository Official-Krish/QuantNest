import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiGetMemories, apiDeleteMemory } from "@/http";
import type { MemoryEntry } from "@/http";
import { MemoriesList } from "../components/memories/MemoriesList";
import { AppBackground } from "@/components/background";
import { ErrorState } from "@/components/ErrorState";

export const Memories = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState("");

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (workflowFilter) params.workflowId = workflowFilter;
      const data = await apiGetMemories(params);
      setMemories(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? "Could not load memories.",
      );
    } finally {
      setLoading(false);
    }
  }, [workflowFilter]);

  useEffect(() => {
    void fetchMemories();
  }, [fetchMemories]);

  const handleDelete = async (id: string) => {
    await apiDeleteMemory(id);
    await fetchMemories();
  };

  const workflowIds = useMemo(
    () => [...new Set(memories.map((m) => m.workflowId))],
    [memories],
  );

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-black px-6 pb-10 pt-20 text-white md:px-10">
      <AppBackground />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/8 p-1.5 text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">AI Memory</h1>
            <p className="text-xs text-zinc-500">
              Stored context that AI nodes remember across workflow runs
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState
            message={error}
            description="We could not load your AI memories. Please try again."
            onRetry={() => void fetchMemories()}
          />
        ) : (
          <MemoriesList
            loading={loading}
            memories={memories}
            onRefresh={() => void fetchMemories()}
            onDelete={handleDelete}
            workflowFilter={workflowFilter}
            onWorkflowFilterChange={setWorkflowFilter}
            workflowIds={workflowIds}
          />
        )}
      </div>
    </div>
  );
};

export default Memories;
