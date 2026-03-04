import { ArrowRight, CheckCircle2 } from "lucide-react";

type PlanPreview = {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  highlighted?: boolean;
};

const plans: PlanPreview[] = [
  {
    name: "Starter",
    price: "$19/mo",
    subtitle: "For solo traders validating workflow ideas.",
    features: ["Up to 10 workflows", "2,000 executions/day", "Basic reporting"],
  },
  {
    name: "Pro",
    price: "$79/mo",
    subtitle: "For active operators running multiple live strategies.",
    features: ["Up to 50 workflows", "25,000 executions/day", "Advanced AI reporting"],
    highlighted: true,
  },
  {
    name: "Team",
    price: "$249/mo",
    subtitle: "For desks with governance and shared ownership.",
    features: ["Unlimited workflows", "150,000+ executions/day", "SLA support + exports"],
  },
];

export const PricingPreview = () => {
  return (
    <section className="border-y border-neutral-800 bg-black">
      <div className="mx-4 my-14 rounded-3xl border border-neutral-800/80 bg-linear-to-br from-neutral-950 via-black to-neutral-950/80 p-6 md:mx-12 md:p-8 lg:mx-20 lg:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
              Pricing
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-50 md:text-3xl">
              Plans that scale with execution volume
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Start lean, then scale workflows, reporting, and support as your
              strategy operations grow.
            </p>
          </div>
          <a
            href="/pricing"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-200 transition hover:bg-neutral-900"
          >
            View full pricing
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-5 ${
                plan.highlighted
                  ? "border-[#f17463]/60 bg-[#f17463]/8"
                  : "border-neutral-800 bg-neutral-950/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-200">
                  {plan.name}
                </h3>
                {plan.highlighted && (
                  <span className="rounded-full border border-[#f17463]/60 bg-[#f17463]/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#ff9b8e]">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{plan.price}</p>
              <p className="mt-1 text-xs text-neutral-400">{plan.subtitle}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-neutral-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
