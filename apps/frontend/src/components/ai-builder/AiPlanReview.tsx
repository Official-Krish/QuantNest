import { Button } from "@/components/ui/button";
import type { AiPlanReviewProps } from "./types";
import {
  AssumptionsSection,
  EmptyReviewState,
  GeneratedSummary,
  LoadingState,
  MissingInputsSection,
  ValidationSection,
  WarningsSection,
  WorkflowPreview,
} from "./reviewSections";

export function AiPlanReview({
  draft,
  generating,
  editing,
  editInstruction,
  onEditInstructionChange,
  onApplyEdit,
  onResumeDraft,
  resumableDraft,
  onOpenInBuilder,
}: AiPlanReviewProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
      <p className="text-sm font-medium text-neutral-200">Plan review</p>
      {generating ? (
        <div className="mt-3">
          <LoadingState />
        </div>
      ) : !draft ? (
        <div className="mt-3 space-y-4">
          <EmptyReviewState />
          {resumableDraft ? (
            <Button
              onClick={onResumeDraft}
              variant="outline"
              className="w-full cursor-pointer border-neutral-700 bg-black text-neutral-100 hover:bg-neutral-900"
            >
              Resume saved draft
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          <GeneratedSummary result={draft} />

          <div>
            <p className="text-sm font-medium text-neutral-200">Workflow preview</p>
            <div className="mt-2">
              <WorkflowPreview result={draft} />
            </div>
          </div>

          <ValidationSection result={draft} />
          <MissingInputsSection result={draft} />
          <WarningsSection result={draft} />
          <AssumptionsSection result={draft} />

          <div className="rounded-2xl border border-neutral-800 bg-black p-4">
            <p className="text-sm font-medium text-neutral-200">Refine this draft</p>
            <textarea
              value={editInstruction}
              onChange={(e) => onEditInstructionChange(e.target.value)}
              placeholder="Add a false branch to send Discord alerts, change HDFC to INFY, convert this to alerts only..."
              className="mt-3 min-h-[110px] w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
            />
            <Button
              onClick={onApplyEdit}
              disabled={editing || editInstruction.trim().length < 4}
              variant="outline"
              className="mt-3 w-full cursor-pointer border-neutral-700 bg-neutral-950 text-neutral-100 hover:bg-neutral-900 disabled:cursor-not-allowed"
            >
              {editing ? "Applying AI edit..." : "Apply AI edit"}
            </Button>
          </div>

          <Button
            onClick={onOpenInBuilder}
            disabled={!draft.response.validation.canOpenInBuilder}
            className="w-full cursor-pointer bg-[#f17463] text-white hover:bg-[#ef826f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open in builder
          </Button>
        </div>
      )}
    </div>
  );
}
