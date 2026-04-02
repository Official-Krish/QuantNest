import type { SessionRowProps } from "./shared";
import { cx } from "./shared";
import { Trash2 } from "lucide-react";

export function SessionRow({ item, active, theme, onClick, onDelete }: SessionRowProps) {
  const statusTone =
    item.status === "ready"
      ? "text-emerald-500"
      : item.status === "needs-inputs"
        ? "text-amber-500"
        : "text-[#f17463]";

  const updatedLabel = new Date(item.updatedAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-xl border px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5",
        theme === "dark"
          ? active
            ? "border-[#f17463]/50 bg-[#f17463]/8"
            : "border-neutral-800 bg-black hover:border-neutral-700"
          : active
            ? "border-[#f17463]/40 bg-[#fff3ee]"
            : "border-neutral-200 bg-white hover:border-neutral-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cx("line-clamp-1 text-[13px] font-medium", theme === "dark" ? "text-neutral-100" : "text-neutral-800")}>
            {item.title}
          </div>
          <div className={cx("mt-1 line-clamp-1 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
            {item.lastMessage || "Open to continue refining"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className={cx("text-[10px] whitespace-nowrap", theme === "dark" ? "text-neutral-500" : "text-neutral-400")}>{updatedLabel}</div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className={cx(
              "inline-flex h-6 w-6 items-center justify-center rounded-md border transition cursor-pointer",
              theme === "dark"
                ? "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500",
            )}
            aria-label="Delete conversation"
            title="Delete conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={cx("h-1.5 w-1.5 rounded-full", statusTone, "bg-current")} />
        <span
          className={cx(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
            active
              ? "bg-[#f17463]/12 text-[#f17463]"
              : theme === "dark"
                ? "bg-neutral-800 text-neutral-400"
                : "bg-neutral-100 text-neutral-500",
          )}
        >
          {item.status}
        </span>
      </div>
    </button>
  );
}
