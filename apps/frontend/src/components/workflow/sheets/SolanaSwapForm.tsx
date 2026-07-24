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
import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/http";
import bs58 from "bs58";

const COMMON_TOKENS = [
  { symbol: "SOL", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  { symbol: "JitoSOL", mint: "J1toso1uCk3QLmjYXpTp3RnUeN4mAN4p8BbYfN1EFTP" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
];

const SOL_MINT = "So11111111111111111111111111111111111111112";

function deriveAddress(privateKeyBase58: string): string | null {
  try {
    const decoded = bs58.decode(privateKeyBase58);
    if (decoded.length !== 64) return null;
    const pubkeyBytes = decoded.slice(32, 64);
    return bs58.encode(pubkeyBytes);
  } catch {
    return null;
  }
}

interface SolanaSwapFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export function SolanaSwapForm({ metadata, setMetadata }: SolanaSwapFormProps) {
  const hasSecret = Boolean(String(metadata.secretId || "").trim());
  const secretId = (metadata.secretId as string) || "";
  const privateKey = (metadata.privateKey as string) || "";

  const [derivedAddress, setDerivedAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const derivedFromKey = useMemo(() => {
    if (hasSecret || !privateKey) return null;
    const addr = deriveAddress(privateKey);
    return addr;
  }, [hasSecret, privateKey]);

  const keyError = useMemo(() => {
    if (hasSecret || !privateKey) return null;
    if (!deriveAddress(privateKey))
      return "Invalid private key: must be a 64-byte base58-encoded keypair";
    return null;
  }, [hasSecret, privateKey]);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .get<{ price: number }>("/solana/price", { signal: ctrl.signal })
      .then((res) => setSolPrice(res.data.price))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const fetchBalanceForAddress = useCallback((address: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    api
      .get<{ balance: number }>(`/onchain/solana/balance/${address}`, {
        signal: controller.signal,
      })
      .then((res) => setBalance(res.data.balance))
      .catch(() => {
        if (!controller.signal.aborted) setBalance(null);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (hasSecret && secretId) {
      const controller = new AbortController();

      api
        .get<{ address: string; balance: number }>(
          `/onchain/solana/wallet/${secretId}`,
          {
            signal: controller.signal,
          },
        )
        .then((res) => {
          setDerivedAddress(res.data.address);
          setBalance(res.data.balance);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setDerivedAddress(null);
            setBalance(null);
            setAddressError("Failed to load saved wallet");
          }
        });

      return () => controller.abort();
    }
  }, [hasSecret, secretId]);

  useEffect(() => {
    if (!hasSecret && derivedFromKey) {
      return fetchBalanceForAddress(derivedFromKey);
    }
  }, [hasSecret, privateKey, derivedFromKey, fetchBalanceForAddress]);

  useEffect(() => {
    setMetadata((current: any) => ({
      ...current,
      fromToken: SOL_MINT,
    }));
  }, [setMetadata]);

  useEffect(() => {
    setMetadata((current: any) => ({ ...current, network: "mainnet-beta" }));
  }, [setMetadata]);

  const displayAddress = hasSecret ? derivedAddress : derivedFromKey;
  const displayError = hasSecret ? addressError : keyError;

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/40 px-3 py-2 text-xs text-neutral-400">
        Network:{" "}
        <span className="font-semibold text-neutral-200">Mainnet Beta</span>
      </div>
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

      {!hasSecret && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Private Key (one-time)
          </p>
          <p className="text-xs text-neutral-400">
            Solana wallet private key in base58 format. For production use, save
            your wallet in Profile &gt; Secrets.
          </p>
          <Input
            type="password"
            value={privateKey}
            onChange={(e) =>
              setMetadata((current: any) => ({
                ...current,
                secretId: undefined,
                privateKey: e.target.value,
              }))
            }
            className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="Enter base58 private key"
          />
        </div>
      )}

      {displayAddress && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Wallet Address
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200">
            <span className="inline-flex size-3 shrink-0 rounded-full bg-teal-500" />
            <code className="truncate font-mono text-xs">{displayAddress}</code>
          </div>
          {balance !== null && (
            <p className="text-xs text-neutral-400">
              Balance:{" "}
              <span className="font-semibold text-teal-400">
                {balance.toFixed(4)} SOL
              </span>
            </p>
          )}
        </div>
      )}

      {displayError && <p className="text-xs text-red-400">{displayError}</p>}

      {solPrice !== null && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-xs text-neutral-400">
          SOL Price:{" "}
          <span className="font-semibold text-neutral-200">
            ${solPrice.toFixed(2)}
          </span>
        </div>
      )}

      {/* Sell (From) - locked to SOL */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Sell
        </p>
        <p className="text-xs text-neutral-400">
          Swapping from your SOL balance.
        </p>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900/60 px-3 py-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-bold text-teal-400">
            SOL
          </span>
          <span className="text-sm text-neutral-200">Solana (Native)</span>
          <span className="ml-auto text-[10px] text-neutral-500">
            So1111...11112
          </span>
        </div>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Buy
        </p>
        <p className="text-xs text-neutral-400">Token you want to receive.</p>
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
            {COMMON_TOKENS.filter((t) => t.mint !== SOL_MINT).map((t) => (
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
          Amount (SOL)
        </p>
        <p className="text-xs text-neutral-400">Amount of SOL to swap.</p>
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
