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
  return (
    <div className={cx("border-b px-4 py-2", border)}>
      <div className="flex flex-wrap items-center gap-2">
        <SmallPill label={market} theme={theme} active />
        <SmallPill label={goal.charAt(0).toUpperCase() + goal.slice(1)} theme={theme} />
        <SmallPill
          label={riskPreference ? riskPreference.charAt(0).toUpperCase() + riskPreference.slice(1) : "Balanced"}
          theme={theme}
        />
        <SmallPill label={modelLabel} theme={theme} />
        {selectedActions.slice(0, 4).map((action) => (
          <SmallPill key={action} label={action} theme={theme} />
        ))}
      </div>
    </div>
  );
}
