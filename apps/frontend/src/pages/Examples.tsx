import { useEffect, useState } from "react";
import { apiGetExamples, hasAuthSession } from "@/http";
import type { WorkflowExample } from "@/types/api";
import { ArrowRight, Clock3, GitBranch, Sparkles } from "lucide-react";

export const Examples = () => {
  const [examples, setExamples] = useState<WorkflowExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExamples = async () => {
      try {
        const res = await apiGetExamples();
        setExamples(res.examples);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Could not load examples.");
      } finally {
        setLoading(false);
      }
    };

    void loadExamples();
  }, []);

  return (
    <div className="min-h-screen bg-black px-6 pb-16 pt-32 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950/80 p-8 md:p-10">
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#f17463]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#f17463]">
              Example workflows
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              Real workflow patterns you can adapt, not empty templates
            </h1>
            <p className="text-base leading-7 text-neutral-400 md:text-lg">
              These examples show how QuantNest can be used for alerts, execution,
              reporting, and AI-assisted review. Treat them as production-style
              starting points and adapt the trigger, logic, and action chain to your setup.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
              onClick={() => {
                window.location.href = hasAuthSession() ? "/create/onboarding" : "/signup";
              }}
            >
              Start from scratch
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-8 text-sm text-neutral-400">
            Loading example workflows...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-8 text-sm text-red-200">
            {error}
          </div>
        ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {examples.map((example) => (
            <article
              key={example.slug}
              className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#f17463]/30 bg-[#f17463]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#f4937d]">
                  {example.category}
                </span>
                <span className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                  {example.market}
                </span>
                <span className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                  {example.difficulty}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">
                  {example.title}
                </h2>
                <p className="text-sm leading-6 text-neutral-400">{example.summary}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-xs text-neutral-400">
                <div className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#f17463]" />
                  <span>{example.setupMinutes} min setup</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-sky-300" />
                  <span>{example.nodeFlow.join(" -> ")}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-2xl border border-neutral-800 bg-black/40 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Trigger
                  </p>
                  <p className="mt-1 text-sm text-neutral-300">{example.trigger}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Logic
                  </p>
                  <p className="mt-1 text-sm text-neutral-300">{example.logic}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Actions
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                    {example.actions.map((action) => (
                      <li key={action} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#f17463]" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Expected outcome
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                    {example.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
