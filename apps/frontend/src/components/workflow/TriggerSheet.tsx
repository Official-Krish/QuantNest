import {
  type NodeKind,
  type NodeMetadata,
  type PriceTriggerNodeMetadata,
  type TimerNodeMetadata,
} from "@n8n-trading/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { SUPPORTED_TRIGGERS } from "./sheets/constants";
import { TriggerTypeSelector } from "./sheets/TriggerTypeSelector";
import { TimerForm } from "./sheets/TimerForm";
import { PriceTriggerForm } from "./sheets/PriceTriggerForm";

export const TriggerSheet = ({
  onSelect,
  open,
  onOpenChange,
  initialKind,
  initialMetadata,
  submitLabel,
  title,
  marketType,
  setMarketType,
}: {
  onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: NodeKind;
  initialMetadata?: NodeMetadata;
  submitLabel?: string;
  title?: string;
  marketType: "Indian" | "Crypto";
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto">>;
}) => {
  const [metadata, setMetadata] = useState<
    PriceTriggerNodeMetadata | TimerNodeMetadata
  >(() => ({} as PriceTriggerNodeMetadata | TimerNodeMetadata));
  const [selectedTrigger, setSelectedTrigger] = useState("");
  

  useEffect(() => {
    if (open) {
      if (initialKind && (["timer", "price-trigger"] as unknown as NodeKind[]).includes(initialKind)) {
        setSelectedTrigger(initialKind);
      }
      if (initialMetadata) {
        setMetadata((current) => ({
          ...(current || {}),
          ...(initialMetadata as PriceTriggerNodeMetadata | TimerNodeMetadata),
        }));
      }
    }
  }, [open, initialKind, initialMetadata]);

  const handleCreate = () => {
    if (!selectedTrigger) return;
    onSelect(selectedTrigger as NodeKind, metadata);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-l border-neutral-800 bg-black text-neutral-50 sm:max-w-md overflow-auto">
        <SheetHeader className="gap-4 p-5">
          <div className="space-y-1">
            <SheetTitle className="text-base font-medium text-neutral-50">
              {title ?? "Select trigger"}
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-400">
              Choose how this workflow should start. You can always come back
              and adjust these parameters later.
            </SheetDescription>
          </div>

          <TriggerTypeSelector
            value={selectedTrigger}
            onValueChange={setSelectedTrigger}
            triggers={SUPPORTED_TRIGGERS}
          />

          {selectedTrigger === "timer" && (
            <TimerForm
              metadata={metadata as TimerNodeMetadata}
              setMetadata={setMetadata}
              setMarketType={setMarketType}
            />
          )}

          {selectedTrigger === "price-trigger" && (
            <PriceTriggerForm
              marketType={marketType}
              metadata={metadata as PriceTriggerNodeMetadata}
              setMetadata={setMetadata}
              setMarketType={setMarketType}
            />
          )}
        </SheetHeader>

        <SheetFooter className="border-t border-neutral-900 bg-black/90 p-4">
          <Button
            className="w-full cursor-pointer bg-white text-xs font-medium text-neutral-900 hover:bg-gray-200"
            disabled={!selectedTrigger}
            onClick={handleCreate}
          >
            {submitLabel ?? "Create trigger"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
