import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBackground } from "@/components/background";
import { apiGetUsageSnapshot } from "@/http";
import type { UsageSnapshot } from "@/types/api";
import { Button } from "@/components/ui/button";

type BillingUsageProps = {
  defaultTab: "billing" | "usage";
};

const TAB_COPY: Record<"billing" | "usage", { heading: string; sub: string }> = {
  billing: {
    heading: "Billing",
    sub: "Track your current plan and upgrade-ready limits.",
  },
  usage: {
    heading: "Usage",
    sub: "Monitor workflow and AI chat quotas for your current plan.",
  },
};

function formatPlan(plan: UsageSnapshot["plan"]) {
  if (plan === "pro") return "Pro";
  if (plan === "team") return "Team";
  return "Free";
}

export function BillingUsage({ defaultTab }: BillingUsageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"billing" | "usage">(defaultTab);
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await apiGetUsageSnapshot();
        setSnapshot(next);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load usage.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const workflowRemaining = useMemo(() => {
    if (!snapshot) return 0;
    return Math.max(snapshot.limits.maxWorkflows - snapshot.usage.workflows, 0);
  }, [snapshot]);

  const chatRemaining = useMemo(() => {
    if (!snapshot) return 0;
    return Math.max(snapshot.limits.maxAiChats - snapshot.usage.aiChats, 0);
  }, [snapshot]);

  const copy = TAB_COPY[activeTab];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-black px-6 pb-10 pt-36 text-white md:px-10">
      <AppBackground />

      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">Account</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-neutral-50 md:text-4xl">
              {copy.heading}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">{copy.sub}</p>
          </div>

          <div className="inline-flex rounded-xl border border-neutral-800 bg-neutral-950/80 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("billing");
                navigate("/billing");
              }}
              className={`rounded-lg px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
                activeTab === "billing"
                  ? "bg-[#f17463]/20 text-[#ffb8ad]"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Billing
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("usage");
                navigate("/usage");
              }}
              className={`rounded-lg px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
                activeTab === "usage"
                  ? "bg-[#f17463]/20 text-[#ffb8ad]"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Usage
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-950 via-black to-neutral-950/80 p-5 md:p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-400">Loading plan data...</div>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-300">{error}</p>
              <Button
                className="bg-white text-neutral-900 hover:bg-neutral-200"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : snapshot ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Current plan</p>
                  <p className="mt-1 text-xl font-semibold text-neutral-50">{formatPlan(snapshot.plan)}</p>
                </div>
                <span className="rounded-full border border-[#f17463]/40 bg-[#f17463]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#ffb8ad]">
                  Upgrade paths available
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">Workflows</p>
                  <p className="mt-2 text-sm text-neutral-200">
                    {snapshot.usage.workflows} used / {snapshot.limits.maxWorkflows} total
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">{workflowRemaining} remaining</p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">AI chats</p>
                  <p className="mt-2 text-sm text-neutral-200">
                    {snapshot.usage.aiChats} used / {snapshot.limits.maxAiChats} total
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">{chatRemaining} remaining</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">AI iterations per chat</p>
                  <p className="mt-2 text-sm text-neutral-200">{snapshot.limits.maxAiIterationsPerChat} max edits per chat</p>
                  <p className="mt-1 text-xs text-neutral-400">For free tier this is capped at 5.</p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">AI request rate</p>
                  <p className="mt-2 text-sm text-neutral-200">{snapshot.limits.aiRequestsPerMinute} requests/minute</p>
                  <p className="mt-1 text-xs text-neutral-400">Tier-based rate limiting is active.</p>
                </div>
              </div>

              {snapshot.plan === "free" ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  Free tier limits: max 3 workflows, max 3 AI chats, and max 5 iterations per chat. Delete an existing chat to start a new one after reaching chat cap.
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default BillingUsage;
