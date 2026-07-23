import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReusableSecretPicker } from "./ReusableSecretPicker";
import { ReliabilitySection } from "./ReliabilitySection";

const COMMON_TOKENS = [
  { symbol: "SOL", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  { symbol: "JitoSOL", mint: "J1toso1uCk3QLmjYXpTp3RnUeN4mAN4p8BbYfN1EFTP" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
];

const NETWORKS = [
  { label: "Mainnet Beta", value: "mainnet-beta" },
  { label: "Devnet", value: "devnet" },
];

interface SolanaSwapFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export function SolanaSwapForm({ metadata, setMetadata }: SolanaSwapFormProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <ReusableSecretPicker
        service="solana"
        secretId={metadata.secretId as string | undefined}
        helperText="Select a saved Solana wallet from Profile > Secrets, or leave empty to enter a private key one-time."
        onSelectSecret={(secretId) =>
          setMetadata((current: any) => ({
            ...current,
            secretId,
          }))
        }
        onClearSecret={() =>
          setMetadata((current: any) => ({
            ...current,
            secretId: undefined,
          }))
        }
      />

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

      {/* From Token */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          From Token
        </p>
        <p className="text-xs text-neutral-400">
          Token or mint address to swap from.
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({ ...current, fromToken: value }))
          }
          value={(metadata.fromToken as string) || ""}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {COMMON_TOKENS.map((t) => (
              <SelectItem
                key={t.mint}
                value={t.mint}
                className="cursor-pointer text-sm"
              >
                {t.symbol} ({t.mint.slice(0, 8)}...)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={metadata.fromToken as string}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              fromToken: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Or paste custom mint address"
        />
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          To Token
        </p>
        <p className="text-xs text-neutral-400">
          Token or mint address to swap to.
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current: any) => ({ ...current, toToken: value }))
          }
          value={(metadata.toToken as string) || ""}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {COMMON_TOKENS.map((t) => (
              <SelectItem
                key={t.mint}
                value={t.mint}
                className="cursor-pointer text-sm"
              >
                {t.symbol} ({t.mint.slice(0, 8)}...)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={metadata.toToken as string}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              toToken: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Or paste custom mint address"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Amount
        </p>
        <p className="text-xs text-neutral-400">
          Amount of from-token to swap.
        </p>
        <Input
          type="number"
          min="0"
          step="0.0001"
          value={metadata.amount !== undefined ? String(metadata.amount) : ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              amount: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="e.g. 0.1"
        />
      </div>

      {/* Slippage */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Slippage (bps)
        </p>
        <p className="text-xs text-neutral-400">
          100 bps = 1%. Default: 100 (1%).
        </p>
        <Input
          type="number"
          min="1"
          max="500"
          step="1"
          value={
            metadata.slippageBps !== undefined
              ? String(metadata.slippageBps)
              : "100"
          }
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              slippageBps: e.target.value ? Number(e.target.value) : 100,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="100"
        />
      </div>

      <ReliabilitySection metadata={metadata} setMetadata={setMetadata} />
    </div>
  );
}
