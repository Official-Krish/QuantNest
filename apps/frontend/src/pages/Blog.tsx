import { ArrowRight, CalendarClock, User2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hasAuthSession } from "@/http";
import { AppBackground } from "@/components/background";

export const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black px-6 pb-16 pt-28 text-white md:px-10">
      <AppBackground />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_480px_at_82%_-8%,rgba(241,116,99,0.15),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_100%_78%,rgba(56,189,248,0.09),transparent_66%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_24%,transparent_78%,rgba(255,255,255,0.015))]" />
      </div>
      <div className="mx-auto max-w-4xl">
        <article className="rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-black to-neutral-950/80 p-7 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-300">
            <CalendarClock className="h-3.5 w-3.5 text-[#f17463]" />
            <span>Published: March 2026</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
            Building QuantNest: Why we chose visual workflows for trading automation
          </h1>

          <div className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-400">
            <User2 className="h-4 w-4" />
            <span>By QuantNest Engineering</span>
          </div>

          <div className="mt-7 space-y-5 text-sm leading-7 text-neutral-300 md:text-base">
            <p>
              QuantNest started with a practical problem: most trading automation tools are either too rigid for fast idea iteration or too fragile for production use.
              Traders needed a way to compose triggers, conditions, and actions without losing control over execution quality.
            </p>
            <p>
              Our approach is a visual builder backed by strict execution contracts. You define intent as a flow graph. The engine handles scheduling, condition routing,
              and action dispatch while preserving traceable execution logs for every run.
            </p>
            <p>
              We also treat AI as an optional layer, not a black box dependency. AI reasoning is consent-gated per action, and credentials are isolated from model payloads.
              This allows teams to adopt insights where useful without forcing AI into every workflow.
            </p>
            <p>
              Over the next releases, we are expanding templates, production docs, and policy coverage so teams can move from prototype to deploy with less friction.
              If you are already automating strategies, we built QuantNest to fit your workflow, not replace your judgment.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 text-sm text-neutral-300">
            Next in this series: architecture deep-dive on conditional execution and daily reporting actions.
          </div>

          <button
            type="button"
            className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
            onClick={() =>
              navigate(hasAuthSession() ? "/create/onboarding" : "/signup")
            }
          >
            Start Building
            <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </div>
    </div>
  );
};
