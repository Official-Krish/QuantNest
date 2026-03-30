import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Hourglass,
  Play,
  Search,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Execution, ExecutionStatusFilter } from "./types";

interface ExecutionHistoryProps {
  loading: boolean;
  executions: Execution[];
  statusFilter: ExecutionStatusFilter;
  searchTerm: string;
  onStatusFilterChange: (status: ExecutionStatusFilter) => void;
  onSearchTermChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onTriggerNow: () => void;
  formatDate: (dateString: string) => string;
  calculateDuration: (startTime: string, endTime?: string) => string;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Success":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "Failed":
      return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
    case "InProgress":
      return <Hourglass className="h-3.5 w-3.5 animate-spin text-blue-400" />;
    default:
      return <Clock3 className="h-3.5 w-3.5 text-zinc-500" />;
  }
}

function extractDurationFromMessage(message: string): string {
  const match = message.match(/(\d+(?:\.\d+)?)\s*(ms|s|m)/i);
  if (!match) return "--";
  return `${match[1]}${match[2].toLowerCase()}`;
}

function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "Success":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "Failed":
      return "border-red-500/40 bg-red-500/10 text-red-400";
    case "InProgress":
      return "border-blue-500/40 bg-blue-500/10 text-blue-400";
    default:
      return "border-zinc-600/40 bg-zinc-800/50 text-zinc-400";
  }
}

function getExecutionDotColor(status: string): string {
  switch (status) {
    case "Success":   return "bg-emerald-400";
    case "Failed":    return "bg-red-400";
    case "InProgress": return "bg-blue-400";
    default:          return "bg-zinc-600";
  }
}

