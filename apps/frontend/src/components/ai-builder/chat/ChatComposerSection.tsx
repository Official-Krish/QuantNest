import { Check, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AiModelDescriptor, AiStrategyBuilderRequest } from "@/types/api";
import { AI_ACTION_OPTIONS } from "@/components/ai-builder/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cx, type LocalTheme } from "./shared";

const T = {
  surf2:   "#1E1309",
  surf3:   "#261809",
  bdr:     "rgba(255,255,255,0.055)",
  bdrH:    "rgba(255,255,255,0.11)",
  or:      "#F97316",
  orGlow:  "rgba(249,115,22,0.22)",
  txt:     "#EDD9C4",
  txtDim:  "#8A6F58",
  txtMute: "#e6e0dc",
  onBg:    "#0a0a0a",
  onBdr:   "rgba(255,255,255,0.13)",
  onTxt:   "#E8D5C4",
};

const MONO = "'DM Mono', monospace";
const BODY = "'Outfit', sans-serif";

type ChatComposerSectionProps = {
  border: string;
  muted: string;
  theme: LocalTheme;
  market: AiStrategyBuilderRequest["market"];
  onMarketChange: (value: AiStrategyBuilderRequest["market"]) => void;
  goal: AiStrategyBuilderRequest["goal"];
  onGoalChange: (value: AiStrategyBuilderRequest["goal"]) => void;
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  onRiskPreferenceChange: (value: AiStrategyBuilderRequest["riskPreference"]) => void;
  brokerExecution: boolean;
  onBrokerExecutionChange: (value: boolean) => void;
  allowDirectExecution: boolean;
  onAllowDirectExecutionChange: (value: boolean) => void;
  selectedActions: string[];
  onToggleAction: (action: string) => void;
  models: AiModelDescriptor[];
  selectedProvider: string;
  onSelectedProviderChange: (value: string) => void;
  selectedModel: string;
  onSelectedModelChange: (value: string) => void;
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  canSend: boolean;
  error: string | null;
};

