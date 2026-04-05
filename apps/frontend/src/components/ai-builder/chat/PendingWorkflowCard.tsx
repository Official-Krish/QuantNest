import { cx, type LocalTheme } from "./shared";

type PendingWorkflowCardProps = {
  theme: LocalTheme;
};

export function PendingWorkflowCard({ theme }: PendingWorkflowCardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-4",
        theme === "dark" ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f17463]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f17463]" />
        Building workflow preview
      </div>
      <div
        className={cx(
          "mt-3 h-44 rounded-2xl border",
          theme === "dark"
            ? "border-neutral-800 bg-[#111111]"
            : "border-neutral-200 bg-[#f7f7f7]",
        )}
      />
      <div className="mt-3 space-y-2">
        <div
          className={cx(
            "h-3 w-2/3 animate-pulse rounded",
            theme === "dark" ? "bg-neutral-800" : "bg-neutral-200",
          )}
        />
        <div
          className={cx(
            "h-3 w-1/2 animate-pulse rounded",
            theme === "dark" ? "bg-neutral-800" : "bg-neutral-200",
          )}
        />
      </div>
    </div>
  );
}
