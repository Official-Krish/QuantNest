import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { ComingSoonModal } from "@/components/LandingPage/ComingSoonModal";

export type PricingPlan = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  workflows: string;
  executionsPerDay: string;
  support: string;
  reporting: string;
  recommended?: boolean;
};

type PricingPlansProps = {
  plans: PricingPlan[];
};

export function PricingPlans({ plans }: PricingPlansProps) {
  const [billingMode, setBillingMode] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const discountBadge = useMemo(() => "Save ~20% annually", []);

  return (
    <>
      <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f17463]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Pricing Table
            </h2>
          </div>

          <div className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900/60 p-1">
            <button
              type="button"
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs transition ${
                billingMode === "monthly"
                  ? "bg-white text-neutral-900"
                  : "text-neutral-300 hover:text-neutral-100"
              }`}
              onClick={() => setBillingMode("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs transition ${
                billingMode === "annual"
                  ? "bg-white text-neutral-900"
                  : "text-neutral-300 hover:text-neutral-100"
              }`}
              onClick={() => setBillingMode("annual")}
            >
              Annual
            </button>
          </div>
        </div>

        {billingMode === "annual" && (
          <p className="mt-2 text-xs text-emerald-300">{discountBadge}</p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const activePrice = billingMode === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const suffix = billingMode === "monthly" ? "/mo" : "/year";

            return (
              <article
                key={plan.name}
                className={`rounded-xl border p-4 ${
                  plan.recommended
                    ? "border-[#f17463]/60 bg-[#f17463]/8"
                    : "border-neutral-800 bg-neutral-950/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-100">{plan.name}</h3>
                  {plan.recommended && (
                    <span className="rounded-full border border-[#f17463]/60 bg-[#f17463]/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#ff9b8e]">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-neutral-400">{plan.description}</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {activePrice}
                  <span className="ml-1 text-sm font-normal text-neutral-400">{suffix}</span>
                </p>

                {billingMode === "monthly" ? (
                  <p className="text-xs text-neutral-500">Annual option: {plan.annualPrice}/year</p>
                ) : (
                  <p className="text-xs text-neutral-500">Monthly option: {plan.monthlyPrice}/mo</p>
                )}

                <ul className="mt-4 space-y-2 text-xs text-neutral-300">
                  <li>Workflows: {plan.workflows}</li>
                  <li>Executions/day: {plan.executionsPerDay}</li>
                  <li>Support: {plan.support}</li>
                  <li>Reporting: {plan.reporting}</li>
                </ul>

                <button
                  type="button"
                  className="mt-4 w-full cursor-pointer rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200"
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  Buy {plan.name}
                </button>
              </article>
            );
          })}
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-neutral-800">
          <table className="min-w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/70 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Monthly</th>
                <th className="px-4 py-3 font-medium">Annual</th>
                <th className="px-4 py-3 font-medium">Workflows</th>
                <th className="px-4 py-3 font-medium">Executions/Day</th>
                <th className="px-4 py-3 font-medium">Support</th>
                <th className="px-4 py-3 font-medium">Reporting</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={`${plan.name}-row`} className="border-t border-neutral-800">
                  <td className="px-4 py-3 text-neutral-100">{plan.name}</td>
                  <td className="px-4 py-3">{plan.monthlyPrice}</td>
                  <td className="px-4 py-3">{plan.annualPrice}</td>
                  <td className="px-4 py-3">{plan.workflows}</td>
                  <td className="px-4 py-3">{plan.executionsPerDay}</td>
                  <td className="px-4 py-3">{plan.support}</td>
                  <td className="px-4 py-3">{plan.reporting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ComingSoonModal
        open={selectedPlan !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlan(null);
        }}
        title={selectedPlan ? `${selectedPlan} checkout is coming soon` : "Checkout is coming soon"}
        description="We are finalizing billing, subscriptions, and invoice flows. You can continue building workflows while plan checkout is being completed."
      />
    </>
  );
}
