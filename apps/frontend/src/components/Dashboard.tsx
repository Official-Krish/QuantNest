import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetAllWorkflows } from "@/http";
import type { Workflow } from "@/types/api";
import { Button } from "@/components/ui/button";
import { WorkflowTable } from "./dashboard/workflowTable";

export const Dashboard = () => {
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetAllWorkflows();
        setWorkflows(res.workflows ?? []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ??
            e?.message ??
            "Failed to load workflows",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const totalNodes = useMemo(
    () => workflows.reduce((acc, w) => acc + (w.nodes?.length ?? 0), 0),
    [workflows],
  );

  const totalEdges = useMemo(
    () => workflows.reduce((acc, w) => acc + (w.edges?.length ?? 0), 0),
    [workflows],
  );

  return (
    <div className="bg-black min-h-screen w-full pt-24 pb-10 px-6 text-white md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-neutral-50 md:text-4xl">
              Your trading workflows
            </h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              Review and iterate on the strategies you have wired into N8N
              Trading. Open any workflow to edit it in the visual builder.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Button
              className="bg-white px-5 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200 md:text-sm cursor-pointer"
              onClick={() => navigate("/create")}
            >
              + Create new workflow
            </Button>
            {error && (
              <p className="max-w-xs text-xs text-red-300">{error}</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 text-sm text-neutral-200 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Total workflows
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {loading ? "—" : workflows.length}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Each workflow represents a complete trading strategy graph.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Nodes across workflows
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {loading ? "—" : totalNodes}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Triggers, conditions, and broker actions you have configured.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Connections
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {loading ? "—" : totalEdges}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Edges that define the flow of data and execution.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-950 via-black to-neutral-950/80 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-neutral-50 md:text-lg">
                Workflows
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Click into a workflow to open it in the builder, or create a new
                one from scratch.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
                <span>Loading your workflows…</span>
              </div>
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-neutral-400">
              <p>No workflows yet.</p>
              <Button
                className="mt-4 bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200 md:text-sm"
                onClick={() => navigate("/create")}
              >
                Start your first workflow
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950/60">
              <WorkflowTable workflows={workflows} loading={loading} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

