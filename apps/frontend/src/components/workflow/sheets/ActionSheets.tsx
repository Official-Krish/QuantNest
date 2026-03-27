import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServiceBrand, ServiceLogo } from "../service-branding";

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
  const selectedAction = actions.find((action) => action.id === value);

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
          {initialAction === "Order Execution"
            ? "Order Execution"
            : initialAction === "Flow Control"
              ? "Flow Control"
              : initialAction === "Reporting"
                ? "Reporting"
              : "Order Notification"}
        </p>

        <p className="text-[10px] text-neutral-500">
          {initialAction === "Order Execution"
            ? "Execute trades on your selected brokerage"
            : initialAction === "Flow Control"
              ? "Add logical branching to your workflow graph"
              : initialAction === "Reporting"
                ? "Generate reports and strategy documentation"
              : "Send email or chat notifications on order events"}
        </p>
      </div>
      <Select onValueChange={onValueChange} value={value || undefined}>
        <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100 hover:bg-neutral-850 transition-colors">
          {selectedAction ? (
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${getServiceBrand(selectedAction.id).tintClassName} ${getServiceBrand(selectedAction.id).borderClassName}`}
              >
                <ServiceLogo service={selectedAction.id} size={14} />
              </div>
              <span>{selectedAction.title}</span>
            </div>
          ) : (
            <SelectValue placeholder="Choose an action" />
          )}
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
                <div className="flex w-64 items-start gap-3">
                  <div
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${getServiceBrand(action.id).tintClassName} ${getServiceBrand(action.id).borderClassName}`}
                  >
                    <ServiceLogo service={action.id} size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-semibold text-neutral-50">
                      {action.title}
                    </div>
                    <div className="text-[11px] leading-relaxed text-neutral-400">
                      {action.description}
                    </div>
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