export function ChatComposerSection({
  border,
  theme,
  market,
  onMarketChange,
  goal,
  onGoalChange,
  riskPreference,
  onRiskPreferenceChange,
  brokerExecution,
  onBrokerExecutionChange,
  allowDirectExecution,
  onAllowDirectExecutionChange,
  selectedActions,
  onToggleAction,
  models,
  selectedProvider,
  onSelectedProviderChange,
  selectedModel,
  onSelectedModelChange,
  composer,
  onComposerChange,
  onSend,
  sending,
  canSend,
  error,
}: ChatComposerSectionProps) {
  const [focused, setFocused] = useState(false);
  const [showMorePopover, setShowMorePopover] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  const providers = useMemo(
    () => Array.from(new Set(models.map((entry) => String(entry.provider)))),
    [models],
  );

  const providerModels = useMemo(
    () => models.filter((entry) => String(entry.provider) === selectedProvider),
    [models, selectedProvider],
  );

  const selectTriggerClass =
    "h-7 border-neutral-800 bg-transparent px-2 text-[10px] text-neutral-300 shadow-none focus-visible:border-[#f17463]/45 focus-visible:ring-1 focus-visible:ring-[#f17463]/30";
  const selectContentClass = "border-neutral-800 bg-[#0f0f0f] text-neutral-100";
  const selectItemClass = "cursor-pointer text-xs text-neutral-100 focus:bg-neutral-800 focus:text-neutral-100";

  const resizeComposer = () => {
    const node = composerRef.current;
    if (!node) return;

    node.style.height = "0px";
    const computed = window.getComputedStyle(node);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 24;
    const maxHeight = Math.ceil(lineHeight * 3);
    const nextHeight = Math.min(node.scrollHeight, maxHeight);
    node.style.height = `${Math.max(nextHeight, 24)}px`;
    node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeComposer();
  }, [composer]);

  useEffect(() => {
    if (!showMorePopover) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (moreButtonRef.current?.contains(target)) return;
      setShowMorePopover(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMorePopover(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [showMorePopover]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');`}</style>

      <div className={cx("border-t px-5 py-4", border)} style={{ fontFamily: BODY }}>
        <div className="mx-auto w-full max-w-[1180px]">

          {/* ── Unified Input Card ── */}
          <motion.div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10, 10, 10, 0.6)",
              overflow: "visible",
            }}
            animate={{
              borderColor: focused ? "rgba(249,115,22,0.32)" : "rgba(255,255,255,0.08)",
              boxShadow: focused ? "0 0 32px rgba(249,115,22,0.04) inset" : "none",
            }}
            transition={{ duration: 0.28 }}
          >
            {/* focus line at top */}
            <motion.div
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${T.or}, transparent)`,
              }}
              animate={{ opacity: focused ? 0.5 : 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Text area section */}
            <div style={{ padding: "14px 18px", position: "relative", minHeight: 80 }}>
              <textarea
                ref={composerRef}
                value={composer}
                onChange={(e) => onComposerChange(e.target.value)}
                onInput={resizeComposer}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Describe your workflow or refine this one..."
                style={{
                  minHeight: 48,
                  maxHeight: 72,
                  resize: "none",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  lineHeight: 1.65,
                  width: "100%",
                  fontFamily: BODY,
                  fontWeight: 300,
                  color: theme === "dark" ? "#ffffff" : "#111111",
                  caretColor: T.or,
                  paddingRight: 40,
                }}
                className={cx(theme === "dark" ? "placeholder:text-neutral-600" : "placeholder:text-neutral-400")}
              />

              {/* Send button - positioned absolutely in textarea area */}
              <motion.button
                type="button"
                onClick={onSend}
                disabled={sending || !canSend}
                title="Enter to send · Shift+Enter for newline"
                style={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  border: "1px solid",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canSend && !sending ? "pointer" : "not-allowed",
                  outline: "none",
                  flexShrink: 0,
                }}
                animate={{
                  borderColor: canSend && !sending ? T.or : "rgba(255,255,255,0.1)",
                  background: canSend && !sending ? T.or : "transparent",
                  color: canSend && !sending ? "#fcfcfa" : "rgba(255,255,255,0.3)",
                  opacity: sending ? 0.5 : 1,
                  boxShadow: canSend && !sending
                    ? `0 0 16px ${T.orGlow}, 0 2px 8px rgba(0,0,0,0.3)`
                    : "none",
                }}
                whileHover={canSend && !sending ? { scale: 1.05, boxShadow: `0 0 20px rgba(249,115,22,0.4)` } : {}}
                whileTap={canSend && !sending ? { scale: 0.94 } : {}}
                transition={{ duration: 0.18 }}
              >
                <Send style={{ width: 13, height: 13 }} />
              </motion.button>
            </div>



            {/* Divider before options */}
            <motion.div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />

            {/* Options row section */}
            <div style={{ padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              {/* Provider select */}
              <Select value={selectedProvider} onValueChange={onSelectedProviderChange}>
                <SelectTrigger className={cx(selectTriggerClass, "w-[148px]")} style={{ fontFamily: MONO }}>
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {providers.map((provider) => (
                    <SelectItem key={provider} value={provider} className={selectItemClass}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Model select */}
              <Select value={selectedModel} onValueChange={onSelectedModelChange}>
                <SelectTrigger className={cx(selectTriggerClass, "min-w-[190px]")} style={{ fontFamily: MONO }}>
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {providerModels.length ? (
                    providerModels.map((model) => (
                      <SelectItem key={model.id} value={model.id} className={selectItemClass}>
                        {model.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-model" disabled className={selectItemClass}>
                      No models
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Market select */}
              <Select
                value={market}
                onValueChange={(value) => onMarketChange(value as AiStrategyBuilderRequest["market"])}
              >
                <SelectTrigger className={cx(selectTriggerClass, "w-[104px]")} style={{ fontFamily: MONO }}>
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="Indian" className={selectItemClass}>Indian</SelectItem>
                  <SelectItem value="Crypto" className={selectItemClass}>Crypto</SelectItem>
                </SelectContent>
              </Select>

              {/* Goal select */}
              <Select
                value={goal}
                onValueChange={(value) => onGoalChange(value as AiStrategyBuilderRequest["goal"])}
              >
                <SelectTrigger className={cx(selectTriggerClass, "w-[104px]")} style={{ fontFamily: MONO }}>
                  <SelectValue placeholder="Goal" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="alerts" className={selectItemClass}>Alerts</SelectItem>
                  <SelectItem value="execution" className={selectItemClass}>Execution</SelectItem>
                  <SelectItem value="reporting" className={selectItemClass}>Reporting</SelectItem>
                  <SelectItem value="journaling" className={selectItemClass}>Journaling</SelectItem>
                </SelectContent>
              </Select>

              {/* Risk select */}
              <Select
                value={riskPreference || "balanced"}
                onValueChange={(value) =>
                  onRiskPreferenceChange(value as AiStrategyBuilderRequest["riskPreference"])
                }
              >
                <SelectTrigger className={cx(selectTriggerClass, "w-[126px]")} style={{ fontFamily: MONO }}>
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="conservative" className={selectItemClass}>Conservative</SelectItem>
                  <SelectItem value="balanced" className={selectItemClass}>Balanced</SelectItem>
                  <SelectItem value="aggressive" className={selectItemClass}>Aggressive</SelectItem>
                </SelectContent>
              </Select>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* +More popover trigger */}
              <motion.button
                ref={moreButtonRef}
                type="button"
                onClick={() => setShowMorePopover(!showMorePopover)}
                style={{
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid",
                  padding: "0 8px",
                  fontSize: 10,
                  fontFamily: MONO,
                  fontWeight: 400,
                  cursor: "pointer",
                  outline: "none",
                }}
                animate={{
                  borderColor: showMorePopover ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.12)",
                  background: showMorePopover ? "rgba(249,115,22,0.12)" : "transparent",
                  color: showMorePopover ? "rgba(249,115,22,1)" : "rgba(255,255,255,0.7)",
                }}
                whileHover={{ borderColor: "rgba(249,115,22,0.4)", color: "rgba(255,255,255,0.85)", scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                +More
              </motion.button>

              {/* Popover for broker/actions */}
              <AnimatePresence>
                {showMorePopover && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: -18,
                      right: -18,
                      background: "rgba(10, 10, 10, 0.9)",
                      border: "1px solid rgba(249,115,22,0.24)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      zIndex: 80,
                      width: "auto",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.08) inset",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: 26,
                        bottom: -6,
                        width: 12,
                        height: 12,
                        background: "rgba(10, 10, 10, 0.9)",
                        borderRight: "1px solid rgba(249,115,22,0.24)",
                        borderBottom: "1px solid rgba(249,115,22,0.24)",
                        transform: "rotate(45deg)",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                      <motion.button
                        type="button"
                        onClick={() => setShowMorePopover(false)}
                        aria-label="Close options"
                        style={{
                          height: 22,
                          width: 22,
                          borderRadius: 5,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent",
                          color: "rgba(255,255,255,0.7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          outline: "none",
                        }}
                        whileHover={{ borderColor: "rgba(249,115,22,0.4)", color: "rgba(255,255,255,0.9)" }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ duration: 0.15 }}
                      >
                        <X size={12} />
                      </motion.button>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, fontFamily: MONO, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                        Execution
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <motion.button
                          type="button"
                          onClick={() => onBrokerExecutionChange(!brokerExecution)}
                          aria-pressed={brokerExecution}
                          style={{
                            height: 28,
                            borderRadius: 6,
                            border: "1px solid",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            padding: "0 8px",
                            cursor: "pointer",
                            outline: "none",
                            fontSize: 11,
                            fontFamily: BODY,
                            gap: 8,
                          }}
                          animate={{
                            borderColor: brokerExecution ? "rgba(249,115,22,0.45)" : "rgba(255,255,255,0.12)",
                            background: brokerExecution ? "rgba(249,115,22,0.08)" : "transparent",
                            color: "rgba(255,255,255,0.85)",
                          }}
                          whileHover={{ borderColor: "rgba(249,115,22,0.4)" }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              border: brokerExecution ? "1px solid rgba(249,115,22,0.75)" : "1px solid rgba(255,255,255,0.28)",
                              background: brokerExecution ? "rgba(249,115,22,0.16)" : "rgba(255,255,255,0.03)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: brokerExecution ? `0 0 8px ${T.orGlow}` : "none",
                            }}
                          >
                            <AnimatePresence>
                              {brokerExecution ? (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.7 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.7 }}
                                  transition={{ duration: 0.12 }}
                                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <Check size={10} color={T.or} />
                                </motion.span>
                              ) : null}
                            </AnimatePresence>
                          </span>
                          <span>Broker Exec</span>
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => onAllowDirectExecutionChange(!allowDirectExecution)}
                          aria-pressed={allowDirectExecution}
                          style={{
                            height: 28,
                            borderRadius: 6,
                            border: "1px solid",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            padding: "0 8px",
                            cursor: "pointer",
                            outline: "none",
                            fontSize: 11,
                            fontFamily: BODY,
                            gap: 8,
                          }}
                          animate={{
                            borderColor: allowDirectExecution ? "rgba(249,115,22,0.45)" : "rgba(255,255,255,0.12)",
                            background: allowDirectExecution ? "rgba(249,115,22,0.08)" : "transparent",
                            color: "rgba(255,255,255,0.85)",
                          }}
                          whileHover={{ borderColor: "rgba(249,115,22,0.4)" }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              border: allowDirectExecution ? "1px solid rgba(249,115,22,0.75)" : "1px solid rgba(255,255,255,0.28)",
                              background: allowDirectExecution ? "rgba(249,115,22,0.16)" : "rgba(255,255,255,0.03)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: allowDirectExecution ? `0 0 8px ${T.orGlow}` : "none",
                            }}
                          >
                            <AnimatePresence>
                              {allowDirectExecution ? (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.7 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.7 }}
                                  transition={{ duration: 0.12 }}
                                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <Check size={10} color={T.or} />
                                </motion.span>
                              ) : null}
                            </AnimatePresence>
                          </span>
                          <span>Direct Exec</span>
                        </motion.button>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                      <div style={{ fontSize: 9, fontFamily: MONO, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                        ACTIONS
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {AI_ACTION_OPTIONS.map((action) => {
                          const active = selectedActions.includes(action);
                          return (
                            <motion.button
                              key={action}
                              type="button"
                              onClick={() => onToggleAction(action)}
                              style={{
                                height: 24,
                                padding: "0 9px",
                                borderRadius: 6,
                                border: "1px solid",
                                fontFamily: MONO,
                                fontSize: 10,
                                cursor: "pointer",
                                outline: "none",
                                fontWeight: 400,
                              }}
                              animate={{
                                borderColor: active ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.12)",
                                background: active ? "rgba(249,115,22,0.12)" : "transparent",
                                color: active ? "rgba(249,115,22,1)" : "rgba(255,255,255,0.7)",
                              }}
                              whileHover={{ borderColor: "rgba(249,115,22,0.4)", color: "rgba(255,255,255,0.85)", scale: 1.02 }}
                              whileTap={{ scale: 0.94 }}
                              transition={{ duration: 0.15 }}
                            >
                              {action}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

          {/* Error message */}
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs text-red-400"
            >
              {error}
            </motion.div>
          ) : null}

        </div>
      </div>
    </>
  );
}
