import type { NodeKind, NodeMetadata, TradingMetadata } from "@n8n-trading/types";
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useState } from "react";
import { Input } from "./ui/input";
import { SUPPORTED_ASSETS } from "@n8n-trading/types";

const SUPPORTED_ACTIONS = [
    {
        id: "zerodha",
        title: "Zerodha",
        description: "Execute an action on Zerodha platform",
    },
    {
        id: "groww",
        title: "Groww",
        description: "Execute an action on Groww platform",
    }
]

export const ActionSheet = ({ onSelect} : {
    onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
}) => {
    const [metadata, setMetadata] = useState<TradingMetadata | {}>({});
    const [selectedAction, setSelectedAction] = useState("");
    return (
        <Sheet open={true}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Select Action</SheetTitle>
                    <SheetDescription>
                        Choose an action for your workflow.
                    </SheetDescription>
                    <Select onValueChange={(value) => setSelectedAction(value as string)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Select Action</SelectLabel>
                                {SUPPORTED_ACTIONS.map((action) => (
                                    <SelectItem
                                        key={action.id}
                                        value={action.id}
                                    >
                                        <div className="w-75">
                                            <div className="font-medium">{action.title}</div>
                                            {/* <div className="text-sm text-muted-foreground w-full">{action.description}</div> */}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {(selectedAction === "zerodha" || selectedAction === "groww") && 
                        <div className="pt-2">
                            <div>
                                Type
                            </div>
                            <Select onValueChange={(value) => setMetadata(metadata => ({
                                ...metadata,
                                type: value as "buy" | "sell"
                            }) )}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Type</SelectLabel>
                                        <SelectItem value="buy">Buy</SelectItem>
                                        <SelectItem value="sell">Sell</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <div>
                                Symbol
                            </div>
                            <Select onValueChange={(value) => setMetadata(metadata => ({
                                ...metadata,
                                symbol: value as typeof SUPPORTED_ASSETS[number]
                            }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Assets</SelectLabel>
                                        {SUPPORTED_ASSETS.map((asset) => (
                                            <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <div className="text-sm text-muted-foreground">Number of shares you want to trade</div>

                            <Input type="number" value={(metadata as TradingMetadata).qty} onChange={(e) => setMetadata(metadata => ({
                                ...metadata,
                                qty: Number(e.target.value)
                            }) )} 
                            className="mt-1"
                            />
                        </div>
                    }
                </SheetHeader>
                <SheetFooter>
                    <Button className="cursor-pointer" onClick={() => onSelect(selectedAction as NodeKind, metadata)}>Create Action</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}