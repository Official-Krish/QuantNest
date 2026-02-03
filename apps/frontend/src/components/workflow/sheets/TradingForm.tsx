import type { LighterMetadata, TradingMetadata } from "@n8n-trading/types";
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
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@n8n-trading/types";

interface TradingFormProps {
  metadata: TradingMetadata | {};
  setMetadata: React.Dispatch<React.SetStateAction<TradingMetadata | {}>>;
  showApiKey?: boolean;
  action: "zerodha" | "groww" | "lighter";
}

export const TradingForm = ({
  metadata,
  setMetadata,
  showApiKey = false,
  action
}: TradingFormProps) => {
  const isWeb3 = action === "lighter";
  const typedMetadata = isWeb3
    ? (metadata as LighterMetadata)
    : (metadata as TradingMetadata);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Order Type / Position Type */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          {isWeb3 ? "Position type" : "Order type"}
        </p>
        {isWeb3 ? (
          <Select
            onValueChange={(value) =>
              setMetadata((current) => ({
                ...current,
                type: value as "long" | "short",
              }))
            }
            value={(typedMetadata as any).position}
          >
            <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
              <SelectGroup>
                <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                  Position
                </SelectLabel>
                <SelectItem
                  value="long"
                  className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
                >
                  Long
                </SelectItem>
                <SelectItem
                  value="short"
                  className="cursor-pointer text-sm text-neutral-100 focus:text-neutral-100 focus:bg-neutral-800"
                >
                  Short
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
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
        )}
      </div>

      {/* Symbol / Asset */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          {isWeb3 ? "Asset" : "Symbol"}
        </p>
        <Select
          onValueChange={(value) =>
            setMetadata((current) => ({
              ...current,
              symbol: value,
            }))
          }
          value={typedMetadata.symbol}
        >
          <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
            <SelectValue placeholder={isWeb3 ? "Select crypto asset" : "Select stock"} />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                {isWeb3 ? "Crypto Assets" : "Stock Assets"}
              </SelectLabel>
              {(isWeb3 ? SUPPORTED_WEB3_ASSETS : SUPPORTED_INDIAN_MARKET_ASSETS).map((asset) => (
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

      {/* Exchange (only for Indian markets) */}
      {!isWeb3 && (
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
                exchange: value as "NSE" | "BSE",
              }))
            }
            value={!isWeb3 ? (typedMetadata as TradingMetadata).exchange || "NSE" : undefined}
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
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Quantity
        </p>
        <p className="text-xs text-neutral-400">
          {isWeb3 
            ? "Amount of crypto you want to trade when executed." 
            : "Number of units you want this action to trade when executed."}
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
          placeholder={isWeb3 ? "e.g., 0.5" : "e.g., 10"}
        />
      </div>

      {/* API Key */}
      {(showApiKey || isWeb3) && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            API key
          </p>
          <p className="text-xs text-neutral-400">
            {isWeb3 
              ? "Your Lighter API key for authentication." 
              : "Your broker API key used only when this node runs."}
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

      {/* Access Token (only for Indian brokers) */}
      {!isWeb3 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Access Token
          </p>
          <p className="text-xs text-neutral-400">
            Your broker access token for authentication.
          </p>
          <Input
            type="text"
            value={!isWeb3 && (typedMetadata as TradingMetadata).accessToken || ""}
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
      )}
      {isWeb3 && (
        <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Account Index
            </p>
            <p className="text-xs text-neutral-400">
                Your Lighter account index for authentication.
            </p>
            <Input
                type="text"
                value={isWeb3  && (typedMetadata as LighterMetadata).accountIndex || ""}
                onChange={(e) =>
                setMetadata((current) => ({
                    ...current,
                    accountIndex: e.target.value,
                }))
                }
                className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                placeholder="Enter account index"
            />
            <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    ApiKey Index
                </p>
                <p className="text-xs text-neutral-400">
                    Your Lighter ApiKey index for authentication.
                </p>
                <Input
                    type="text"
                    value={isWeb3  && (typedMetadata as LighterMetadata).apiKeyIndex || ""}
                    onChange={(e) =>
                    setMetadata((current) => ({
                        ...current,
                        apiKeyIndex: e.target.value,
                    }))
                    }
                    className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                    placeholder="Enter apiKey index"
                />

            </div>
        </div>
      )}
    </div>
  );
};
