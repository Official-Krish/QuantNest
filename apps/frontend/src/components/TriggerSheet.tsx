import type { NodeKind, NodeMetadata } from "../types";
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
    const [metadata, setMetadata] = useState({});
    const [selectedTrigger, setSelectedTrigger] = useState(SUPPORTED_TRIGGERS[0].id);
    console.log("trigger",{selectedTrigger});
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
                </SheetHeader>
                <SheetFooter>
                    <Button className="cursor-pointer" onClick={() => onSelect(selectedTrigger as NodeKind, metadata)}>Create Trigger</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}