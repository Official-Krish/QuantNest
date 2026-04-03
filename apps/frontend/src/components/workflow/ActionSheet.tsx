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
import { OrangeButton } from "@/components/ui/button-orange";
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
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bell, Clock3, FileText, Filter, GitBranch, GitFork, GitMerge, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getServiceBrand, ServiceLogo } from "./service-branding";
import { getBuilderPanelGroupForNodeType, renderBuilderForm } from "./builderRegistry";

const ACTION_GROUP_OPTIONS: Array<{
  id: BuilderPanelGroup;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  toneClassName: string;
}> = [
  {
    id: "Order Execution" as BuilderPanelGroup,
    title: "Order Execution",
    description: "Execute live orders through your broker integrations.",
    icon: PlayCircle,
    toneClassName: "text-[#ff9b8e]",
  },
  {
    id: "Order Notification" as BuilderPanelGroup,
    title: "Order Notification",
    description: "Send trade and workflow updates to chat or email.",
    icon: Bell,
    toneClassName: "text-[#f6b36a]",
  },
  {
    id: "Flow Control" as BuilderPanelGroup,
    title: "Flow Control",
    description: "Add branching, delays, and logic to your graph.",
    icon: GitBranch,
    toneClassName: "text-[#f17463]",
  },
  {
    id: "Reporting" as BuilderPanelGroup,
    title: "Reporting",
    description: "Generate reports and documentation artifacts.",
    icon: FileText,
    toneClassName: "text-neutral-200",
  },
];

const ACTION_STEP_TITLES: Record<BuilderPanelGroup, string> = {
  "Order Execution": "Select broker",
  "Order Notification": "Select service",
  "Flow Control": "Select logic step",
  Reporting: "Select reporting action",
};

const FLOW_CONTROL_STEP_OPTIONS: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    subtitle: string;
    toneClassName: string;
  }
> = {
  if: {
    icon: GitFork,
    subtitle: "Branch on condition",
    toneClassName: "text-[#ff9b8e]",
  },
  filter: {
    icon: Filter,
    subtitle: "Skip if false",
    toneClassName: "text-[#f6b36a]",
  },
  delay: {
    icon: Clock3,
    subtitle: "Wait before next",
    toneClassName: "text-[#ffb8ad]",
  },
  merge: {
    icon: GitMerge,
    subtitle: "Rejoin branches",
    toneClassName: "text-neutral-200",
  },
};

