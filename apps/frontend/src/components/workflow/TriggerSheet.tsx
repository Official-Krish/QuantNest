import {
  type ConditionalTriggerMetadata,
  type NodeKind,
  type NodeMetadata,
  type PriceTriggerNodeMetadata,
  type TimerNodeMetadata,
  type MarketSessionTriggerNodeMetadata,
} from "@quantnest-trading/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { OrangeButton } from "@/components/ui/button-orange";
import { ArrowLeft } from "lucide-react";
import { SUPPORTED_TRIGGERS } from "./sheets/constants";
import { TriggerTypeSelector } from "./sheets/TriggerTypeSelector";
import { TimerForm } from "./sheets/TimerForm";
import { PriceTriggerForm } from "./sheets/PriceTriggerForm";
import { ConditionalTriggerForm } from "./sheets/CondtionalTriggerForm";
import { MarketSessionTriggerForm } from "./sheets/MarketSessionTriggerForm";

type SupportedTriggerKind = "timer" | "price-trigger" | "conditional-trigger" | "market-session";

const SUPPORTED_TRIGGER_KINDS: SupportedTriggerKind[] = ["timer", "price-trigger", "conditional-trigger", "market-session"];

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
  onPreviewTriggerChange,
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
  onPreviewTriggerChange?: (kind: SupportedTriggerKind | null) => void;
}) => {
  const [metadata, setMetadata] = useState<
    PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata | MarketSessionTriggerNodeMetadata
  >(() => ({} as PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata | MarketSessionTriggerNodeMetadata));
  const [selectedTrigger, setSelectedTrigger] = useState<SupportedTriggerKind | "">("");
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1);

  const selectedTriggerConfig = SUPPORTED_TRIGGERS.find((trigger) => trigger.id === selectedTrigger);

  useEffect(() => {
    if (!open) return;

    const nextSelectedTrigger =
      initialKind && isSupportedTriggerKind(initialKind)
        ? (initialKind as SupportedTriggerKind)
        : "";

    setSelectedTrigger(nextSelectedTrigger);
    onPreviewTriggerChange?.(nextSelectedTrigger || null);
    setActiveStep(nextSelectedTrigger ? 2 : 1);
    setTransitionDirection(1);
    setMetadata(
      (initialMetadata
        ? { ...(initialMetadata as PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata | MarketSessionTriggerNodeMetadata) }
        : {}) as PriceTriggerNodeMetadata | TimerNodeMetadata | ConditionalTriggerMetadata | MarketSessionTriggerNodeMetadata,
    );

    const nextMarketType = String((initialMetadata as any)?.marketType || "").toLowerCase();
    if (nextMarketType === "indian") {
      setMarketType("Indian");
    } else if (nextMarketType === "crypto" || nextMarketType === "web3") {
      setMarketType("Crypto");
    }
  }, [open, initialKind, initialMetadata, onPreviewTriggerChange, setMarketType]);

  useEffect(() => {
    if (!open) {
      onPreviewTriggerChange?.(null);
    }
  }, [open, onPreviewTriggerChange]);

  const handleCreate = () => {
    if (!selectedTrigger) return;
    onSelect(selectedTrigger as NodeKind, metadata);
    onOpenChange(false);
  };

  const handleTriggerSelect = (value: string) => {
    const nextValue = value as SupportedTriggerKind | "";
    setSelectedTrigger(nextValue);
    onPreviewTriggerChange?.(nextValue || null);
    setTransitionDirection(1);
    setActiveStep(2);
  };

  const handleBack = () => {
    setTransitionDirection(-1);
    setActiveStep(1);
  };

  const renderSelectedTriggerForm = () => {
    if (selectedTrigger === "timer") {
      return (
        <TimerForm
          marketType={marketType}
          setMarketType={setMarketType}
          metadata={metadata as TimerNodeMetadata}
          setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
        />
      );
    }

    if (selectedTrigger === "price-trigger") {
      return (
        <PriceTriggerForm
          marketType={marketType}
          setMarketType={setMarketType}
          metadata={metadata as PriceTriggerNodeMetadata}
          setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
        />
      );
    }

    if (selectedTrigger === "conditional-trigger") {
      return (
        <ConditionalTriggerForm
          marketType={marketType}
          setMarketType={setMarketType}
          metadata={metadata as ConditionalTriggerMetadata}
          setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
        />
      );
    }

    if (selectedTrigger === "market-session") {
      return (
        <MarketSessionTriggerForm
          marketType={marketType}
          setMarketType={setMarketType}
          metadata={metadata as MarketSessionTriggerNodeMetadata}
          setMetadata={setMetadata as React.Dispatch<React.SetStateAction<any>>}
        />
      );
    }

    return null;
  };

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
                {activeStep === 2 ? (
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
                    Trigger setup
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${activeStep === 1 ? "bg-[#f17463]" : "bg-neutral-700"}`} />
                  <span className={`h-2 w-2 rounded-full ${activeStep === 2 ? "bg-[#f17463]" : "bg-neutral-700"}`} />
                </div>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full rounded-full bg-[#f17463] transition-all duration-300"
                  style={{ width: activeStep === 1 ? "50%" : "100%" }}
                />
              </div>

              <SheetTitle className="text-base font-medium text-neutral-50">
                {title ?? "Select trigger"}
              </SheetTitle>
              <SheetDescription className="text-xs text-neutral-400">
                {activeStep === 1
                  ? "Choose how this workflow should start."
                  : "Adjust the selected trigger options before creating it."}
              </SheetDescription>
            </div>

            <div className="min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                {activeStep === 1 ? (
                  <motion.div
                    key="trigger-step-select"
                    initial={{ opacity: 0, x: transitionDirection > 0 ? 28 : -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: transitionDirection > 0 ? -18 : 18 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TriggerTypeSelector
                      value={selectedTrigger}
                      onValueChange={handleTriggerSelect}
                      triggers={SUPPORTED_TRIGGERS}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="trigger-step-options"
                    initial={{ opacity: 0, x: transitionDirection > 0 ? 28 : -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: transitionDirection > 0 ? -18 : 18 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4"
                  >
                    <div className="rounded-2xl border border-[#f17463]/45 border-l-4 border-l-[#f17463] bg-[#f17463]/8 p-3 shadow-[0_0_0_1px_rgba(241,116,99,0.1)]">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#f17463]">
                          Selected trigger
                        </p>
                        <h3 className="mt-1 truncate text-sm font-semibold text-neutral-50">
                          {selectedTriggerConfig?.title ?? "Trigger"}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-neutral-300">
                          {selectedTriggerConfig?.description ?? "Selected trigger options"}
                        </p>

                        <span className="mt-2 inline-flex rounded-full border border-[#f17463]/45 bg-[#f17463]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ffb8ad]">
                          Locked in
                        </span>
                      </div>
                    </div>

                    <div className="h-px w-full bg-linear-to-r from-transparent via-[#f17463]/70 to-transparent" />

                    {renderSelectedTriggerForm()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SheetHeader>

          {activeStep === 2 ? (
            <SheetFooter className="border-t border-neutral-900 bg-black/90 p-4">
              <OrangeButton
                fullWidth
                className="py-3 text-sm font-medium"
                disabled={!selectedTrigger}
                onClick={handleCreate}
              >
                {submitLabel ?? "Create trigger"}
              </OrangeButton>
            </SheetFooter>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
