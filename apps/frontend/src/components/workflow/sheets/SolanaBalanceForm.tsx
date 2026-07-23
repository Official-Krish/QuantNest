import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReliabilitySection } from "./ReliabilitySection";

const NETWORKS = [
  { label: "Mainnet Beta", value: "mainnet-beta" },
  { label: "Devnet", value: "devnet" },
];

const CONDITIONS = [
  { label: "Above", value: "above" },
  { label: "Below", value: "below" },
];

interface SolanaBalanceFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export function SolanaBalanceForm({
  metadata,
  setMetadata,
}: SolanaBalanceFormProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Network */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Network
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({ ...current, network: value }))
          }
          value={(metadata.network as string) || "mainnet-beta"}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {NETWORKS.map((n) => (
              <SelectItem
                key={n.value}
                value={n.value}
                className="cursor-pointer text-sm"
              >
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Wallet Address */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Wallet Address
        </p>
        <p className="text-xs text-neutral-400">
          Solana wallet public key to monitor.
        </p>
        <Input
          type="text"
          value={metadata.walletAddress as string}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              walletAddress: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Enter Solana wallet address"
        />
      </div>

      {/* Token Mint (optional) */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Token Mint (optional)
        </p>
        <p className="text-xs text-neutral-400">
          SPL token mint address. Leave empty to monitor SOL balance.
        </p>
        <Input
          type="text"
          value={metadata.tokenMint as string}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              tokenMint: e.target.value || undefined,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Leave empty for SOL"
        />
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Condition
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({
              ...current,
              condition: value as "above" | "below",
            }))
          }
          value={(metadata.condition as string) || ""}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {CONDITIONS.map((c) => (
              <SelectItem
                key={c.value}
                value={c.value}
                className="cursor-pointer text-sm"
              >
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Threshold */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Threshold
        </p>
        <p className="text-xs text-neutral-400">
          Balance threshold that triggers the workflow.
        </p>
        <Input
          type="number"
          min="0"
          step="0.0001"
          value={
            metadata.threshold !== undefined ? String(metadata.threshold) : ""
          }
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              threshold: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="e.g. 10"
        />
      </div>

      <ReliabilitySection metadata={metadata} setMetadata={setMetadata} />
    </div>
  );
}
