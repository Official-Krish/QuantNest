import {
  type LighterMetadata,
  type NodeKind,
  type NodeMetadata,
  type TradingMetadata,
} from "@quantnest-trading/types";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { getTradingValidationErrors } from "@/lib/validation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMemo, useState } from "react";
import { SUPPORTED_ACTIONS } from "./sheets/constants";
import { ActionTypeSelector } from "./sheets/ActionTypeSelector";
import { TradingForm } from "./sheets/TradingForm";
import { GmailForm } from "./sheets/GmailForm";
import { DiscordForm } from "./sheets/DiscordForm";
import { WhatsappForm } from "./sheets/WhatsappForm";
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
  const [initialAction, setInitialAction] = useState<"Order Notification" | "Order Execution" | "Flow Control" | "Reporting" | undefined>(undefined);
  const tradingValidationErrors = useMemo(() => {
    if (
      selectedAction === "zerodha" ||
      selectedAction === "groww" ||
      selectedAction === "lighter"
    ) {
      return getTradingValidationErrors(
        selectedAction as "zerodha" | "groww" | "lighter",
        metadata
      );
    }
    return [];
  }, [metadata, selectedAction]);

  const canCreateAction =
    !!selectedAction &&
    tradingValidationErrors.length === 0 &&
    (
      selectedAction !== "gmail" ||
      Boolean((metadata as any)?.recipientEmail)
    ) &&
    (
      selectedAction !== "discord" ||
      Boolean((metadata as any)?.webhookUrl)
    ) &&
    (
      selectedAction !== "whatsapp" ||
      Boolean((metadata as any)?.recipientPhone)
    ) &&
    (
      selectedAction !== "notion-daily-report" ||
      (Boolean((metadata as any)?.notionApiKey) && Boolean((metadata as any)?.aiConsent))
    );

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
            onValueChange={(value) => setInitialAction(value as "Order Notification" | "Order Execution" | "Flow Control" | "Reporting")}
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
              ...(hasZerodhaAction
                ? [{
                    id: "Reporting",
                    title: "Reporting",
                    description: "Generate analytics and documentation artifacts",
                  }]
                : []),
            ]}
          />
          {!hasZerodhaAction && (
            <p className="text-[11px] text-amber-300/90">
              Add a Zerodha action node to enable Reporting actions.
            </p>
          )}
          
          {/* Step 2: Select Specific Broker/Service */}
          {initialAction === "Order Notification" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={SUPPORTED_ACTIONS["Notification"]}
              initialAction={initialAction}
            />
          )}

          {initialAction === "Reporting" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={hasZerodhaAction ? SUPPORTED_ACTIONS["Reporting"] : []}
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
          {tradingValidationErrors.length > 0 && (
            <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-200">
              <p className="font-medium text-amber-300">Complete broker validation:</p>
              <ul className="mt-2 space-y-1">
                {tradingValidationErrors.map((validationError) => (
                  <li key={validationError}>• {validationError}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedAction === "gmail" && (
            <GmailForm metadata={metadata} setMetadata={setMetadata} />
          )}

          {selectedAction === "discord" && (
            <DiscordForm metadata={metadata} setMetadata={setMetadata} />
          )}

          {selectedAction === "whatsapp" && (
            <WhatsappForm metadata={metadata} setMetadata={setMetadata} />
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
