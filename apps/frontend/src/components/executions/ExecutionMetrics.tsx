import { AlertCircle, CheckCircle2, Timer } from "lucide-react";
import type { ExecutionMetrics as ExecutionMetricsType } from "./types";

interface ExecutionMetricsProps {
  loading: boolean;
  metrics: ExecutionMetricsType;
  avgDurationLabel: string;
}

export const ExecutionMetrics = ({ loading, metrics, avgDurationLabel }: ExecutionMetricsProps) => {
  if (loading) return null;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-neutral-500" />
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Total Executions</p>
        </div>
        <p className="text-3xl font-bold text-white">{metrics.totalCount}</p>
        <p className="mt-2 text-xs text-neutral-500">All-time workflow runs</p>
      </div>

      <div className="rounded-xl border border-green-700/30 bg-green-950/10 p-5">
        <div className="mb-3 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Successful</p>
        </div>
        <p className="text-3xl font-bold text-green-400">{metrics.successCount}</p>
        <p className="mt-2 text-xs text-green-400/70">{metrics.successRate}% success rate</p>
      </div>

      <div className="rounded-xl border border-red-700/30 bg-red-950/10 p-5">
        <div className="mb-3 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Failed</p>
        </div>
        <p className="text-3xl font-bold text-red-400">{metrics.failedCount}</p>
        <p className="mt-2 text-xs text-red-400/70">
          {metrics.totalCount > 0 ? Math.round((metrics.failedCount / metrics.totalCount) * 100) : 0}% failure rate
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <div className="mb-3 flex items-center gap-3">
          <Timer className="h-4 w-4 text-blue-400" />
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Avg Runtime</p>
        </div>
        <p className="text-3xl font-bold text-white">{avgDurationLabel}</p>
        <p className="mt-2 text-xs text-neutral-500">
          In progress: <span className="text-yellow-300">{metrics.inProgressCount}</span>
        </p>
      </div>
    </section>
  );
};
