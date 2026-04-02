import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionRowProps } from "./shared";
import { cx } from "./shared";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SessionRow({ item, active, theme, onClick, onRename, onDelete }: SessionRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nextTitle, setNextTitle] = useState(item.title);
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cancelRename = () => {
    setIsRenaming(false);
    setNextTitle(item.title);
  };

  const saveRename = async () => {
    const normalizedTitle = nextTitle.trim();
    if (normalizedTitle.length < 3 || normalizedTitle === item.title) {
      cancelRename();
      return;
    }

    setRenaming(true);
    try {
      await onRename(normalizedTitle);
      setIsRenaming(false);
    } finally {
      setRenaming(false);
    }
  };

  useEffect(() => {
    if (!isRenaming) {
      setNextTitle(item.title);
    }
  }, [isRenaming, item.title]);

  useLayoutEffect(() => {
    if (!isRenaming) return;

    const frame = window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      input.setSelectionRange(0, input.value.length);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isRenaming]);

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
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isRenaming) onClick();
      }}
      onKeyDown={(event) => {
        if (isRenaming) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cx(
        "group w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5",
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
          {isRenaming ? (
            <>
              <input
                ref={inputRef}
                value={nextTitle}
                onChange={(event) => setNextTitle(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRename();
                    return;
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    void saveRename();
                  }
                }}
                disabled={renaming}
                className={cx(
                  "h-7 w-full rounded-md border px-2 text-[13px] font-medium outline-none",
                  theme === "dark"
                    ? "border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-neutral-500"
                    : "border-neutral-300 bg-white text-neutral-800 focus:border-neutral-400",
                )}
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void saveRename();
                  }}
                  disabled={renaming}
                  className={cx(
                    "rounded-md px-2.5 py-1 text-[10px] font-medium transition cursor-pointer",
                    theme === "dark"
                      ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50",
                  )}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    cancelRename();
                  }}
                  disabled={renaming}
                  className={cx(
                    "rounded-md px-2.5 py-1 text-[10px] font-medium transition cursor-pointer",
                    theme === "dark"
                      ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-50",
                  )}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className={cx("line-clamp-1 text-[13px] font-medium", theme === "dark" ? "text-neutral-100" : "text-neutral-800")}>
              {item.title}
            </div>
          )}
          <div className={cx("mt-1 line-clamp-1 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
            {item.lastMessage || "Open to continue refining"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className={cx("text-[10px] whitespace-nowrap", theme === "dark" ? "text-neutral-500" : "text-neutral-400")}>{updatedLabel}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className={cx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md border opacity-0 transition cursor-pointer group-hover:opacity-100 focus-visible:opacity-100",
                  theme === "dark"
                    ? "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700",
                )}
                aria-label="Open chat actions"
                title="Actions"
              >
                <Ellipsis className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cx(
                "min-w-35",
                theme === "dark"
                  ? "border-neutral-800 bg-neutral-950 text-neutral-100"
                  : "border-neutral-200 bg-white text-neutral-800",
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => {
                  setIsRenaming(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-400"
                onSelect={() => {
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </div>
  );
}
