import { useEffect, useState } from "react";
import { KeyRound, RefreshCcw } from "lucide-react";
import { apiGetReusableSecrets } from "@/http";
import type { ReusableSecretService, ReusableSecretSummary } from "@/types/api";
import { Button } from "@/components/ui/button";

interface ReusableSecretPickerProps {
  service: ReusableSecretService;
  secretId?: string;
  onSelectSecret: (secretId: string) => void;
  onClearSecret: () => void;
  helperText: string;
}

export function ReusableSecretPicker({
  service,
  secretId,
  onSelectSecret,
  onClearSecret,
  helperText,
}: ReusableSecretPickerProps) {
  const [secrets, setSecrets] = useState<ReusableSecretSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      const list = await apiGetReusableSecrets(service);
      setSecrets(list);
    };
    void load();
  }, [service]);

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-black/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            <KeyRound className="h-3.5 w-3.5 text-[#f17463]" />
            Reusable Secret
          </div>
          <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 cursor-pointer text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          onClick={onClearSecret}
        >
          <RefreshCcw className="mr-2 h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <select
        value={secretId || ""}
        onChange={(e) => {
          if (!e.target.value) {
            onClearSecret();
            return;
          }
          onSelectSecret(e.target.value);
        }}
        className="h-11 w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 text-sm text-white outline-none"
      >
        <option value="">Use one-time value</option>
        {secrets.map((secret) => (
          <option key={secret.id} value={secret.id}>
            {secret.name}
          </option>
        ))}
      </select>

      {secretId ? (
        <div className="text-xs text-[#f7b2a7]">
          This node will resolve its credentials from your saved secret at runtime.
        </div>
      ) : null}
    </div>
  );
}
