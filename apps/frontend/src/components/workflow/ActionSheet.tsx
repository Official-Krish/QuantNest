import type {
  NodeKind,
  NodeMetadata,
  TradingMetadata,
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
import { SUPPORTED_ACTIONS } from "./sheets/constants";
import { BrokerSelector } from "./sheets/BrokerSelector";
import { TradingForm } from "./sheets/TradingForm";
import { GmailForm } from "./sheets/GmailForm";
import { DiscordForm } from "./sheets/DiscordForm";

export const ActionSheet = ({
  onSelect,
  open,
  onOpenChange,
  initialKind,
  initialMetadata,
  submitLabel,
  title,
}: {
  onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: NodeKind;
  initialMetadata?: NodeMetadata;
  submitLabel?: string;
  title?: string;
}) => {
  const [metadata, setMetadata] = useState<TradingMetadata | {}>({});
  const [selectedAction, setSelectedAction] = useState("");

  useEffect(() => {
    if (open) {
      if (initialKind && (["zerodha", "groww", "gmail", "discord"] as unknown as NodeKind[]).includes(initialKind)) {
        setSelectedAction(initialKind);
      }
      if (initialMetadata) {
        setMetadata((current) => ({
          ...(current || {}),
          ...(initialMetadata as TradingMetadata),
        }));
      }
    }
  }, [open, initialKind, initialMetadata]);

  const handleCreate = () => {
    if (!selectedAction) return;
    onSelect(selectedAction as NodeKind, metadata);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-l border-neutral-800 bg-black text-neutral-50 sm:max-w-md overflow-auto">
        <SheetHeader className="gap-4 p-5">
          <div className="space-y-1">
            <SheetTitle className="text-base font-medium text-neutral-50">
              {title ?? "Select broker action"}
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-400">
              Connect this step of your workflow to a live brokerage
              integration.
            </SheetDescription>
          </div>

          <BrokerSelector
            value={selectedAction}
            onValueChange={setSelectedAction}
            actions={SUPPORTED_ACTIONS}
          />

          {(selectedAction === "zerodha" || selectedAction === "groww") && (
            <TradingForm
              metadata={metadata}
              setMetadata={setMetadata}
              showApiKey={selectedAction === "zerodha"}
            />
          )}

          {selectedAction === "gmail" && (
            <GmailForm metadata={metadata} setMetadata={setMetadata} />
          )}

          {selectedAction === "discord" && (
            <DiscordForm metadata={metadata} setMetadata={setMetadata} />
          )}
        </SheetHeader>
        <SheetFooter className="border-t border-neutral-900 bg-black/90 p-4">
          <Button
            className="w-full cursor-pointer bg-white text-xs font-medium text-neutral-900 hover:bg-gray-200"
            disabled={!selectedAction}
            onClick={handleCreate}
          >
            {submitLabel ?? "Create action"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};