import type { TimerNodeMetadata } from "@n8n-trading/types";
import { Input } from "@/components/ui/input";

interface TimerFormProps {
  metadata: TimerNodeMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const TimerForm = ({ metadata, setMetadata }: TimerFormProps) => {
  return (
    <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
        Interval
      </p>
      <p className="text-xs text-neutral-400">
        Number of seconds after which the trigger should run.
      </p>
      <Input
        type="number"
        value={metadata.time}
        onChange={(e) =>
          setMetadata((current: any) => ({
            ...current,
            time: Number(e.target.value),
          }))
        }
        className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
      />
    </div>
  );
};
