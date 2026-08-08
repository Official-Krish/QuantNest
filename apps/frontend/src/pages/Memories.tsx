import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";
import {
  apiGetMemories,
  apiDeleteMemory,
  apiSearchMemories,
  apiCreateMemoryNote,
} from "@/http";
import type { MemoryEntry, MemorySearchResult } from "@/http";
import { MemoriesList } from "../components/memories/MemoriesList";
import { AppBackground } from "@/components/background";
import { ErrorState } from "@/components/ErrorState";

export const Memories = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const params: { q: string; workflowId?: string } = { q: query };
        if (workflowFilter) params.workflowId = workflowFilter;
        const results = await apiSearchMemories(params);
        setSearchResults(results);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ??
            e?.message ??
            "Could not search memories.",
        );
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, workflowFilter]);

  const handleDelete = async (id: string) => {
    await apiDeleteMemory(id);
    await fetchMemories();
    if (searchQuery.trim()) {
      setSearchResults((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSaveNote = async () => {
    const content = noteContent.trim();
    if (!content || savingNote) return;

    setSavingNote(true);
    setNoteError(null);
    try {
      await apiCreateMemoryNote({
        content,
        workflowId: workflowFilter || undefined,
      });
      setNoteContent("");
      await fetchMemories();
      if (searchQuery.trim()) {
        const results = await apiSearchMemories({
          q: searchQuery.trim(),
          workflowId: workflowFilter || undefined,
        });
        setSearchResults(results);
      }
    } catch (e: any) {
      setNoteError(
        e?.response?.data?.message ?? e?.message ?? "Could not save note.",
      );
    } finally {
      setSavingNote(false);
    }
  };

  const workflowIds = useMemo(
    () => [
      ...new Set([
        ...memories.map((m) => m.workflowId),
        ...searchResults.map((r) => r.workflowId ?? "").filter(Boolean),
      ]),
    ],
    [memories, searchResults],
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
              Semantic knowledge base — AI node results, trade executions, and
              notes
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/6 bg-[#0d0f13] p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your memory semantically…"
                className="w-full rounded-xl border border-white/10 bg-[#0b0b10] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 md:flex-row">
              <input
                type="text"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveNote();
                }}
                placeholder="Add a note… (one line per entry)"
                className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSaveNote()}
                disabled={savingNote || !noteContent.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {savingNote ? "Saving…" : "Add note"}
              </button>
            </div>
          </div>
          {noteError && (
            <p className="mt-2 text-xs text-red-400">{noteError}</p>
          )}
        </section>

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
            searchResults={searchResults}
            searching={searching}
            searchQuery={searchQuery}
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
