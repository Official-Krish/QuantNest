import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TriggerTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  triggers: Array<{ id: string; title: string; description: string }>;
}

export const TriggerTypeSelector = ({
  value,
  onValueChange,
  triggers,
}: TriggerTypeSelectorProps) => {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
        Trigger type
      </p>
      <Select onValueChange={onValueChange} value={value || undefined}>
        <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
          <SelectValue placeholder="Select a trigger" />
        </SelectTrigger>
        <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Select trigger
            </SelectLabel>
            {triggers.map((trigger) => (
              <SelectItem
                key={trigger.id}
                value={trigger.id}
                className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
              >
                <div className="w-64 space-y-1">
                  <div className="font-medium text-neutral-50">
                    {trigger.title}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {trigger.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
