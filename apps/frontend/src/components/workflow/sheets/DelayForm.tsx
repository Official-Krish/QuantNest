import { Input } from "@/components/ui/input";

interface DelayFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const DelayForm = ({ metadata, setMetadata }: DelayFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Delay Duration
        </p>
        <p className="text-xs text-neutral-400">
          Wait this many seconds before continuing to downstream nodes.
        </p>
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

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          Use Delay to space out notifications, wait before retrying, or pause between execution and reporting steps.
        </p>
      </div>
    </div>
  );
};
