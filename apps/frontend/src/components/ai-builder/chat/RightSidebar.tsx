import type { AiStrategyDraftSession } from "@/types/api";
import { SmallPill } from "./SmallPill";
import { WorkflowCanvasCard } from "./WorkflowCanvasCard";
import { cx, type LocalTheme } from "./shared";

type RightSidebarProps = {
  panel: string;
  border: string;
  muted: string;
  heading: string;
  theme: LocalTheme;
  selectedVersion: AiStrategyDraftSession["workflowVersions"][number] | null;
  activeDraft: AiStrategyDraftSession | null;
  activeVersionId: string;
  onSelectVersion: (id: string) => void;
};

export function RightSidebar({
  panel,
  border,
  muted,
  heading,
  theme,
  selectedVersion,
  activeDraft,
  activeVersionId,
  onSelectVersion,
}: RightSidebarProps) {
  return (
    <aside className={cx("h-full overflow-y-auto", panel)}>
      <div className="space-y-0">
        <div className={cx("border-b px-4 py-3", border)}>
          <div className={cx("text-[10px] font-medium uppercase tracking-[0.2em]", muted)}>Workflow Preview</div>
        </div>

        {selectedVersion ? (
          <div className={cx("border-b px-4 py-4", border)}>
            <WorkflowCanvasCard version={selectedVersion} theme={theme} compact />
          </div>
        ) : null}

        <div className={cx("border-b px-4 py-4", border)}>
          <div className={cx("mb-4 text-xs font-medium uppercase tracking-[0.18em]", muted)}>Version History</div>
          <div className="space-y-3">
            {activeDraft?.workflowVersions.length ? (
              activeDraft.workflowVersions.map((version, index) => {
                const isActive = version.id === activeVersionId;
                return (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => onSelectVersion(version.id)}
                    className={cx(
                      "w-full rounded-2xl border px-4 py-4 text-left transition",
                      isActive
                        ? theme === "dark"
                          ? "border-[#f17463]/50 bg-[#f17463]/8"
                          : "border-[#f17463]/40 bg-[#fff3ee]"
                        : theme === "dark"
                          ? "border-neutral-800 bg-[#0f0f0f] hover:border-neutral-700"
                          : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={cx("text-sm font-medium", isActive ? "text-[#f17463]" : heading)}>
                          {index === 0 ? "Initial Generation" : version.label}
                        </div>
                        <div className={cx("mt-1 text-xs", muted)}>{version.response.plan.workflowName}</div>
                      </div>
                      <div className={cx("rounded-full px-2 py-0.5 text-[10px]", theme === "dark" ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-500")}>
                        v{index + 1}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SmallPill label={version.response.plan.marketType} theme={theme} />
                      <SmallPill label={`${version.response.plan.nodes.length}`} theme={theme} />
                      <SmallPill label={`${version.response.validation.branchCount} branches`} theme={theme} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className={cx("rounded-2xl border px-4 py-4 text-sm", panel)}>Generated workflow versions will appear here.</div>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className={cx("mb-4 text-xs font-medium uppercase tracking-[0.18em]", muted)}>Context</div>
          <div className={cx("rounded-2xl border p-4 text-sm leading-7", panel)}>
            <div><span className={muted}>Prompt:</span> {selectedVersion?.prompt || "No prompt selected."}</div>
            {selectedVersion?.instruction ? (
              <div className="mt-3"><span className={muted}>Edit:</span> {selectedVersion.instruction}</div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
