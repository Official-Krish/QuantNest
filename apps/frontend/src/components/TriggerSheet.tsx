import type { NodeKind, NodeMetadata, PriceTriggerNodeMetadata, TimerNodeMetadata } from "@n8n-trading/types";
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

const SUPPORTED_TRIGGERS = [
    {
        id: "timer",
        title: "Timer",
        description: "Run this trigger every X seconds/minutes/hours/days",
    },
    {
        id: "price-trigger",
        title: "Price Trigger",
        description: "Run this trigger when a stock price crosses a certain threshold for an asset",
    }
]

export const TriggerSheet = ({ onSelect} : {
    onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
}) => {
    const [metadata, setMetadata] = useState<PriceTriggerNodeMetadata | TimerNodeMetadata>({
        time: 3600
    });
    const [selectedTrigger, setSelectedTrigger] = useState("");
    return (
        <Sheet open={true}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Select Trigger</SheetTitle>
                    <SheetDescription>
                        Choose a trigger for your workflow.
                    </SheetDescription>
                    <Select onValueChange={(value) => setSelectedTrigger(value as string)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a trigger" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Select Trigger</SelectLabel>
                                {SUPPORTED_TRIGGERS.map((trigger) => (
                                    <SelectItem
                                        key={trigger.id}
                                        value={trigger.id}
                                    >
                                        <div className="w-75">
                                            <div className="font-medium">{trigger.title}</div>
                                            {/* <div className="text-sm text-muted-foreground w-full">{trigger.description}</div> */}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {selectedTrigger === "timer" && 
                        <div className="pt-2">
                            <div className="text-sm text-muted-foreground ">Number of seconds after which the trigger should run</div>
                            
                            <Input type="number" value={(metadata as TimerNodeMetadata).time} onChange={(e) => setMetadata(metadata => ({
                                ...metadata,
                                time: Number(e.target.value)
                            }) )} 
                            className="mt-1"
                            />
                        </div>
                    }
                    {selectedTrigger === "price-trigger" && 
                        <div>
                            Price:
                            <Input type="number" value={(metadata as PriceTriggerNodeMetadata).targetPrice} onChange={(e) => setMetadata(metadata => ({
                                ...metadata,
                                targetPrice: Number(e.target.value)
                            }) )} />
                            Asset:
                            <Select onValueChange={(value) => setMetadata(metadata => ({
                                ...metadata,
                                asset: value
                            }))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select an asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Select an asset</SelectLabel>
                                        {SUPPORTED_ASSETS.map((asset) => (
                                            <SelectItem
                                                key={asset}
                                                value={asset}
                                            >
                                                <div className="w-75">
                                                    <div className="font-medium">{asset}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                </SheetHeader>
                <SheetFooter>
                    <Button className="cursor-pointer" onClick={() => onSelect(selectedTrigger as NodeKind, metadata)}>Create Trigger</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}