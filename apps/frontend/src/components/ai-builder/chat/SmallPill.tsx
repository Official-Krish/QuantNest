import { cx, type LocalTheme } from "./shared";

type SmallPillProps = {
  label: string;
  active?: boolean;
  theme: LocalTheme;
};

export function SmallPill({ label, active = false, theme }: SmallPillProps) {
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 text-[10px]",
        active
          ? "bg-[#fff0e9] text-[#f17463]"
          : theme === "dark"
            ? "bg-[#151515] text-neutral-300"
            : "bg-[#eef1f4] text-neutral-600",
      )}
    >
      {label}
    </span>
  );
}
