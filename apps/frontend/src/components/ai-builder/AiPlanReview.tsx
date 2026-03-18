import { Button } from "@/components/ui/button";
import type { AiPlanReviewProps } from "./types";
import {
  AssumptionsSection,
  EmptyReviewState,
  GeneratedSummary,
  LoadingState,
  MissingInputsSection,
  WarningsSection,
  WorkflowPreview,
} from "./reviewSections";

export function AiPlanReview({ result, generating, onOpenInBuilder }: AiPlanReviewProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
      <p className="text-sm font-medium text-neutral-200">Plan review</p>
      {generating ? (
        <div className="mt-3">
          <LoadingState />
        </div>
      ) : !result ? (
        <EmptyReviewState />
      ) : (
        <div className="space-y-5">
          <GeneratedSummary result={result} />

          <div>
            <p className="text-sm font-medium text-neutral-200">Workflow preview</p>
            <div className="mt-2">
              <WorkflowPreview result={result} />
            </div>
          </div>

          <MissingInputsSection result={result} />
          <WarningsSection result={result} />
          <AssumptionsSection result={result} />

          <Button onClick={onOpenInBuilder} className="w-full cursor-pointer bg-[#f17463] text-white hover:bg-[#ef826f]">
            Open in builder
          </Button>
        </div>
      )}
    </div>
  );
}
