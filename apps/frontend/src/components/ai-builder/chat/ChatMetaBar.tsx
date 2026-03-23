import { SmallPill } from "./SmallPill";
import { cx, type LocalTheme } from "./shared";

type ChatMetaBarProps = {
  border: string;
  theme: LocalTheme;
  market: string;
  goal: string;
  riskPreference?: string;
  modelLabel: string;
  selectedActions: string[];
};

export function ChatMetaBar({
  border,
  theme,
  market,
  goal,
  riskPreference,
  modelLabel,
  selectedActions,
}: ChatMetaBarProps) {
  const items = [
    { label: market, title: `Market: ${market}` },
    { label: goal.charAt(0).toUpperCase() + goal.slice(1), title: `Goal: ${goal}` },
    {
      label: riskPreference ? riskPreference.charAt(0).toUpperCase() + riskPreference.slice(1) : "Balanced",
      title: `Risk preference: ${riskPreference || "balanced"}`,
    },
    { label: modelLabel, title: `Model: ${modelLabel}` },
  ];

  return (
    <div className={cx("border-b px-5 py-2.5", border)}>
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <SmallPill key={item.label} label={item.label} title={item.title} theme={theme} active={index < 2} />
        ))}
        {selectedActions.slice(0, 4).map((action) => (
          <SmallPill key={action} label={action} title={`Preferred action: ${action}`} theme={theme} />
        ))}
      </div>
    </div>
  );
}
