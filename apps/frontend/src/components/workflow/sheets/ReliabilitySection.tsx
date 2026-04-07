import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReliabilitySectionProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

const DEFAULT_RETRY_POLICY = {
  enabled: false,
  maxAttempts: 3,
  backoffType: "fixed" as const,
  delaySeconds: 2,
  onFinalFailure: "fail-workflow" as const,
};

export const ReliabilitySection = ({ metadata, setMetadata }: ReliabilitySectionProps) => {
  const retryPolicy = {
    ...DEFAULT_RETRY_POLICY,
    ...(metadata.retryPolicy || {}),
  };

  const updateRetryPolicy = (patch: Record<string, unknown>) => {
    setMetadata((current: any) => ({
      ...current,
      retryPolicy: {
        ...DEFAULT_RETRY_POLICY,
        ...(current.retryPolicy || {}),
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Reliability
        </p>
        <p className="text-xs text-neutral-400">
          Retries apply only to execution failures, not validation or configuration issues.
        </p>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-neutral-700/60 bg-neutral-900/40 px-3 py-2">
        <Checkbox
          checked={Boolean(retryPolicy.enabled)}
          onCheckedChange={(value) =>
            updateRetryPolicy({
              enabled: value === true,
            })
          }
          className="border-neutral-600 data-[state=checked]:border-[#f17463] data-[state=checked]:bg-[#f17463]"
        />
        <span className="text-xs text-neutral-300">Enable retries for this action</span>
      </label>

      {retryPolicy.enabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Max Attempts
            </p>
            <Input
              type="number"
              min={1}
              value={retryPolicy.maxAttempts ?? 1}
              onChange={(e) => updateRetryPolicy({ maxAttempts: Number(e.target.value) })}
              className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Backoff
            </p>
            <Select
              value={retryPolicy.backoffType}
              onValueChange={(value) => updateRetryPolicy({ backoffType: value })}
            >
              <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select backoff" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectGroup>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Delay Seconds
            </p>
            <Input
              type="number"
              min={0}
              value={retryPolicy.delaySeconds ?? 0}
              onChange={(e) => updateRetryPolicy({ delaySeconds: Number(e.target.value) })}
              className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Final Failure
            </p>
            <Select
              value={retryPolicy.onFinalFailure}
              onValueChange={(value) => updateRetryPolicy({ onFinalFailure: value })}
            >
              <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectGroup>
                  <SelectItem value="fail-workflow">Fail workflow</SelectItem>
                  <SelectItem value="continue">Continue workflow</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}
    </div>
  );
};
