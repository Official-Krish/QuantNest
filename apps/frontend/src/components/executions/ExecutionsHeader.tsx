import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Key, RefreshCw } from "lucide-react";

interface ExecutionsHeaderProps {
  workflowName: string;
  hasZerodha: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onOpenWorkflow: () => void;
}

export const ExecutionsHeader = ({
  workflowName,
  hasZerodha,
  onBack,
  onRefresh,
  onOpenWorkflow,
}: ExecutionsHeaderProps) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-neutral-900 to-black p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(241,116,99,0.14),transparent_35%)]" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Workflow Executions
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {workflowName}
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Monitor runtime health, execution reliability, and step-level outcomes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
            onClick={onOpenWorkflow}
          >
            Open Workflow
            <ChevronRight className="h-4 w-4" />
          </Button>
          {hasZerodha && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
              onClick={onOpenWorkflow}
            >
              <Key className="h-4 w-4" />
              Manage Token
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
