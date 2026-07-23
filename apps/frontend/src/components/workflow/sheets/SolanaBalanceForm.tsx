import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReliabilitySection } from "./ReliabilitySection";
import { useState, useEffect } from "react";
import { api } from "@/http";

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
  const walletAddress = (metadata.walletAddress as string) || "";

  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    setMetadata((current: any) => ({ ...current, network: "mainnet-beta" }));
  }, [setMetadata]);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .get<{ price: number }>("/onchain/solana/price", { signal: ctrl.signal })
      .then((res) => setSolPrice(res.data.price))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setLiveBalance(null);
      setBalanceError(null);
      return;
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);

    api
      .get<{ balance: number }>(`/onchain/solana/balance/${walletAddress}`, {
        signal: ctrl.signal,
      })
      .then((res) => {
        setLiveBalance(res.data.balance);
        setBalanceError(null);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setLiveBalance(null);
          setBalanceError("Could not fetch balance for this address");
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, [walletAddress]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/40 px-3 py-2 text-xs text-neutral-400">
        Network:{" "}
        <span className="font-semibold text-neutral-200">Mainnet Beta</span>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Wallet Address
        </p>
        <p className="text-xs text-neutral-400">
          Solana wallet public key to monitor.
        </p>
        <Input
          type="text"
          value={walletAddress}
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

      {liveBalance !== null && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/8 px-3 py-2 text-xs text-neutral-300">
          <span className="inline-flex size-2 shrink-0 rounded-full bg-teal-500" />
          Balance:{" "}
          <span className="font-semibold text-teal-400">
            {liveBalance.toFixed(4)} SOL
          </span>
          {solPrice !== null && (
            <span className="ml-auto text-neutral-500">
              ≈ ${(liveBalance * solPrice).toFixed(2)}
            </span>
          )}
        </div>
      )}

      {balanceError && <p className="text-xs text-red-400">{balanceError}</p>}

      {solPrice !== null && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-xs text-neutral-400">
          SOL Price:{" "}
          <span className="font-semibold text-neutral-200">
            ${solPrice.toFixed(2)}
          </span>
        </div>
      )}

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
