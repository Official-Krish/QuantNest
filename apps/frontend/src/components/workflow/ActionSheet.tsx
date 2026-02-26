import {
  type LighterMetadata,
  type NodeKind,
  type NodeMetadata,
  type TradingMetadata,
} from "@quantnest-trading/types";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { SUPPORTED_ACTIONS } from "./sheets/constants";
import { ActionTypeSelector } from "./sheets/ActionTypeSelector";
import { TradingForm } from "./sheets/TradingForm";
import { GmailForm } from "./sheets/GmailForm";
import { DiscordForm } from "./sheets/DiscordForm";
import { ActionSheets } from "./sheets/ActionSheets";
import { ConditionalTriggerForm } from "./sheets/CondtionalTriggerForm";
import { NotionDailyReportForm } from "./sheets/NotionDailyReportForm";

export const ActionSheet = ({
  onSelect,
  open,
  onOpenChange,
  initialKind: _initialKind,
  initialMetadata: _initialMetadata,
  submitLabel,
  title,
  marketType,
  setMarketType,
  hasZerodhaAction,
}: {
  onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: NodeKind;
  initialMetadata?: NodeMetadata;
  submitLabel?: string;
  title?: string;
  marketType: "Indian" | "Crypto" | null;
  setMarketType: Dispatch<SetStateAction<"Indian" | "Crypto" | null>>;
  hasZerodhaAction: boolean;
}) => {
  const [metadata, setMetadata] = useState<TradingMetadata | LighterMetadata | {}>({});
  const [selectedAction, setSelectedAction] = useState("");
  const [initialAction, setInitialAction] = useState<"Order Notification" | "Order Execution" | "Flow Control" | undefined>(undefined);
  const canCreateAction =
    !!selectedAction &&
    (selectedAction !== "notion-daily-report" || Boolean((metadata as any)?.notionApiKey));

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
              {title ?? "Select Action"}
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-400">
              Connect this step of your workflow to a live brokerage
              integration.
            </SheetDescription>
          </div>
          
          {/* Step 1: Select Action Type */}
          <ActionTypeSelector
            value={initialAction || ""}
            onValueChange={(value) => setInitialAction(value as "Order Notification" | "Order Execution")}
            actions={[
              {
                id: "Order Execution",
                title: "Order Execution",
                description: "Execute trades on your selected brokerage",
              },
              {
                id: "Order Notification",
                title: "Order Notification",
                description: "Send notifications for your order events",
              },
              {
                id: "Flow Control",
                title: "Flow Control",
                description: "Branch workflow paths using conditions",
              },
            ]}
          />
          
          {/* Step 2: Select Specific Broker/Service */}
          {initialAction === "Order Notification" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={SUPPORTED_ACTIONS["Notification"].filter((action) =>
                action.id === "notion-daily-report" ? hasZerodhaAction : true
              )}
              initialAction={initialAction}
            />
          )}

          {initialAction === "Flow Control" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={SUPPORTED_ACTIONS["Flow"]}
              initialAction={initialAction}
            />
          )}
          
          {initialAction === "Order Execution" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={marketType && marketType in SUPPORTED_ACTIONS ? SUPPORTED_ACTIONS[marketType] : []}
              initialAction={initialAction}
            />
          )}

          {(selectedAction === "zerodha" || selectedAction === "groww" || selectedAction === "lighter") && (
            <TradingForm
              metadata={metadata}
              setMetadata={setMetadata}
              showApiKey={selectedAction === "zerodha"}
              action={selectedAction as "zerodha" | "groww" | "lighter"}
            />
          )}

          {selectedAction === "gmail" && (
            <GmailForm metadata={metadata} setMetadata={setMetadata} />
          )}

          {selectedAction === "discord" && (
            <DiscordForm metadata={metadata} setMetadata={setMetadata} />
          )}

          {selectedAction === "notion-daily-report" && (
            <NotionDailyReportForm metadata={metadata} setMetadata={setMetadata} />
          )}

          {selectedAction === "conditional-trigger" && (
            <ConditionalTriggerForm
              marketType={marketType}
              setMarketType={setMarketType}
              metadata={metadata as any}
              setMetadata={setMetadata}
            />
          )}
        </SheetHeader>
        <SheetFooter className="border-t border-neutral-900 bg-black/90 p-4">
          <Button
            className="w-full cursor-pointer bg-white text-xs font-medium text-neutral-900 hover:bg-gray-200"
            disabled={!canCreateAction}
            onClick={handleCreate}
          >
            {submitLabel ?? "Create action"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
