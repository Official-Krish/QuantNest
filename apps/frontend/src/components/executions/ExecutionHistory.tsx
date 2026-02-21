import { Activity, AlertCircle, BarChart3, CheckCircle2, Clock, Hourglass, Timer } from "lucide-react";
import type { Execution, ExecutionStatusFilter } from "./types";
import { getStatusPillClass } from "./utils";

interface ExecutionHistoryProps {
  loading: boolean;
  executions: Execution[];
  statusFilter: ExecutionStatusFilter;
  searchTerm: string;
  onStatusFilterChange: (status: ExecutionStatusFilter) => void;
  onSearchTermChange: (value: string) => void;
  formatDate: (dateString: string) => string;
  calculateDuration: (startTime: string, endTime?: string) => string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Success":
      return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    case "Failed":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    case "InProgress":
      return <Hourglass className="h-4 w-4 animate-spin text-yellow-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

export const ExecutionHistory = ({
  loading,
  executions,
  statusFilter,
  searchTerm,
  onStatusFilterChange,
  onSearchTermChange,
  formatDate,
  calculateDuration,
}: ExecutionHistoryProps) => {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className="flex flex-col gap-4 border-b border-neutral-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">
            Execution History
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Filter by status or search by run ID, node, and message.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="inline-flex overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900">
            {(["All", "Success", "Failed", "InProgress"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-white text-neutral-900"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
              >
                {status === "InProgress" ? "In Progress" : status}
              </button>
            ))}
          </div>

          <input
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search runs, node type, message..."
            className="h-8 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-hidden md:w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
            <span className="text-sm">Loading executions…</span>
          </div>
        </div>
      ) : executions.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-center">
            <BarChart3 className="mx-auto h-6 w-6 text-neutral-600" />
            <p className="mt-2 text-sm text-neutral-400">No matching executions</p>
            <p className="mt-1 text-xs text-neutral-500">Try changing filters or search terms.</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-neutral-800">
          {executions.map((execution) => {
            const steps = execution.steps || [];
            const successSteps = steps.filter((step) => step.status === "Success").length;
            const failedSteps = steps.filter((step) => step.status === "Failed").length;
            const completion = steps.length === 0 ? 0 : Math.round((successSteps / steps.length) * 100);

            return (
              <details key={execution._id} className="group">
                <summary className="cursor-pointer list-none px-5 py-4 hover:bg-neutral-900/70">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusPillClass(execution.status)}`}>
                        {getStatusIcon(execution.status)}
                        {execution.status === "InProgress" ? "In Progress" : execution.status}
                      </div>
                      <p className="font-mono text-xs text-neutral-500">{execution._id}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(execution.startTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        {calculateDuration(execution.startTime, execution.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        {steps.length} steps
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full bg-linear-to-r from-emerald-500 to-emerald-300 transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <span className="min-w-24 text-right text-xs text-neutral-500">
                      {successSteps} ok / {failedSteps} failed
                    </span>
                  </div>
                </summary>

                <div className="space-y-2 px-5 pb-5">
                  {steps.length > 0 ? (
                    steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="grid gap-2 rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-3 md:grid-cols-[auto_auto_auto_1fr_auto]"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-400">
                          {step.step}
                        </div>

                        <div className="inline-flex items-center gap-2 text-xs">
                          {getStatusIcon(step.status)}
                          <span className="text-neutral-300">{step.status}</span>
                        </div>

                        <span className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400">
                          {step.nodeType}
                        </span>

                        <p className="text-sm text-neutral-300">{step.message}</p>

                        <span className="font-mono text-xs text-neutral-600">{step.nodeId.slice(0, 8)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 px-4 py-3 text-xs text-neutral-500">
                      No execution steps available.
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
};
