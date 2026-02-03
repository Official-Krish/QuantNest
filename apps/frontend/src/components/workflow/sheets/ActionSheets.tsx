import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActionSheets {
  value: string;
  onValueChange: (value: string) => void;
  actions: Array<{ id: string; title: string; description: string }>;
  initialAction?: string;
}

export const ActionSheets = ({
  value,
  onValueChange,
  actions,
  initialAction,
}: ActionSheets) => {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
          {initialAction === "Order Execution" ? "Order Execution" : "Order Notification"}
        </p>

        <p className="text-[10px] text-neutral-500">
          {initialAction === "Order Execution"
            ? "Execute trades on your selected brokerage"
            : "Send email or chat notifications on order events"}
        </p>
      </div>
      <Select onValueChange={onValueChange} value={value || undefined}>
        <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100 hover:bg-neutral-850 transition-colors">
          <SelectValue placeholder="Choose an action" />
        </SelectTrigger>
        <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Select Action
            </SelectLabel>
            {actions.map((action) => (
              <SelectItem
                key={action.id}
                value={action.id}
                className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800 data-[highlighted]:bg-neutral-800 py-3"
              >
                <div className="w-64 space-y-1.5">
                  <div className="font-semibold text-neutral-50">
                    {action.title}
                  </div>
                  <div className="text-[11px] leading-relaxed text-neutral-400">
                    {action.description}
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
