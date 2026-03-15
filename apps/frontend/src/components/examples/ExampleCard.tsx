import type { WorkflowExample } from "@/types/api";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { ExampleWorkflowGraph } from "./ExampleWorkflowGraph";

type ExampleCardProps = {
  example: WorkflowExample;
  onUse: (example: WorkflowExample) => void;
};

export function ExampleCard({ example, onUse }: ExampleCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
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
          <span>{example.nodeFlow.join(" -> ")}</span>
        </div>
      </div>

      <ExampleWorkflowGraph example={example} />

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

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 cursor-pointer"
          onClick={() => onUse(example)}
        >
          Use this workflow
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}