import type { ExecutionMetrics } from "./types";
import { ExecutionBrokerStatus } from "./ExecutionBrokerStatus";
import { Clock3, RotateCcw, Shield, SlidersHorizontal } from "lucide-react";

interface ExecutionHealthSidebarProps {
  metrics: ExecutionMetrics;
  avgDurationLabel: string;
  lastExecutionLabel: string;
  workflowStatus: "active" | "paused";
  onToggleWorkflowStatus: () => void;
  isUpdatingWorkflowStatus: boolean;
  hasZerodha: boolean;
  tokenStatus: any;
  marketStatus: any;
}

export const ExecutionHealthSidebar = ({
  metrics,
  avgDurationLabel,
  lastExecutionLabel,
  workflowStatus,
  onToggleWorkflowStatus,
  isUpdatingWorkflowStatus,
  hasZerodha,
  tokenStatus,
  marketStatus,
}: ExecutionHealthSidebarProps) => {
  const successRate = Math.max(0, Math.min(100, metrics.successRate));
  const isActive = workflowStatus === "active";

  return (
    <aside className="lg:col-span-3">
      <div className="space-y-4 lg:sticky lg:top-24">
        <section className="rounded-2xl border border-white/[0.06] bg-[#0d0f13] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg leading-none text-white md:text-xl"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
            >
              System Health
            </h3>
            <Shield className="h-5 w-5 text-[#f17463]" />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Global Success Rate
              </p>
              <span className="text-lg font-semibold text-[#f17463]">{successRate}%</span>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-black/50 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]">
              <div
                className="h-full rounded-full bg-[#f17463] shadow-[0_0_14px_rgba(241,116,99,0.85)] transition-all duration-500"
                style={{ width: `${Math.max(6, successRate)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 divide-y divide-white/8">
            <div className="flex items-center justify-between py-3">
              <div className="inline-flex items-center gap-2.5 text-neutral-300">
                <Clock3 className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-sm text-neutral-300">Avg. Runtime</span>
              </div>
              <span className="text-lg font-semibold text-white">{avgDurationLabel}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="inline-flex items-center gap-2.5 text-neutral-300">
                <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-sm text-neutral-300">Last Run</span>
              </div>
              <span className="text-lg font-semibold text-white">{lastExecutionLabel}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="inline-flex items-center gap-2.5 text-neutral-300">
                <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-sm text-neutral-300">Status</span>
              </div>

              <div className="inline-flex items-center gap-3">
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${isActive ? "text-[#f17463]" : "text-neutral-500"}`}>
                  {isActive ? "ACTIVE" : "PAUSED"}
                </span>
                <span className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 ${isActive ? "bg-[#f17463]/25" : "bg-white/10"}`}>
                  <span className={`h-4 w-4 rounded-full transition-transform ${isActive ? "translate-x-5 bg-[#f17463]" : "translate-x-0 bg-neutral-500"}`} />
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleWorkflowStatus}
            disabled={isUpdatingWorkflowStatus}
            className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-300 transition-colors hover:bg-white/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdatingWorkflowStatus
              ? "Updating..."
              : isActive
                ? "Pause Workflow"
                : "Resume Workflow"}
          </button>
        </section>

        <ExecutionBrokerStatus
          hasZerodha={hasZerodha}
          tokenStatus={tokenStatus}
          marketStatus={marketStatus}
        />
      </div>
    </aside>
  );
};
