import { ConditionalTriggerForm } from "./CondtionalTriggerForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecheckFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
  marketType: "Indian" | "Crypto" | null;
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
}

const PRESET_DELAYS = [
  { label: "30 sec", value: 30 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
];

export const RecheckForm = ({ metadata, setMetadata, marketType, setMarketType }: RecheckFormProps) => {
  const durationSeconds = Number(metadata.durationSeconds || 0);
  const recheckMode = String(metadata.recheckMode || "trigger").toLowerCase() === "custom"
    ? "custom"
    : "trigger";

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Delay Before Re-check
        </p>
        <p className="text-xs text-neutral-400">
          Wait for a short cooldown, then validate the condition again.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_DELAYS.map((preset) => {
            const selected = durationSeconds === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                className={`rounded-md border px-3 py-1.5 text-xs transition ${selected
                  ? "border-[#f17463]/70 bg-[#f17463]/16 text-[#ffb8ad]"
                  : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                }`}
                onClick={() =>
                  setMetadata((current: any) => ({
                    ...current,
                    durationSeconds: preset.value,
                  }))
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <Input
          type="number"
          min={1}
          value={metadata.durationSeconds ?? ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              durationSeconds: Number(e.target.value),
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="60"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Condition To Re-check
        </p>
        <Select
          value={recheckMode}
          onValueChange={(value) =>
            setMetadata((current: any) => ({
              ...current,
              recheckMode: value === "custom" ? "custom" : "trigger",
            }))
          }
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select re-check condition mode" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectItem value="trigger" className="cursor-pointer text-sm">
              Same as trigger (default)
            </SelectItem>
            <SelectItem value="custom" className="cursor-pointer text-sm">
              Custom condition
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recheckMode === "custom" ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/30 p-2">
          <ConditionalTriggerForm
            metadata={metadata}
            setMetadata={setMetadata}
            marketType={marketType}
            setMarketType={setMarketType}
            hideTimeWindow
          />
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3 text-xs text-neutral-400">
          Re-check will use the trigger condition at runtime. If trigger has no condition, execution continues after delay.
        </div>
      )}
    </div>
  );
};