function getDateRangePreset(preset: string): { from: string; to: string } {
  const today = new Date();
  const from = new Date();
  switch (preset) {
    case "today":  from.setDate(today.getDate()); break;
    case "7d":     from.setDate(today.getDate() - 7); break;
    case "30d":    from.setDate(today.getDate() - 30); break;
    case "all":    return { from: "", to: "" };
    default:       return { from: "", to: "" };
  }
  return {
    from: from.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

export const ExecutionHistory = ({
  loading,
  executions,
  statusFilter,
  searchTerm,
  onStatusFilterChange,
  onSearchTermChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onTriggerNow,
  formatDate,
  calculateDuration,
}: ExecutionHistoryProps) => {
  const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({});
  const [datePresetOpen, setDatePresetOpen] = useState(false);

  const getDatePresetLabel = () => {
    if (!dateFrom && !dateTo) return "All time";
    const fmt = (d: string) => {
      try { return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
      catch { return d; }
    };
    return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
  };

  const handlePreset = (preset: string) => {
    const { from, to } = getDateRangePreset(preset);
    onDateFromChange(from);
    onDateToChange(to);
    setDatePresetOpen(false);
  };

  const runsById = useMemo<Record<string, number>>(
    () => executions.reduce((acc, ex, i) => ({ ...acc, [ex._id]: i + 1 }), {}),
    [executions],
  );

  const toggleRun = (id: string) =>
    setExpandedRuns((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#0d0f13]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 md:px-6">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            Execution History
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            Inspect each run and expand to view node-level outcomes.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status filters */}
          <div className="inline-flex flex-nowrap gap-1.5 overflow-x-auto">
            {(["All", "Success", "Failed", "InProgress"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  statusFilter === status
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-white/[0.07] bg-transparent text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                {status === "InProgress" ? "In Progress" : status}
              </button>
            ))}
          </div>

          {/* Date + search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setDatePresetOpen(!datePresetOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
              >
                <Clock3 className="h-3.5 w-3.5" />
                <span>{getDatePresetLabel()}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${datePresetOpen ? "rotate-180" : ""}`} />
              </button>
              {datePresetOpen && (
                <div className="absolute top-full left-0 z-10 mt-2 w-44 rounded-xl border border-white/[0.07] bg-[#0d0f13] shadow-2xl shadow-black/60">
                  {[
                    { label: "Today", value: "today" },
                    { label: "Last 7 days", value: "7d" },
                    { label: "Last 30 days", value: "30d" },
                    { label: "All time", value: "all" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePreset(p.value)}
                      className="block w-full px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-100 first:rounded-t-xl last:rounded-b-xl"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-zinc-600" />
              <input
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder="Search runs, node, message"
                className="h-6 w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none md:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
            <span className="text-sm">Loading executions…</span>
          </div>
        </div>
      ) : executions.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center px-6 py-10">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/[0.08]">
              <Zap className="h-5 w-5 text-[#f17463]" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">No executions yet</p>
            <p className="mt-1.5 text-xs text-zinc-500">
              This workflow hasn't run yet. Trigger it manually or wait for the next scheduled run.
            </p>
            <Button
              type="button"
              onClick={onTriggerNow}
              className="mt-5 bg-orange-500 text-black hover:bg-[#f17463]"
            >
              Trigger now
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4 md:px-5">
          {executions.map((execution) => {
            const steps = execution.steps || [];
            const successSteps = steps.filter((s) => s.status === "Success").length;
            const completion = steps.length === 0 ? 0 : Math.round((successSteps / steps.length) * 100);
            const isExpanded = !!expandedRuns[execution._id];
            const runNum = runsById[execution._id];

            return (
              <article
                key={execution._id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] border-l-4 border-l-[#f17463] bg-[#0b0b10] transition-all duration-200"
              >
                {/* Run header row */}
                <button
                  type="button"
                  onClick={() => toggleRun(execution._id)}
                  className="w-full px-4 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.03] md:px-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: play icon + run info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                        <Play className="h-3.5 w-3.5 fill-[#f17463] text-[#f17463]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Run #{runNum}</p>
                        <p className="text-[11px] text-zinc-500">{formatDate(execution.startTime)}</p>
                      </div>
                    </div>

                    {/* Right: timer + status badge + chevron */}
                    <div className="flex items-center gap-3">
                      <span className="hidden items-center gap-1.5 text-[11px] text-zinc-500 sm:inline-flex">
                        <Timer className="h-3 w-3" />
                        {calculateDuration(execution.startTime, execution.endTime)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${getStatusBadgeStyle(execution.status)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${getExecutionDotColor(execution.status)}`} />
                        {execution.status === "InProgress" ? "In Progress" : execution.status.toUpperCase()}
                      </span>
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-zinc-600 transition-transform duration-300" />
                        : <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform duration-300" />
                      }
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-t border-white/[0.06] bg-black/30">
                    {/* Timeline line with node cards */}
                    <div className="relative px-4 py-4 md:px-5">
                      {/* Left accent line - orange */}
                      <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-[#d66758] md:left-[22px]" />

                      <div className="space-y-4">
                        {steps.length > 0 ? (
                          steps.map((step, idx) => (
                            <div key={idx} className="relative flex gap-3 pl-12 md:pl-14">
                              {/* Timeline dot */}
                              <div className={`absolute left-2 top-2 h-4 w-4 rounded-full border-2 md:left-3 ${
                                step.status === "Success" 
                                  ? "border-emerald-500 bg-emerald-500/20" 
                                  : step.status === "Failed"
                                  ? "border-red-500 bg-red-500/20"
                                  : "border-zinc-600 bg-zinc-700/30"
                              }`} />
                              
                              {/* Node card */}
                              <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0b0d] transition-all duration-200">
                                {/* Card header */}
                                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                                      step.nodeType.toLowerCase().includes("trigger")
                                        ? "text-[#f17463]"
                                        : "text-zinc-500"
                                    }`}>
                                      {step.nodeType.replaceAll("_", " ")}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-zinc-500">
                                    {new Date(execution.startTime).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })}
                                  </span>
                                </div>

                                {/* Card title */}
                                <div className="px-4 pt-3 pb-4">
                                  <p className="text-sm font-semibold text-white">
                                    {step.nodeType.replaceAll("_", " ")}
                                  </p>

                                  {/* Metric tiles — STATUS + RESPONSE TIME */}
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="rounded-lg border border-white/[0.06] bg-[#080a0c] px-3 py-2.5 transition-all duration-200 hover:bg-[#0a0c0e] hover:border-white/10">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">Status</p>
                                      <div className="mt-1 flex items-center gap-1.5">
                                        {getStatusIcon(step.status)}
                                        <p className="text-sm font-medium text-white">
                                          {step.status === "Success" ? "Delivered" : step.status}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-white/[0.06] bg-[#080a0c] px-3 py-2.5 transition-all duration-200 hover:bg-[#0a0c0e] hover:border-white/10">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">Response Time</p>
                                      <p className="mt-1 text-sm font-medium text-white">
                                        {extractDurationFromMessage(step.message)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="pl-12 text-xs text-zinc-600 md:pl-14">No execution steps available.</p>
                        )}
                      </div>
                    </div>

                    {/* Footer — finalized message + progress */}
                    <div className="flex items-center justify-between border-t border-white/[0.05] px-4 py-3 md:px-5">
                      <p className="text-[11px] italic text-zinc-600">
                        Execution finalized. All signals dispatched.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full bg-emerald-500/60 transition-all"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-600">
                          {successSteps}/{steps.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};