const getSelectedCardTitle = (group?: BuilderPanelGroup) => {
  if (!group) return "Select service";
  return ACTION_STEP_TITLES[group];
};

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
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (!open) return;

    if (!initialKind) {
      setMetadata({});
      setSelectedAction("");
      setInitialAction(undefined);
      setActiveStep(1);
      return;
    }

    setMetadata({ ...((initialMetadata || {}) as TradingMetadata | LighterMetadata | {}) });
    setSelectedAction(initialKind);
    setActiveStep(3);
    setTransitionDirection(1);

    const nextMarketType = String((initialMetadata as any)?.marketType || "").toLowerCase();
    if (nextMarketType === "indian") {
      setMarketType("Indian");
    } else if (nextMarketType === "crypto" || nextMarketType === "web3") {
      setMarketType("Crypto");
    }

    setInitialAction(getBuilderPanelGroupForNodeType(initialKind));
  }, [initialKind, initialMetadata, open, setMarketType]);

  useEffect(() => {
    if (!open) {
      setActiveStep(1);
      setTransitionDirection(1);
    }
  }, [open]);

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
      selectedAction !== "google-sheets-report" ||
      Boolean((metadata as any)?.sheetUrl)
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

  const handleSelectActionGroup = (value: BuilderPanelGroup) => {
    setInitialAction(value);
    setSelectedAction("");
    setMetadata({});
    setTransitionDirection(1);
    setActiveStep(2);
  };

  const handleSelectAction = (actionId: string) => {
    if (actionId !== selectedAction) {
      setMetadata({});
    }
    setSelectedAction(actionId);
    setActiveStep(3);
  };

  const handleBack = () => {
    setTransitionDirection(-1);
    setActiveStep((currentStep) => (currentStep === 3 ? 2 : 1));
  };

  const groupOptions = useMemo(() => {
    return ACTION_GROUP_OPTIONS.filter((option) => hasZerodhaAction || option.id !== ("Reporting" as BuilderPanelGroup));
  }, [hasZerodhaAction]);

  const activeGroup = initialAction || undefined;
  const selectedActionConfig = availableActions.find((action) => action.id === selectedAction);
  const currentTitle =
    activeStep === 1
      ? "Select action"
      : activeStep === 2
        ? getSelectedCardTitle(activeGroup)
        : selectedActionConfig
          ? `Configure ${selectedActionConfig.title}`
          : "Configure action"
  ;

  const selectedActionCountHint =
    activeGroup === "Order Execution"
      ? "More brokers coming soon, stay tuned!"
      : activeGroup === "Order Notification"
        ? "Notifications stay grouped on a single dark surface."
        : activeGroup === "Flow Control"
          ? "Different logic shapes help you scan options faster."
          : activeGroup === "Reporting"
            ? "Reporting actions stay locked until Zerodha is connected."
            : "";

  const canShowConfig = activeStep === 3 && Boolean(selectedAction);

  const stepStatusText =
    activeStep === 1
      ? "Step 1 of 3"
      : activeStep === 2
        ? "Step 2 of 3"
        : "Step 3 of 3";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="border-l border-neutral-800 bg-black text-neutral-50 overflow-auto"
        style={{ width: "min(480px, calc(100vw - 1rem))", maxWidth: "min(480px, calc(100vw - 1rem))" }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="gap-4 p-5 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                {activeStep > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-8 px-2 text-neutral-200 hover:bg-neutral-900 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                ) : (
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
                    Action setup
                  </span>
                )}

                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                  {stepStatusText}
                </span>
              </div>

              <SheetTitle className="text-base font-medium text-neutral-50">
                {title && title !== "Select action" ? title : currentTitle}
              </SheetTitle>
              <SheetDescription className="text-xs text-neutral-400">
                {activeStep === 1
                  ? "Choose the kind of action you want to add."
                  : activeStep === 2
                    ? "Choose the exact service or logic step to connect."
                    : "Configure the selected action before creating it."}
              </SheetDescription>
            </div>

            <div className="min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                {activeStep === 1 ? (
                  <motion.div
                    key="action-step-group"
                    initial={{ opacity: 0, y: transitionDirection > 0 ? 20 : -20, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: transitionDirection > 0 ? -10 : 10, scale: 0.99 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
                      Action category
                    </p>

                    <div className="space-y-2">
                      {groupOptions.map((groupOption) => {
                        const isSelected = initialAction === groupOption.id;
                        const Icon = groupOption.icon;
                        return (
                          <button
                            key={groupOption.id}
                            type="button"
                            onClick={() => handleSelectActionGroup(groupOption.id)}
                            className={cn(
                              "w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition-all",
                              isSelected
                                ? "border-l-2 border-l-[#f17463] border-[#f17463]/60 bg-[#f17463]/10"
                                : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950", groupOption.toneClassName)}>
                                <Icon className="size-5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-neutral-100">
                                  {groupOption.title}
                                </span>
                                <span className="mt-1 block text-sm leading-5 text-neutral-300">
                                  {groupOption.description}
                                </span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {initialAction === "Reporting" && !hasZerodhaAction ? (
                      <div className="flex items-start gap-3 rounded-2xl border border-[#f17463]/40 border-l-4 border-l-[#f17463] bg-[#f17463]/8 px-3 py-3 text-sm text-neutral-300">
                        <Lock className="mt-0.5 size-4 shrink-0 text-[#ff9b8e]" />
                        <span>
                          Add a Zerodha action node to unlock Reporting actions.
                        </span>
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key="action-step-service"
                    initial={{ opacity: 0, y: transitionDirection > 0 ? 20 : -20, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: transitionDirection > 0 ? -10 : 10, scale: 0.99 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    <motion.div
                      key={selectedAction || "preview-placeholder"}
                      initial={{ opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22 }}
                      className="rounded-2xl border border-[#f17463]/45 border-l-4 border-l-[#f17463] bg-[#f17463]/8 p-3"
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
                        Chain preview
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="rounded-full border border-neutral-700 bg-neutral-950 px-2.5 py-1 text-neutral-300">
                          Trigger
                        </span>
                        <ArrowRight className="size-4 text-[#f17463]" />
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#f17463]/45 bg-[#f17463]/18 px-2.5 py-1 text-[#ffb8ad]">
                          {selectedActionConfig ? (
                            <>
                              <ServiceLogo service={selectedActionConfig.id} size={14} />
                              <span>{selectedActionConfig.title}</span>
                            </>
                          ) : (
                            "Select action"
                          )}
                        </span>
                      </div>
                    </motion.div>

                    {activeStep === 2 ? (
                      <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
                          {activeGroup ? getSelectedCardTitle(activeGroup) : "Select service"}
                        </p>
                        {activeGroup === "Flow Control" ? (
                        <div className="space-y-2">
                          {availableActions.map((action) => {
                            const selected = selectedAction === action.id;
                            const flowMeta = FLOW_CONTROL_STEP_OPTIONS[action.id] || {
                              icon: GitFork,
                              subtitle: action.description,
                              toneClassName: "text-neutral-200",
                            };
                            const StepIcon = flowMeta.icon;
                            return (
                              <button
                                key={action.id}
                                type="button"
                                title={action.description}
                                onClick={() => handleSelectAction(action.id)}
                                className={cn(
                                  "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all",
                                  selected
                                    ? "border-l-2 border-l-[#f17463] border-[#f17463]/60 bg-[#f17463]/10 shadow-[0_0_0_1px_rgba(241,116,99,0.12)]"
                                    : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900",
                                )}
                              >
                                <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950", flowMeta.toneClassName)}>
                                  <StepIcon className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-neutral-100">
                                    {action.title}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-4 text-neutral-300">
                                    {flowMeta.subtitle}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                          </div>
                        ) : activeGroup === "Order Execution" ? (
                          <>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {availableActions.map((action) => {
                                const selected = selectedAction === action.id;
                                return (
                                  <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => handleSelectAction(action.id)}
                                    className={cn(
                                      "flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all cursor-pointer",
                                      selected
                                        ? "border-l-2 border-l-[#f17463] border-[#f17463]/60 bg-[#f17463]/10"
                                        : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900",
                                    )}
                                  >
                                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
                                      <ServiceLogo service={action.id} size={18} />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block text-sm font-semibold text-neutral-100">
                                        {action.title}
                                      </span>
                                      <span className="mt-1 block text-sm leading-5 text-neutral-300">
                                        {action.description}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs text-neutral-400">
                              {selectedActionCountHint || "More Brokers Coming Soon."}
                            </div>
                          </>
                        ) : activeGroup === "Order Notification" ? (
                          <div className="space-y-2">
                            {availableActions.map((action) => {
                              const selected = selectedAction === action.id;
                              return (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={() => handleSelectAction(action.id)}
                                  className={cn(
                                    "flex w-full cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                                    selected
                                      ? "border-l-2 border-l-[#f17463] border-[#f17463]/60 bg-[#f17463]/10"
                                      : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900",
                                  )}
                                >
                                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
                                    <ServiceLogo service={action.id} size={18} />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-neutral-100">
                                      {action.title}
                                    </span>
                                    <span className="mt-1 block text-sm leading-5 text-neutral-300">
                                      {action.description}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : activeGroup === "Reporting" ? (
                          <div className="space-y-2">
                            {availableActions.map((action) => {
                              const selected = selectedAction === action.id;
                              return (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={() => handleSelectAction(action.id)}
                                  className={cn(
                                    "flex w-full cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                                    selected
                                      ? "border-l-2 border-l-[#f17463] border-[#f17463]/60 bg-[#f17463]/10"
                                      : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900",
                                  )}
                                >
                                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950">
                                    <ServiceLogo service={action.id} size={18} />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-neutral-100">
                                      {action.title}
                                    </span>
                                    <span className="mt-1 block text-sm leading-5 text-neutral-300">
                                      {action.description}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                            <div className="rounded-2xl border border-[#f17463]/35 bg-[#f17463]/8 px-3 py-2 text-xs text-neutral-300">
                              {selectedActionCountHint || "Reporting actions stay locked until Zerodha is connected."}
                            </div>
                          </div>
                        ) : (
                          <p className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-3 text-sm text-neutral-300">
                            No services available for this category in the current context.
                          </p>
                        )}
                      </div>
                    ) : null}

                    {canShowConfig ? (
                      <div className="rounded-2xl border border-[#f17463]/45 border-l-4 border-l-[#f17463] bg-[#f17463]/8 p-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex size-10 items-center justify-center rounded-2xl border",
                              selectedActionConfig ? getServiceBrand(selectedActionConfig.id).tintClassName : "bg-neutral-950",
                              selectedActionConfig ? getServiceBrand(selectedActionConfig.id).borderClassName : "border-neutral-800",
                            )}
                          >
                            {selectedActionConfig ? <ServiceLogo service={selectedActionConfig.id} size={18} /> : <Lock className="size-4 text-[#ff9b8e]" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
                              Selected action
                            </p>
                            <p className="truncate text-sm font-semibold text-neutral-100">
                              {selectedActionConfig?.title ?? "Action"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 h-px w-full bg-linear-to-r from-transparent via-[#f17463]/70 to-transparent" />
                      </div>
                    ) : null}

                    {canShowConfig
                      ? renderBuilderForm(selectedAction, {
                          metadata,
                          setMetadata,
                          setMarketType,
                          marketType,
                          showApiKey: selectedAction === "zerodha",
                          action: selectedAction,
                          selectedAction,
                        })
                      : null}

                    {(tradingValidationErrors.length > 0 || actionValidationErrors.length > 0) && selectedAction ? (
                      <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <p className="font-medium text-amber-300">Complete validation:</p>
                        <ul className="mt-2 space-y-1">
                          {[...tradingValidationErrors, ...actionValidationErrors].map((validationError) => (
                            <li key={validationError}>• {validationError}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SheetHeader>

          {activeStep === 3 ? (
            <SheetFooter className="border-t border-neutral-900 bg-black/90 p-4">
              <OrangeButton
                fullWidth
                className="py-3 text-sm font-medium"
                disabled={!canCreateAction}
                onClick={handleCreate}
              >
                {submitLabel ?? "Create action"}
              </OrangeButton>
            </SheetFooter>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
