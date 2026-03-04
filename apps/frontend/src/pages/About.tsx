import { ArrowRight, Building2, Target, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hasAuthSession } from "@/http";

export const About = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black px-6 pb-16 pt-28 text-white md:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_480px_at_82%_-8%,rgba(241,116,99,0.16),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_100%_78%,rgba(56,189,248,0.09),transparent_66%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_24%,transparent_78%,rgba(255,255,255,0.015))]" />
      </div>
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-black to-neutral-950/80 p-7 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-300">
            <Building2 className="h-3.5 w-3.5 text-[#f17463]" />
            <span>About QuantNest</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
            We build trading automation workflows that are clear, reliable, and practical.
          </h1>

          <p className="mt-4 text-sm leading-7 text-neutral-300 md:text-base">
            QuantNest helps traders and quant teams move from strategy idea to live execution without stitching together multiple tools.
            You design workflows visually, connect broker and reporting actions, and track every execution step with full context.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-300" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-200">
                What we are
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              A workflow-first trading automation platform focused on execution quality. We are built for users who need speed in strategy iteration,
              but still want control, guardrails, and observability.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-sky-300" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-200">
                What we do
              </h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-400">
              <li>Build trigger → condition → action workflows visually.</li>
              <li>Connect brokers, notifications, and reporting endpoints.</li>
              <li>Provide execution logs for every workflow run.</li>
              <li>Enable consent-based AI insights for reporting actions.</li>
            </ul>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
          <p className="text-sm text-neutral-300">
            Our goal is straightforward: reduce operational friction in automated trading so teams can focus on strategy quality, not platform complexity.
          </p>

          <button
            type="button"
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
            onClick={() =>
              navigate(hasAuthSession() ? "/create/onboarding" : "/signup")
            }
          >
            Start Building
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    </div>
  );
};
