import {
  type ConditionalTriggerMetadata,
  type NodeKind,
  type NodeMetadata,
  type PriceTriggerNodeMetadata,
  type TimerNodeMetadata,
} from "@quantnest-trading/types";
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
import { ConditionalTriggerForm } from "./sheets/CondtionalTriggerForm";

type SupportedTriggerKind = "timer" | "price-trigger" | "conditional-trigger";

const SUPPORTED_TRIGGER_KINDS: SupportedTriggerKind[] = ["timer", "price-trigger", "conditional-trigger"];

const isSupportedTriggerKind = (kind: string): kind is SupportedTriggerKind => {
  return SUPPORTED_TRIGGER_KINDS.includes(kind as SupportedTriggerKind);
};

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
  marketType: "Indian" | "Crypto" | null;
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
}) => {
  const [metadata, setMetadata] = useState<
    PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata
  >(() => ({} as PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata));
  const [selectedTrigger, setSelectedTrigger] = useState<SupportedTriggerKind | "">("");

  useEffect(() => {
    if (!open) return;

    const nextSelectedTrigger =
      initialKind && isSupportedTriggerKind(initialKind)
        ? (initialKind as SupportedTriggerKind)
        : "";

    setSelectedTrigger(nextSelectedTrigger);
    setMetadata(
      (initialMetadata
        ? { ...(initialMetadata as PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata) }
        : {}) as PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata,
    );

    const nextMarketType = String((initialMetadata as any)?.marketType || "").toLowerCase();
    if (nextMarketType === "indian") {
      setMarketType("Indian");
    } else if (nextMarketType === "crypto" || nextMarketType === "web3") {
      setMarketType("Crypto");
    }
  }, [open, initialKind, initialMetadata, setMarketType]);

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
            onValueChange={(value) => setSelectedTrigger(value as SupportedTriggerKind | "")}
            triggers={SUPPORTED_TRIGGERS}
          />

          {selectedTrigger === "timer" ? (
            <TimerForm
              marketType={marketType}
              setMarketType={setMarketType}
              metadata={metadata as TimerNodeMetadata}
              setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
            />
          ) : selectedTrigger === "price-trigger" ? (
            <PriceTriggerForm
              marketType={marketType}
              setMarketType={setMarketType}
              metadata={metadata as PriceTriggerNodeMetadata}
              setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
            />
          ) : selectedTrigger === "conditional-trigger" ? (
            <ConditionalTriggerForm
              marketType={marketType}
              setMarketType={setMarketType}
              metadata={metadata as ConditionalTriggerMetadata}
              setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
            />
          ) : null}
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
