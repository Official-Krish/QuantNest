import { useState } from "react";
import { ComingSoonModal } from "@/components/LandingPage/ComingSoonModal";
import { OrangeButton } from "@/components/ui/button-orange";
import { Button } from "@/components/ui/button";

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

  return (
    <>
      <div className="mt-8 text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-50">
          Simple pricing for serious traders
        </h2>
      </div>

      <div className="mb-6 flex justify-center">
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

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const activePrice = billingMode === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const suffix = billingMode === "monthly" ? "/mo" : "/year";
            const monthlyPrice = parseFloat(plan.monthlyPrice.replace("$", ""));
            const annualPrice = parseFloat(plan.annualPrice.replace("$", ""));
            const savings = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);

            return (
              <article
                key={plan.name}
                className={`rounded-xl border p-5 ${
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
                
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-white">{activePrice}</p>
                  <span className="text-sm font-normal text-neutral-400">{suffix}</span>
                  {billingMode === "annual" && (
                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      Save {savings}%
                    </span>
                  )}
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-neutral-300">
                  <li>Workflows: {plan.workflows}</li>
                  <li>Executions/day: {plan.executionsPerDay}</li>
                  <li>Support: {plan.support}</li>
                  <li>Reporting: {plan.reporting}</li>
                </ul>

                {plan.recommended ? (
                  <OrangeButton
                    fullWidth
                    size="md"
                    className="mt-5"
                    onClick={() => setSelectedPlan(plan.name)}
                  >
                    Buy {plan.name}
                  </OrangeButton>
                ) : (
                  <Button
                    type="button"
                    className="mt-5 w-full cursor-pointer rounded-lg bg-white px-4 py-2 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200"
                    onClick={() => setSelectedPlan(plan.name)}
                  >
                    Buy {plan.name}
                  </Button>
                )}
              </article>
            );
          })}
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
