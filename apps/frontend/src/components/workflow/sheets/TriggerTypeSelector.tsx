import { cn } from "@/lib/utils";

interface TriggerTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  triggers: Array<{ id: string; title: string; description: string }>;
}

const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  timer: "Runs on a fixed schedule",
  "price-trigger": "Fires when price crosses a threshold",
  "breakout-retest-trigger": "Fires after breakout, pullback retest, and confirmation",
  "conditional-trigger": "Fires based on custom logic",
  "market-session": "Fires on market open or close",
};

export const TriggerTypeSelector = ({
  value,
  onValueChange,
  triggers,
}: TriggerTypeSelectorProps) => {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
        Trigger options
      </p>
      <div className="space-y-2">
        {triggers.map((trigger) => {
          const selected = value === trigger.id;
          const description = TRIGGER_DESCRIPTIONS[trigger.id] || trigger.description;

          return (
            <button
              key={trigger.id}
              type="button"
              onClick={() => onValueChange(trigger.id)}
              className={cn(
                "flex w-full cursor-pointer items-stretch gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left transition-all hover:border-neutral-700 hover:bg-neutral-900/80",
                selected && "border-l-2 border-l-[#f17463] bg-[#f17463]/10 ring-1 ring-[#f17463]/20",
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "mt-0.5 h-auto w-1.5 shrink-0 rounded-full bg-transparent transition-colors",
                  selected && "bg-[#f17463]",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-50">
                  {trigger.title}
                </div>
                <div className="mt-1 text-xs leading-5 text-neutral-400">
                  {description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
