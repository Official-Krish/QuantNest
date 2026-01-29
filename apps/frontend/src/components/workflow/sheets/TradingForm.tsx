import type { TradingMetadata } from "@n8n-trading/types";
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
import { SUPPORTED_ASSETS } from "@n8n-trading/types";

interface TradingFormProps {
  metadata: TradingMetadata | {};
  setMetadata: React.Dispatch<React.SetStateAction<TradingMetadata | {}>>;
  showApiKey?: boolean;
}

export const TradingForm = ({
  metadata,
  setMetadata,
  showApiKey = false,
}: TradingFormProps) => {
  const typedMetadata = metadata as TradingMetadata;

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Order Type */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Order type
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current) => ({
              ...current,
              type: value as "buy" | "sell",
            }))
          }
          value={typedMetadata.type}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Type
              </SelectLabel>
              <SelectItem
                value="buy"
                className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
              >
                Buy
              </SelectItem>
              <SelectItem
                value="sell"
                className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
              >
                Sell
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Symbol */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Symbol
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current) => ({
              ...current,
              symbol: value as (typeof SUPPORTED_ASSETS)[number],
            }))
          }
          value={typedMetadata.symbol}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Assets
              </SelectLabel>
              {SUPPORTED_ASSETS.map((asset) => (
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
      </div>

      {/* Exchange */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Exchange
        </p>
        <p className="text-xs text-neutral-400">
          Select the exchange for trading.
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current) => ({
              ...current,
              exchange: value as "NSE" | "BSE" | "NFO" | "CDS" | "BCD" | "BFO" | "MCX",
            }))
          }
          value={typedMetadata.exchange || "NSE"}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder="Select exchange" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Exchanges
              </SelectLabel>
              <SelectItem
                value="NSE"
                className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
              >
                NSE
              </SelectItem>
              <SelectItem
                value="BSE"
                className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
              >
                BSE
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Quantity
        </p>
        <p className="text-xs text-neutral-400">
          Number of units you want this action to trade when executed.
        </p>
        <Input
          type="number"
          value={typedMetadata.qty}
          onChange={(e) =>
            setMetadata((current) => ({
              ...current,
              qty: Number(e.target.value),
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
        />
      </div>

      {/* API Key (Zerodha only) */}
      {showApiKey && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            API key
          </p>
          <p className="text-xs text-neutral-400">
            Your broker API key used only when this node runs.
          </p>
          <Input
            type="text"
            value={typedMetadata.apiKey || ""}
            onChange={(e) =>
              setMetadata((current) => ({
                ...current,
                apiKey: e.target.value,
              }))
            }
            className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
            placeholder="Enter API key"
          />
        </div>
      )}

      {/* Access Token */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Access Token
        </p>
        <p className="text-xs text-neutral-400">
          Your broker access token for authentication.
        </p>
        <Input
          type="text"
          value={typedMetadata.accessToken || ""}
          onChange={(e) =>
            setMetadata((current) => ({
              ...current,
              accessToken: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Enter access token"
        />
      </div>
    </div>
  );
};
