import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, RefreshCw, SquareArrowOutUpRight } from "lucide-react";
import { OrangeButton } from "../ui/button-orange";

interface ExecutionsPageHeaderProps {
  workflowName: string;
  onBack: () => void;
  onRefresh: () => void;
  onOpenWorkflow: () => void;
}

export const ExecutionsPageHeader = ({
  workflowName,
  onBack,
  onRefresh,
  onOpenWorkflow,
}: ExecutionsPageHeaderProps) => {
  return (
    <section className="relative rounded-2xl border border-white/6 bg-[#0d0f13] px-5 pt-4 pb-3 md:px-6 overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointerevents-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-neutral-300 transition-colors hover:text-[#f17463] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4 text-neutral-500" />
          <span className="text-neutral-300">{workflowName}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-neutral-700 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 font-medium uppercase text-xs tracking-wide cursor-pointer"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <OrangeButton
            size="md"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#f17463]/45 bg-linear-to-r from-[#f7a893] via-[#f17463] to-[#dd5f4f] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#24130d] shadow-[0_12px_30px_rgba(241,116,99,0.32)] transition-transform duration-150 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#f17463]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f13]"
            onClick={onOpenWorkflow}
          >
            <SquareArrowOutUpRight className="h-4 w-4" />
            Open Workflow
          </OrangeButton>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f17463]">
        Execution Overview
      </p>
      <h1
        className='mt-1 text-3xl leading-tight text-white md:text-4xl'
        style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
      >
        {workflowName}
      </h1>
    </section>
  );
};
