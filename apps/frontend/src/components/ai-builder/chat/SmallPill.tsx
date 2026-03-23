import { cx, type LocalTheme } from "./shared";

type SmallPillProps = {
  label: string;
  active?: boolean;
  theme: LocalTheme;
  title?: string;
};

export function SmallPill({ label, active = false, theme, title }: SmallPillProps) {
  return (
    <span
      title={title}
      className={cx(
        "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
        active
          ? theme === "dark"
            ? "border-[#f17463]/35 bg-[#f17463]/10 text-[#f59a8d]"
            : "border-[#f17463]/25 bg-[#fff0e9] text-[#f17463]"
          : theme === "dark"
            ? "border-neutral-800 bg-[#151515] text-neutral-300"
            : "border-neutral-200 bg-[#eef1f4] text-neutral-600",
      )}
    >
      {label}
    </span>
  );
}
