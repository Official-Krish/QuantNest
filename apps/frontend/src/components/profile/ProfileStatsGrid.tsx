import { Activity, BadgeCheck, CalendarDays, Workflow } from "lucide-react";

type ProfileStatsGridProps = {
  totalWorkflows: number;
  totalExecutions: number;
  memberSince: string;
  accountStatus: string;
  connectedCount: number;
};

export function ProfileStatsGrid({
  totalWorkflows,
  totalExecutions,
  memberSince,
  accountStatus,
  connectedCount,
}: ProfileStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950/75 p-4">
        <div className="flex items-center gap-3">
          <Workflow className="h-5 w-5 text-[#f17463]" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Total Workflows</div>
            <div className="mt-1 text-xl font-semibold text-neutral-100">{totalWorkflows}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-950/75 p-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-[#f17463]" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Total Executions</div>
            <div className="mt-1 text-xl font-semibold text-neutral-100">{totalExecutions}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-950/75 p-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-[#f17463]" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Member Since</div>
            <div className="mt-1 text-xl font-semibold text-neutral-100">{memberSince}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-950/75 p-4">
        <div className="flex items-center gap-3">
          <BadgeCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Account Status</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-sm text-emerald-400">
                {accountStatus}
              </span>
              <span className="text-sm text-neutral-500">{connectedCount} integrations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
