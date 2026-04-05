import { MessageSquarePlus, Moon, Search, Sun } from "lucide-react";
import type { AiStrategyDraftSummary } from "@/types/api";
import { SessionRow } from "./SessionRow";
import { cx, type LocalTheme } from "./shared";

type LeftSidebarProps = {
  theme: LocalTheme;
  panel: string;
  border: string;
  muted: string;
  inputClass: string;
  search: string;
  onSearchChange: (value: string) => void;
  filteredDrafts: AiStrategyDraftSummary[];
  activeDraftId?: string;
  onLoadDraft: (draftId: string) => void;
  onRenameDraft: (draftId: string, nextTitle: string) => Promise<void> | void;
  onDeleteDraft: (draftId: string) => void;
  onToggleTheme: () => void;
  onNewChat: () => void;
};

export function LeftSidebar({
  theme,
  panel,
  border,
  muted,
  inputClass,
  search,
  onSearchChange,
  filteredDrafts,
  activeDraftId,
  onLoadDraft,
  onRenameDraft,
  onDeleteDraft,
  onToggleTheme,
  onNewChat,
}: LeftSidebarProps) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const groupedDrafts = filteredDrafts.reduce<Record<string, AiStrategyDraftSummary[]>>((acc, draft) => {
    const updatedAt = new Date(draft.updatedAt);
    const updatedDay = updatedAt.toDateString();
    const bucket =
      updatedDay === now.toDateString()
        ? "Today"
        : updatedDay === yesterday.toDateString()
          ? "Yesterday"
          : "Earlier";
    acc[bucket] = [...(acc[bucket] || []), draft];
    return acc;
  }, {});

  const orderedSections = ["Today", "Yesterday", "Earlier"];

  return (
    <aside className={cx("flex h-full min-h-0 flex-col border-r", panel)}>
      <div className={cx("flex items-center justify-between border-b px-3.5 py-3", border)}>
        <div className={cx("text-[10px] font-medium uppercase tracking-[0.2em]", muted)}>Conversations</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className={cx(
              "flex h-7 w-7 items-center justify-center rounded-lg border cursor-pointer",
              theme === "dark" ? "border-neutral-700 bg-[#111111] text-neutral-300" : "border-neutral-200 bg-white text-neutral-600",
            )}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onNewChat}
            className={cx(
              "flex h-7 w-7 items-center justify-center rounded-lg border cursor-pointer",
              theme === "dark" ? "border-neutral-700 bg-[#111111] text-neutral-300" : "border-neutral-200 bg-white text-neutral-600",
            )}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3.5 py-2.5">
        <div className={cx("flex items-center gap-2 rounded-xl border px-3 py-1.5", inputClass)}>
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 pb-3.5">
        {filteredDrafts.length === 0 ? (
          <div className={cx("rounded-xl border px-3 py-4 text-sm", theme === "dark" ? "border-neutral-800 bg-black text-neutral-500" : "border-neutral-200 bg-white text-neutral-500")}>
            No conversations yet. Start a new workflow chat to see saved drafts here.
          </div>
        ) : (
          orderedSections.map((label) => {
            const drafts = groupedDrafts[label] || [];
            if (drafts.length === 0) return null;

            return (
              <div key={label} className="space-y-2">
                <div className={cx("px-1 text-[10px] font-medium uppercase tracking-[0.18em]", muted)}>{label}</div>
                {drafts.map((item) => (
                  <SessionRow
                    key={item.draftId}
                    item={item}
                    active={activeDraftId === item.draftId}
                    theme={theme}
                    onClick={() => onLoadDraft(item.draftId)}
                    onRename={(nextTitle) => onRenameDraft(item.draftId, nextTitle)}
                    onDelete={() => onDeleteDraft(item.draftId)}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className={cx("border-t px-3.5 py-3", border)}>
        <button
          type="button"
          onClick={onNewChat}
          className={cx(
            "flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-base font-normal transition cursor-pointer",
            theme === "dark"
              ? "bg-[#f17463] text-white hover:bg-[#de6151]"
              : "bg-[#f17463] text-white hover:bg-[#de6151]",
          )}
        >
          <span className="text-xl leading-none">+</span>
          New workflow
        </button>
      </div>
    </aside>
  );
}
