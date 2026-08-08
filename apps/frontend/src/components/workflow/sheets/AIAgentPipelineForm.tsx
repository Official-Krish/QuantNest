import { useMemo, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bot,
  Brain,
  Database,
  Globe,
  AlertTriangle,
  Users,
  Cog,
} from "lucide-react";
import { AIAgentPipelineMetadataSchema } from "@quantnest-trading/types";
import { ReusableSecretPicker } from "./ReusableSecretPicker";
import { RiskGuardSection } from "./RiskGuardSection";
import { useMarketAssets } from "./useMarketAssets";
import type { ReusableSecretService } from "@/types/api";

const DEFAULT_MODELS = [
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
  { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
  { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
];

const BROKERS = [
  { label: "Zerodha", value: "zerodha" },
  { label: "Groww", value: "groww" },
  { label: "Lighter", value: "lighter" },
  { label: "Solana Swap", value: "solana-swap" },
];

const COMMON_TOKENS = [
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
  { symbol: "JitoSOL", mint: "J1toso1uCk3QLmjYXpTp3RnUeN4mAN4p8BbYfN1EFTP" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
];

const BROKER_SECRET_SERVICES: Record<string, ReusableSecretService> = {
  zerodha: "zerodha",
  groww: "groww",
  lighter: "lighter",
  "solana-swap": "solana",
};

interface AIAgentPipelineFormProps {
  metadata: Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  useOpenClaw?: boolean;
}

export const AIAgentPipelineForm = ({
  metadata,
  setMetadata,
  useOpenClaw = false,
}: AIAgentPipelineFormProps) => {
  const validationErrors = useMemo(() => {
    const result = AIAgentPipelineMetadataSchema.safeParse(metadata);
    if (!result.success) {
      return result.error.flatten().fieldErrors;
    }
    return {};
  }, [metadata]);

  const [hasInteracted, setHasInteracted] = useState(false);

  const set = (key: string, value: unknown) => {
    setHasInteracted(true);
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const desired = useOpenClaw ? "openclaw" : "gemini";
    if ((metadata.provider as string) !== desired) {
      setMetadata((current) => ({ ...current, provider: desired }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOpenClaw]);

  const { indianAssets, cryptoAssets } = useMarketAssets();

  const fieldError = (key: string) => {
    if (!hasInteracted) return null;
    const errs = validationErrors[key as keyof typeof validationErrors];
    return errs && errs.length > 0 ? errs[0] : null;
  };

  const broker = (metadata.broker as string) ?? "zerodha";
  const secretService = BROKER_SECRET_SERVICES[broker] ?? "zerodha";
  const brokerSecretId = (metadata.brokerSecretId as string) ?? "";
  const hasBrokerSecret = Boolean(brokerSecretId.trim());
  const executionMode =
    (metadata.executionMode as string) ?? "require-approval";

  const isSolana = broker === "solana-swap";
  const isLighter = broker === "lighter";

  useEffect(() => {
    if (isSolana) {
      setMetadata((current) => ({ ...current, symbol: "SOL" }));
    }
  }, [isSolana, setMetadata]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Beta / testing-phase banner */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-amber-300">
            Beta — Testing Phase
          </p>
          <p className="text-xs text-amber-200/80">
            AI agents can make mistakes. This node executes real orders through
            your broker. Use at your own risk. Always review research, strategy,
            and risk outputs before trusting the AI.
          </p>
        </div>
      </div>

      {/* Execution mode */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Execution Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => set("executionMode", "require-approval")}
            className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
              executionMode === "require-approval"
                ? "border-[#f17463]/60 bg-[#f17463]/10"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-100">
              <Users className="h-3.5 w-3.5 text-[#f17463]" />
              Require Approval
            </span>
            <span className="text-xs text-neutral-400">
              AI prepares the order, then a human approves before it is sent.
            </span>
          </button>
          <button
            type="button"
            onClick={() => set("executionMode", "auto")}
            className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
              executionMode === "auto"
                ? "border-amber-500/60 bg-amber-500/10"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-100">
              <Cog className="h-3.5 w-3.5 text-amber-400" />
              Auto
            </span>
            <span className="text-xs text-neutral-400">
              AI places the order automatically if strategy and risk approve.
            </span>
          </button>
        </div>
        {executionMode === "auto" && (
          <p className="text-xs text-amber-400">
            Auto mode places real orders without human review. Risk limits still
            apply.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          System Prompt
        </p>
        <textarea
          value={(metadata.systemPrompt as string) ?? ""}
          onChange={(e) => set("systemPrompt", e.target.value)}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#f17463]/50 focus:outline-none"
          rows={3}
          placeholder="You are a multi-agent trade pipeline. Research, build a strategy, assess risk, and decide whether to execute the order."
        />
      </div>

      {/* Broker */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Broker
        </p>
        <Select value={broker} onValueChange={(v) => set("broker", v)}>
          <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select broker" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            {BROKERS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trade intent */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {isSolana ? "From Token" : "Symbol"}
          </p>
          {isSolana ? (
            <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-200">
              <span className="text-xs font-bold text-teal-400">SOL</span>
            </div>
          ) : (
            <Select
              value={(metadata.symbol as string) ?? ""}
              onValueChange={(v) => set("symbol", v)}
            >
              <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue
                  placeholder={
                    isLighter ? "Select crypto asset" : "Select stock"
                  }
                />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectGroup>
                  <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                    {isLighter ? "Crypto Assets" : "Stock Assets"}
                  </SelectLabel>
                  {(isLighter ? cryptoAssets : indianAssets).map((asset) => (
                    <SelectItem
                      key={asset}
                      value={asset}
                      className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
                    >
                      {asset}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          {fieldError("symbol") && (
            <p className="text-xs text-red-400">{fieldError("symbol")}</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {isSolana ? "To Token" : "Quantity"}
          </p>
          {isSolana ? (
            <>
              <Select
                value={(metadata.toToken as string) ?? ""}
                onValueChange={(v) => set("toToken", v)}
              >
                <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                  {COMMON_TOKENS.map((t) => (
                    <SelectItem key={t.mint} value={t.mint}>
                      {t.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <Input
              type="number"
              min={0}
              value={metadata.qty !== undefined ? String(metadata.qty) : ""}
              onChange={(e) =>
                set("qty", e.target.value ? Number(e.target.value) : undefined)
              }
              className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder={isLighter ? "e.g. 100 (USDC)" : "e.g. 10"}
            />
          )}
          {fieldError("qty") && (
            <p className="text-xs text-red-400">{fieldError("qty")}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          {isSolana ? "Amount (SOL)" : "Side"}
        </p>
        {isSolana ? (
          <Input
            type="number"
            min={0}
            step={0.0001}
            value={metadata.qty !== undefined ? String(metadata.qty) : ""}
            onChange={(e) =>
              set("qty", e.target.value ? Number(e.target.value) : undefined)
            }
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="e.g. 0.1"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set("side", "buy")}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                (metadata.side as string) === "buy"
                  ? "border-teal-500/60 bg-teal-500/10 text-teal-300"
                  : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700"
              }`}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => set("side", "sell")}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                (metadata.side as string) === "sell"
                  ? "border-red-500/60 bg-red-500/10 text-red-300"
                  : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700"
              }`}
            >
              SELL
            </button>
          </div>
        )}
        {fieldError("side") && (
          <p className="text-xs text-red-400">{fieldError("side")}</p>
        )}
      </div>

      {isLighter && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Account Index
            </p>
            <Input
              type="number"
              min={0}
              value={
                metadata.accountIndex !== undefined
                  ? String(metadata.accountIndex)
                  : ""
              }
              onChange={(e) =>
                set(
                  "accountIndex",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              API Key Index
            </p>
            <Input
              type="number"
              min={0}
              value={
                metadata.apiKeyIndex !== undefined
                  ? String(metadata.apiKeyIndex)
                  : ""
              }
              onChange={(e) =>
                set(
                  "apiKeyIndex",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {isSolana && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Slippage (bps)
          </p>
          <Input
            type="number"
            min={1}
            max={500}
            step={1}
            value={
              metadata.slippageBps !== undefined
                ? String(metadata.slippageBps)
                : "100"
            }
            onChange={(e) =>
              set("slippageBps", e.target.value ? Number(e.target.value) : 100)
            }
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="100"
          />
        </div>
      )}

      {/* Broker credentials */}
      <ReusableSecretPicker
        service={secretService}
        secretId={brokerSecretId || undefined}
        helperText="Select a saved credential bundle from Profile > Secrets, or leave empty to enter one-time values below."
        onSelectSecret={(secretId) =>
          setMetadata((current: any) => ({
            ...current,
            brokerSecretId: secretId,
            apiKey: "",
            accessToken: "",
          }))
        }
        onClearSecret={() =>
          setMetadata((current: any) => ({
            ...current,
            brokerSecretId: undefined,
          }))
        }
      />

      {!hasBrokerSecret && (
        <div className="space-y-3">
          {broker === "zerodha" && (
            <>
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  API Key (one-time)
                </p>
                <Input
                  type="password"
                  value={(metadata.apiKey as string) ?? ""}
                  onChange={(e) => set("apiKey", e.target.value)}
                  className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                  placeholder="Enter Zerodha API key"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Access Token (one-time)
                </p>
                <Input
                  type="password"
                  value={(metadata.accessToken as string) ?? ""}
                  onChange={(e) => set("accessToken", e.target.value)}
                  className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                  placeholder="Enter Zerodha access token"
                />
              </div>
            </>
          )}
          {broker === "groww" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Access Token (one-time)
              </p>
              <Input
                type="password"
                value={(metadata.accessToken as string) ?? ""}
                onChange={(e) => set("accessToken", e.target.value)}
                className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                placeholder="Enter Groww access token"
              />
            </div>
          )}
          {broker === "lighter" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                API Key (one-time)
              </p>
              <Input
                type="password"
                value={(metadata.apiKey as string) ?? ""}
                onChange={(e) => set("apiKey", e.target.value)}
                className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                placeholder="Enter Lighter API key"
              />
            </div>
          )}
          {broker === "solana-swap" && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Private Key (one-time)
              </p>
              <Input
                type="password"
                value={(metadata.apiKey as string) ?? ""}
                onChange={(e) => set("apiKey", e.target.value)}
                className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                placeholder="Enter Solana wallet private key"
              />
            </div>
          )}
        </div>
      )}

      <RiskGuardSection metadata={metadata} setMetadata={setMetadata} />

      {/* AI model config */}
      {useOpenClaw && (
        <div className="space-y-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-orange-400">
            <Globe className="h-3 w-3" /> Local Agent
          </p>
          <p className="text-xs text-neutral-400">
            AI runs through your local QuantNest Agent (OpenClaw). Pick the
            model in the workflow&apos;s OpenClaw settings.
          </p>
        </div>
      )}

      {!useOpenClaw && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Model
          </p>
          <Select
            value={(metadata.model as string) ?? ""}
            onValueChange={(v) => set("model", v === "__custom__" ? "" : v)}
          >
            <SelectTrigger className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              {DEFAULT_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("model") && (
            <p className="text-xs text-red-400">{fieldError("model")}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Temperature
          </p>
          <Input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={(metadata.temperature as number) ?? 0.2}
            onChange={(e) => set("temperature", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Max Tokens
          </p>
          <Input
            type="number"
            min={1}
            max={8192}
            value={(metadata.maxTokens as number) ?? 1024}
            onChange={(e) => set("maxTokens", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Min Confidence
          </p>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={(metadata.minConfidence as number) ?? 0}
            onChange={(e) => set("minConfidence", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Context Depth
          </p>
          <Input
            type="number"
            min={1}
            max={10}
            value={(metadata.contextDepth as number) ?? 3}
            onChange={(e) => set("contextDepth", Number(e.target.value))}
            className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="3"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
        <Checkbox
          id="enableTools-pipeline"
          checked={(metadata.enableTools as boolean) ?? true}
          onCheckedChange={(v) => set("enableTools", v === true)}
          className="cursor-pointer"
        />
        <label
          htmlFor="enableTools-pipeline"
          className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
        >
          <Bot className="h-3.5 w-3.5 text-neutral-500" />
          Enable tools (market data access)
        </label>
      </div>

      {/* Approval, reasoning, memory */}
      <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/30 p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Advanced
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
          <Checkbox
            id="reasoningEnabled-pipeline"
            checked={(metadata.reasoningEnabled as boolean) ?? false}
            onCheckedChange={(v) => set("reasoningEnabled", v === true)}
            className="cursor-pointer"
          />
          <label
            htmlFor="reasoningEnabled-pipeline"
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
          >
            <Brain className="h-3.5 w-3.5 text-neutral-500" />
            Enable chain-of-thought reasoning
          </label>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
          <Checkbox
            id="memoryEnabled-pipeline"
            checked={(metadata.memoryEnabled as boolean) ?? false}
            onCheckedChange={(v) => set("memoryEnabled", v === true)}
            className="cursor-pointer"
          />
          <label
            htmlFor="memoryEnabled-pipeline"
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"
          >
            <Database className="h-3.5 w-3.5 text-neutral-500" />
            Persist memory across runs
          </label>
        </div>
        {(metadata.memoryEnabled as boolean) && (
          <div className="space-y-2 pl-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
              Memory TTL (hours)
            </p>
            <Input
              type="number"
              min={1}
              max={8760}
              value={(metadata.memoryTtl as number) ?? 24}
              onChange={(e) => set("memoryTtl", Number(e.target.value))}
              className="border-neutral-800 bg-neutral-950 text-sm text-neutral-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};
