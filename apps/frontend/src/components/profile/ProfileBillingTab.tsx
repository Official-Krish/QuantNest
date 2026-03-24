import { Button } from "@/components/ui/button";

type ProfileBillingTabProps = {
  billingPlan: "Starter" | "Pro" | "Team";
  nextBillingDate: string;
  executionsThisMonth: number;
  executionQuota: number;
  usagePercent: number;
};

export function ProfileBillingTab({
  billingPlan,
  nextBillingDate,
  executionsThisMonth,
  executionQuota,
  usagePercent,
}: ProfileBillingTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-neutral-100">Billing & Usage</div>
          <p className="mt-1 text-sm text-neutral-400">
            Review your current plan, usage, and upcoming billing details.
          </p>
        </div>

        <span className="rounded-full bg-[#f17463]/12 px-3 py-1.5 text-sm font-medium text-[#f7b2a7]">
          {billingPlan} plan
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-neutral-800 bg-black/40 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Next billing date</div>
          <div className="mt-3 text-2xl font-semibold text-neutral-100">{nextBillingDate}</div>
          <Button className="mt-5 cursor-pointer rounded-2xl bg-[#f17463] px-5 text-neutral-100 hover:bg-[#f48b7d]">
            Upgrade / Downgrade
          </Button>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-black/40 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Usage this month</div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold text-neutral-100">{executionsThisMonth}</div>
              <div className="text-sm text-neutral-400">executions out of {executionQuota}</div>
            </div>
            <div className="rounded-full bg-neutral-900 px-3 py-1 text-sm text-neutral-300">
              {usagePercent}%
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-900">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#f17463] to-[#f7b2a7]"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
