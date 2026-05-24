import type { PortfolioPnlDrawdownTriggerMetadata } from "@quantnest-trading/types";
import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
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
import { ReusableSecretPicker } from "./ReusableSecretPicker";

interface PortfolioPnlDrawdownTriggerFormProps {
  metadata: PortfolioPnlDrawdownTriggerMetadata | Record<string, unknown>;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
  marketType?: "Indian" | "Crypto" | null;
  setMarketType?: Dispatch<SetStateAction<"Indian" | "Crypto" | null>>;
}

const BROKER_OPTIONS = [
  { value: "zerodha", label: "Zerodha" },
  { value: "groww", label: "Groww" },
  { value: "lighter", label: "Lighter" },
] as const;

const MODE_OPTIONS = [
  { value: "daily-loss-cap", label: "Daily loss cap" },
  { value: "profit-target", label: "Profit target" },
  { value: "drawdown-limit", label: "Drawdown limit" },
] as const;

export function PortfolioPnlDrawdownTriggerForm({
  metadata,
  setMetadata,
  setMarketType,
}: PortfolioPnlDrawdownTriggerFormProps) {
  const typedMetadata =
    metadata as Partial<PortfolioPnlDrawdownTriggerMetadata>;
  const broker = typedMetadata.broker || "zerodha";
  const hasSecret = Boolean(String(typedMetadata.secretId || "").trim());
  const isLighter = broker === "lighter";
  const isGroww = broker === "groww";

  useEffect(() => {
    if (!setMarketType) return;

    setMarketType(isLighter ? "Crypto" : "Indian");
  }, [isLighter, setMarketType]);

  useEffect(() => {
    setMetadata((current: any) => ({
      ...current,
      broker: current.broker || "zerodha",
      mode: current.mode || "daily-loss-cap",
      thresholdUnit: current.thresholdUnit || "absolute",
    }));
  }, [setMetadata]);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
          Risk control
        </p>
        <p className="text-sm leading-6 text-neutral-300">
          Monitors one broker account and fires once when daily PnL, profit
          target, or drawdown crosses your limit.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
          Broker account
        </p>
        <Select
          value={broker}
          onValueChange={(value) => {
            setMarketType?.(value === "lighter" ? "Crypto" : "Indian");
            setMetadata((current: any) => ({
              ...current,
              broker: value,
              secretId: undefined,
              apiKey: "",
              accessToken: "",
              accountIndex: undefined,
              apiKeyIndex: undefined,
            }));
          }}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select broker" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Broker
              </SelectLabel>
              {BROKER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <ReusableSecretPicker
        service={broker}
        secretId={typedMetadata.secretId}
        helperText="Use a saved broker account credential from Profile > Secrets, or leave empty to enter one-time values below."
        onSelectSecret={(secretId) =>
          setMetadata((current: any) => ({
            ...current,
            secretId,
            apiKey: "",
            accessToken: "",
            accountIndex: undefined,
            apiKeyIndex: undefined,
          }))
        }
        onClearSecret={() =>
          setMetadata((current: any) => ({
            ...current,
            secretId: undefined,
          }))
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            Mode
          </p>
          <Select
            value={typedMetadata.mode || "daily-loss-cap"}
            onValueChange={(value) =>
              setMetadata((current: any) => ({
                ...current,
                mode: value,
              }))
            }
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
              <SelectValue placeholder="Select risk mode" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectGroup>
                {MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            Threshold type
          </p>
          <Select
            value={typedMetadata.thresholdUnit || "absolute"}
            onValueChange={(value) =>
              setMetadata((current: any) => ({
                ...current,
                thresholdUnit: value,
              }))
            }
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectGroup>
                <SelectItem value="absolute">Absolute amount</SelectItem>
                <SelectItem value="percent">Percent</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
          Threshold value
        </p>
        <Input
          type="number"
          value={typedMetadata.thresholdValue || ""}
          onChange={(event) =>
            setMetadata((current: any) => ({
              ...current,
              thresholdValue: Number(event.target.value),
            }))
          }
          className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder={
            typedMetadata.thresholdUnit === "percent"
              ? "2"
              : isLighter
                ? "100"
                : "5000"
          }
        />
      </div>

      {!hasSecret ? (
        <div className="space-y-3 rounded-2xl border border-neutral-800 bg-black/30 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            One-time broker credentials
          </p>

          {!isGroww ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                {isLighter ? "Private API key" : "API key"}
              </p>
              <Input
                type="password"
                value={typedMetadata.apiKey || ""}
                onChange={(event) =>
                  setMetadata((current: any) => ({
                    ...current,
                    secretId: undefined,
                    apiKey: event.target.value,
                  }))
                }
                className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                placeholder="Enter API key"
              />
            </div>
          ) : null}

          {!isLighter ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Access token
              </p>
              <Input
                type="password"
                value={typedMetadata.accessToken || ""}
                onChange={(event) =>
                  setMetadata((current: any) => ({
                    ...current,
                    secretId: undefined,
                    accessToken: event.target.value,
                  }))
                }
                className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                placeholder="Enter access token"
              />
            </div>
          ) : null}

          {isLighter ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Account index
                </p>
                <Input
                  type="number"
                  value={typedMetadata.accountIndex ?? ""}
                  onChange={(event) =>
                    setMetadata((current: any) => ({
                      ...current,
                      secretId: undefined,
                      accountIndex: Number(event.target.value),
                    }))
                  }
                  className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  API key index
                </p>
                <Input
                  type="number"
                  value={typedMetadata.apiKeyIndex ?? ""}
                  onChange={(event) =>
                    setMetadata((current: any) => ({
                      ...current,
                      secretId: undefined,
                      apiKeyIndex: Number(event.target.value),
                    }))
                  }
                  className="border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                  placeholder="0"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
