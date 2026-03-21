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
  onToggleTheme,
  onNewChat,
}: LeftSidebarProps) {
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
        {filteredDrafts.map((item) => (
          <SessionRow
            key={item.draftId}
            item={item}
            active={activeDraftId === item.draftId}
            theme={theme}
            onClick={() => onLoadDraft(item.draftId)}
          />
        ))}
      </div>
    </aside>
  );
}
