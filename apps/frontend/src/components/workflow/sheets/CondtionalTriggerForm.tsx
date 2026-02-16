import type { ConditionalTriggerMetadata } from "@n8n-trading/types";
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
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_MARKETS, SUPPORTED_WEB3_ASSETS } from "@n8n-trading/types";

interface ConditionalTriggerFormProps {
    marketType: "Indian" | "Crypto" | null;
    setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
    metadata: ConditionalTriggerMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const ConditionalTriggerForm = ({
    marketType,
    setMarketType,
    metadata,
    setMetadata,
}: ConditionalTriggerFormProps) => {
    return (
        <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
            {/* Condition */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Condition
                </p>
                <p className="text-xs text-neutral-400">
                    Trigger when price is above or below the target.
                </p>
                <Select
                    onValueChange={(value) =>
                        setMetadata((current: any) => ({
                            ...current,
                            condition: value as "above" | "below",
                        }))
                    }
                    value={metadata.condition || "above"}
                >
                    <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                        <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                        <SelectGroup>
                            <SelectItem value="above" className="cursor-pointer text-sm">
                                Above
                            </SelectItem>
                            <SelectItem value="below" className="cursor-pointer text-sm">
                                Below
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Target Price */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Target price
                </p>
                <p className="text-xs text-neutral-400">
                    Price level to evaluate within the time window.
                </p>
                <Input
                    type="number"
                    value={metadata.targetPrice || ""}
                    onChange={(e) =>
                        setMetadata((current: any) => ({
                            ...current,
                            targetPrice: Number(e.target.value),
                        }))
                    }
                    className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                    placeholder="Enter target price"
                />
            </div>

            {/* Market */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Select Market
                </p>
                <Select
                    onValueChange={(value) => {
                        setMarketType(value as "Indian" | "Crypto");
                        setMetadata((current: any) => ({
                            ...current,
                            marketType: value,
                        }));
                    }}
                    value={metadata.marketType || marketType || undefined}
                >
                    <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                        <SelectValue placeholder="Select a market" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                        <SelectGroup>
                            <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                                Select market
                            </SelectLabel>
                            {SUPPORTED_MARKETS.map((market) => (
                                <SelectItem
                                    key={market}
                                    value={market}
                                    className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
                                >
                                    <div className="w-64">
                                        <div className="font-medium text-neutral-50">{market}</div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Asset */}
            {marketType && (
                <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                        Asset
                    </p>
                    <Select
                        onValueChange={(value) =>
                            setMetadata((current: any) => ({
                                ...current,
                                asset: value,
                            }))
                        }
                        value={metadata.asset}
                    >
                        <SelectTrigger className="w-full border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                            <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                        <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                            <SelectGroup>
                                <SelectLabel className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                                    Select asset
                                </SelectLabel>
                                {(marketType === "Indian"
                                    ? SUPPORTED_INDIAN_MARKET_ASSETS
                                    : SUPPORTED_WEB3_ASSETS
                                ).map((asset) => (
                                    <SelectItem
                                        key={asset}
                                        value={asset}
                                        className="cursor-pointer text-sm text-neutral-100 focus:bg-neutral-800"
                                    >
                                        <div className="w-64">
                                            <div className="font-medium text-neutral-50">{asset}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Time Window */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                    Time window (minutes)
                </p>
                <p className="text-xs text-neutral-400">
                    Condition must be met within this time window to follow the true branch.
                </p>
                <Input
                    type="number"
                    value={metadata.timeWindowMinutes || ""}
                    onChange={(e) =>
                        setMetadata((current: any) => ({
                            ...current,
                            timeWindowMinutes: Number(e.target.value),
                            startTime: new Date(),
                        }))
                    }
                    className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
                    placeholder="Enter minutes (e.g., 15)"
                />
            </div>
        </div>
    );
};