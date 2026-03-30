import {
  type LighterMetadata,
  type NodeKind,
  type NodeMetadata,
  type TradingMetadata,
} from "@quantnest-trading/types";
import {
  getBuilderPanelActions,
  type BuilderPanelGroup,
} from "@quantnest-trading/node-registry";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { getActionValidationErrors, getTradingValidationErrors } from "@/lib/validation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useMemo, useState } from "react";
import { ActionTypeSelector } from "./sheets/ActionTypeSelector";
import { ActionSheets } from "./sheets/ActionSheets";
import { getBuilderPanelGroupForNodeType, renderBuilderForm } from "./builderRegistry";

export const ActionSheet = ({
  onSelect,
  open,
  onOpenChange,
  initialKind,
  initialMetadata,
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
  const [initialAction, setInitialAction] = useState<BuilderPanelGroup | undefined>(undefined);

  useEffect(() => {
    if (!open) return;

    if (!initialKind) {
      setMetadata({});
      setSelectedAction("");
      setInitialAction(undefined);
      return;
    }

    setMetadata({ ...((initialMetadata || {}) as TradingMetadata | LighterMetadata | {}) });
    setSelectedAction(initialKind);

    const nextMarketType = String((initialMetadata as any)?.marketType || "").toLowerCase();
    if (nextMarketType === "indian") {
      setMarketType("Indian");
    } else if (nextMarketType === "crypto" || nextMarketType === "web3") {
      setMarketType("Crypto");
    }

    setInitialAction(getBuilderPanelGroupForNodeType(initialKind));
  }, [initialKind, initialMetadata, open, setMarketType]);

  const availableActions = useMemo(() => {
    if (!initialAction) {
      return [];
    }

    return getBuilderPanelActions(initialAction, hasZerodhaAction, marketType);
  }, [initialAction, hasZerodhaAction, marketType]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedAction) {
      return;
    }

    const isStillAvailable = availableActions.some((action) => action.id === selectedAction);
    if (isStillAvailable) {
      return;
    }

    setSelectedAction("");
    setMetadata({});
  }, [availableActions, open, selectedAction]);

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
  const actionValidationErrors = useMemo(
    () => getActionValidationErrors(selectedAction, metadata as Record<string, unknown>),
    [metadata, selectedAction],
  );
  const hasReusableSecret = Boolean(String((metadata as any)?.secretId || "").trim());
  const hasRecipientName = Boolean(String((metadata as any)?.recipientName || "").trim());

  const canCreateAction =
    !!selectedAction &&
    tradingValidationErrors.length === 0 &&
    actionValidationErrors.length === 0 &&
    (
      selectedAction !== "delay" ||
      Number((metadata as any)?.durationSeconds) > 0
    ) &&
    (
      selectedAction !== "gmail" ||
      (hasRecipientName && Boolean((metadata as any)?.recipientEmail))
    ) &&
    (
      selectedAction !== "slack" ||
      (hasRecipientName && (hasReusableSecret || (Boolean((metadata as any)?.slackBotToken) && Boolean((metadata as any)?.slackUserId))))
    ) &&
    (
      selectedAction !== "telegram" ||
      (hasRecipientName && (hasReusableSecret || (Boolean((metadata as any)?.telegramBotToken) && Boolean((metadata as any)?.telegramChatId))))
    ) &&
    (
      selectedAction !== "discord" ||
      (hasRecipientName && (hasReusableSecret || Boolean((metadata as any)?.webhookUrl)))
    ) &&
    (
      selectedAction !== "whatsapp" ||
      (hasRecipientName && (hasReusableSecret || Boolean((metadata as any)?.recipientPhone)))
    ) &&
    (
      selectedAction !== "notion-daily-report" ||
      ((hasReusableSecret || Boolean((metadata as any)?.notionApiKey)) && Boolean((metadata as any)?.aiConsent))
    ) &&
    (
      selectedAction !== "google-drive-daily-csv" ||
      ((hasReusableSecret || (Boolean((metadata as any)?.googleClientEmail) && Boolean((metadata as any)?.googlePrivateKey))) && Boolean((metadata as any)?.aiConsent))
    ) &&
    (
      selectedAction !== "filter" ||
      Boolean((metadata as any)?.expression) ||
      (
        Boolean((metadata as any)?.asset) &&
        ["above", "below"].includes(String((metadata as any)?.condition || "")) &&
        Number((metadata as any)?.targetPrice) > 0
      )
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
            onValueChange={(value) => setInitialAction(value as BuilderPanelGroup)}
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
              actions={availableActions}
              initialAction={initialAction}
            />
          )}

          {initialAction === "Reporting" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={availableActions}
              initialAction={initialAction}
            />
          )}

          {initialAction === "Flow Control" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={availableActions}
              initialAction={initialAction}
            />
          )}
          
          {initialAction === "Order Execution" && (
            <ActionSheets
              value={selectedAction}
              onValueChange={setSelectedAction}
              actions={availableActions}
              initialAction={initialAction}
            />
          )}

          {renderBuilderForm(selectedAction, {
            metadata,
            setMetadata,
            setMarketType,
            marketType,
            showApiKey: selectedAction === "zerodha",
            action: selectedAction,
            selectedAction,
          })}

          {(tradingValidationErrors.length > 0 || actionValidationErrors.length > 0) && (
            <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-200">
              <p className="font-medium text-amber-300">Complete validation:</p>
              <ul className="mt-2 space-y-1">
                {[...tradingValidationErrors, ...actionValidationErrors].map((validationError) => (
                  <li key={validationError}>• {validationError}</li>
                ))}
              </ul>
            </div>
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
