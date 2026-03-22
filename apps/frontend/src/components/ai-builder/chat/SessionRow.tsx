import type { SessionRowProps } from "./shared";
import { cx } from "./shared";

export function SessionRow({ item, active, theme, onClick }: SessionRowProps) {
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
      <div className={cx("line-clamp-1 text-[13px] font-medium", theme === "dark" ? "text-neutral-100" : "text-neutral-800")}>
        {item.title}
      </div>
      <div className={cx("mt-1 line-clamp-1 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
        {item.lastMessage || "Open to continue refining"}
      </div>
      <div className="mt-2 flex items-center gap-2">
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
