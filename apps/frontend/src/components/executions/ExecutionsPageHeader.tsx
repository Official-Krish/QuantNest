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
    <section className="relative rounded-2xl border border-white/10 bg-black/90 px-5 pt-4 pb-3 md:px-6 overflow-hidden">
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
            className="flex justify-center gap-3 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b2a1f] shadow-[0_10px_30px_rgba(241,116,99,0.25)] hover:bg-[#ff8852] hover:text-[#3a2017] "
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
