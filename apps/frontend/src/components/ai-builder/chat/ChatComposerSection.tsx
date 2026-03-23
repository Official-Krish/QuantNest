import { ChevronDown, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { AiModelDescriptor, AiStrategyBuilderRequest } from "@/types/api";
import { AI_ACTION_OPTIONS } from "@/components/ai-builder/constants";
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

function StyledSelect({ value, onChange, children, theme }: { value: string; onChange: (v: string) => void; children: React.ReactNode; theme: LocalTheme }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      style={{ position: "relative", flex: 1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.span
        style={{ position: "absolute", right: 10, top: "50%", translateY: "-50%", fontSize: 9, pointerEvents: "none", fontFamily: MONO, zIndex: 1 }}
        animate={{ color: hovered ? T.or : T.txtMute }}
        transition={{ duration: 0.18 }}
      >▾</motion.span>
      <motion.select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", appearance: "none",
          border: `1px solid`,
          borderRadius: 9, padding: "8px 26px 8px 11px",
          color: theme === "dark" ? T.txt : "#1a1a1a",
          fontFamily: MONO, fontSize: 11,
          cursor: "pointer", outline: "none",
        }}
        animate={{
          background:   hovered ? T.surf3 : T.surf2,
          borderColor:  hovered ? T.bdrH  : T.bdr,
        }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.select>
    </motion.div>
  );
}

function ToggleCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.label
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "7px 13px", borderRadius: 9,
        border: "1px solid",
        fontFamily: MONO, fontSize: 10,
        cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
      }}
      animate={{
        borderColor: checked ? T.onBdr  : T.bdr,
        background:  checked ? T.onBg   : T.surf2,
        color:       checked ? T.onTxt  : T.txtDim,
      }}
      whileHover={{ borderColor: T.bdrH, color: T.txt }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18 }}
    >
      {/* hidden native checkbox for accessibility */}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: "none" }} />
      <motion.span
        style={{
          width: 13, height: 13, borderRadius: 3,
          border: "1.5px solid currentColor",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8, flexShrink: 0,
        }}
        animate={{ background: checked ? "rgba(255,255,255,0.08)" : "transparent" }}
        transition={{ duration: 0.15 }}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              key="chk"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.14 }}
            >✓</motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      {label}
    </motion.label>
  );
}

type ChatComposerSectionProps = {
  border: string;
  muted: string;
  theme: LocalTheme;
  showSetup: boolean;
  onToggleSetup: () => void;
  market: AiStrategyBuilderRequest["market"];
  onMarketChange: (value: AiStrategyBuilderRequest["market"]) => void;
  goal: AiStrategyBuilderRequest["goal"];
  onGoalChange: (value: AiStrategyBuilderRequest["goal"]) => void;
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  onRiskPreferenceChange: (value: AiStrategyBuilderRequest["riskPreference"]) => void;
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  models: AiModelDescriptor[];
  selectedModel: string;
  onModelChange: (value: string) => void;
  providerModels: AiModelDescriptor[];
  brokerExecution: boolean;
  onBrokerExecutionChange: (value: boolean) => void;
  allowDirectExecution: boolean;
  onAllowDirectExecutionChange: (value: boolean) => void;
  selectedActions: string[];
  onToggleAction: (action: string) => void;
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  canSend: boolean;
  error: string | null;
};

export function ChatComposerSection({
  border,
  muted,
  theme,
  showSetup,
  onToggleSetup,
  market,
  onMarketChange,
  goal,
  onGoalChange,
  riskPreference,
  onRiskPreferenceChange,
  selectedProvider,
  onProviderChange,
  models,
  selectedModel,
  onModelChange,
  providerModels,
  brokerExecution,
  onBrokerExecutionChange,
  allowDirectExecution,
  onAllowDirectExecutionChange,
  selectedActions,
  onToggleAction,
  composer,
  onComposerChange,
  onSend,
  sending,
  canSend,
  error,
}: ChatComposerSectionProps) {
  const [focused, setFocused] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

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

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');`}</style>

      <div className={cx("border-t px-5 py-4", border)} style={{ fontFamily: BODY }}>
        <div className="mx-auto w-full max-w-[1180px]">

          {/* ── Toggle header ── */}
          <motion.button
            type="button"
            onClick={onToggleSetup}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 10, background: "none", border: "none",
              cursor: "pointer", padding: 0,
            }}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: T.txtDim, textTransform: "uppercase" }}>
              {showSetup ? "Hide options" : "Show options"}
            </span>
            <motion.span
              animate={{ rotate: showSetup ? 180 : 0, color: showSetup ? T.or : T.txtMute }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              style={{ display: "inline-flex", marginLeft: 2 }}
            >
              <ChevronDown size={14} />
            </motion.span>
          </motion.button>

          {/* ── Collapsible options panel ── */}
          <AnimatePresence initial={false}>
            {showSetup && (
              <motion.div
                key="setup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: { duration: 0.38, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.22 } }}
                style={{ overflow: "hidden", marginBottom: 12 }}
              >
                <motion.div
                  style={{
                    borderRadius: 14, border: `1px solid ${T.bdr}`,
                    background: T.surf2, padding: 12,
                    display: "flex", flexDirection: "column", gap: 12,
                  }}
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                >

                  {/* Row 1 — 4 selects */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.26 }}
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}
                  >
                    <StyledSelect value={market} onChange={(v) => onMarketChange(v as AiStrategyBuilderRequest["market"])} theme={theme}>
                      <option value="Indian">Indian</option>
                      <option value="Crypto">Crypto</option>
                    </StyledSelect>

                    <StyledSelect value={goal} onChange={(v) => onGoalChange(v as AiStrategyBuilderRequest["goal"])} theme={theme}>
                      <option value="alerts">Alerts</option>
                      <option value="execution">Execution</option>
                      <option value="reporting">Reporting</option>
                      <option value="journaling">Journaling</option>
                    </StyledSelect>

                    <StyledSelect value={riskPreference || "balanced"} onChange={(v) => onRiskPreferenceChange(v as AiStrategyBuilderRequest["riskPreference"])} theme={theme}>
                      <option value="conservative">Conservative</option>
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                    </StyledSelect>

                    <StyledSelect value={selectedProvider} onChange={onProviderChange} theme={theme}>
                      {[...new Set(models.map((entry) => String(entry.provider)))].map((provider) => (
                        <option key={provider} value={provider}>{provider}</option>
                      ))}
                    </StyledSelect>
                  </motion.div>

                  {/* Row 2 — model + toggles */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.26 }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <StyledSelect value={selectedModel} onChange={onModelChange} theme={theme}>
                      {providerModels.map((model) => (
                        <option key={model.id} value={model.id}>{model.label}</option>
                      ))}
                    </StyledSelect>

                    <ToggleCheck label="Broker execution" checked={brokerExecution} onChange={onBrokerExecutionChange} />
                    <ToggleCheck label="Direct execution"  checked={allowDirectExecution} onChange={onAllowDirectExecutionChange} />
                  </motion.div>

                  {/* Row 3 — action chips */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.26 }}
                    style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                  >
                    {AI_ACTION_OPTIONS.map((action, i) => {
                      const active = selectedActions.includes(action);
                      return (
                        <motion.button
                          key={action}
                          type="button"
                          onClick={() => onToggleAction(action)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{
                            opacity: 1, y: 0,
                            borderColor: active ? T.or : T.bdr,
                            background:  active ? "rgba(249,115,22,0.24)" : "transparent",
                            color:       active ? "#FFFFFF" : "rgba(255,255,255,0.88)",
                            boxShadow:   active ? "0 0 0 1px rgba(249,115,22,0.45), 0 0 16px rgba(249,115,22,0.24)" : "none",
                          }}
                          whileTap={{ scale: 0.94 }}
                          transition={{
                            opacity: { delay: i * 0.035, duration: 0.22 },
                            y:       { delay: i * 0.035, duration: 0.22 },
                            borderColor: { duration: 0.16 },
                            background:  { duration: 0.16 },
                            color:       { duration: 0.16 },
                            boxShadow:   { duration: 0.18 },
                          }}
                          whileHover={{
                            y: -1,
                            scale: 1.02,
                            borderColor: T.or,
                            color: "#FFFFFF",
                            background: active ? "rgba(249,115,22,0.30)" : "rgba(249,115,22,0.18)",
                            boxShadow: "0 0 14px rgba(249,115,22,0.22)",
                          }}
                          style={{
                            padding: "5px 11px", borderRadius: 7,
                            border: "1px solid",
                            fontFamily: MONO, fontSize: 10,
                            cursor: "pointer", letterSpacing: "0.02em",
                            outline: "none",
                          }}
                        >
                          {action}
                        </motion.button>
                      );
                    })}
                  </motion.div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input box ── */}
          <motion.div
            style={{
              borderRadius: 24,
              border: `1px solid`,
              background: theme === "dark" ? "#000" : "#FFF8F5",
              padding: "14px 18px",
              position: "relative",
            }}
            animate={{
              borderColor: focused ? "rgba(249,115,22,0.38)" : theme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.18)",
              boxShadow: focused ? "0 0 40px rgba(249,115,22,0.06) inset" : "none",
            }}
            transition={{ duration: 0.28 }}
          >
            {/* focus line */}
            <motion.div
              style={{
                position: "absolute", top: 0, left: "5%", right: "5%", height: 1,
                background: `linear-gradient(90deg, transparent, ${T.or}, transparent)`,
                borderRadius: "0 0 2px 2px",
              }}
              animate={{ opacity: focused ? 0.5 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <div style={{ position: "relative" }}>
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
                placeholder="Ask to modify, add steps, or change conditions..."
                style={{
                  minHeight: 24,
                  resize: "none",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  lineHeight: 1.65,
                  width: "100%",
                  paddingRight: 56,
                  fontFamily: BODY,
                  fontWeight: 300,
                  color: theme === "dark" ? "#ffffff" : "#111111",
                  caretColor: T.or,
                }}
                className={cx(theme === "dark" ? "placeholder:text-neutral-600" : "placeholder:text-neutral-400")}
              />

              {/* Send button */}
              <motion.button
                type="button"
                onClick={onSend}
                disabled={sending || !canSend}
                style={{
                  position: "absolute",
                  right: 2,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canSend && !sending ? "pointer" : "not-allowed",
                  outline: "none",
                }}
                animate={{
                  borderColor: canSend && !sending ? T.or : T.bdr,
                  background: canSend && !sending ? T.or : T.surf2,
                  color: canSend && !sending ? "#111" : T.txtMute,
                  opacity: sending ? 0.5 : 1,
                  boxShadow: canSend && !sending
                    ? `0 0 20px ${T.orGlow}, 0 4px 14px rgba(0,0,0,0.4)`
                    : "none",
                }}
                whileHover={canSend && !sending ? { scale: 1.05, boxShadow: `0 0 24px rgba(249,115,22,0.42)` } : {}}
                whileTap={canSend && !sending ? { scale: 0.95 } : {}}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <Send style={{ width: 16, height: 16 }} className="text-white" />
              </motion.button>
            </div>
          </motion.div>

          {/* hint + error */}
          <motion.div
            style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, letterSpacing: "0.03em", fontWeight: 300 }}
            animate={{ color: focused ? "rgba(230,224,220,0.72)" : "rgba(230,224,220,0.56)" }}
            transition={{ duration: 0.28 }}
            className={cx(theme === "light" ? muted : "")}
          >
            Enter to send · Shift+Enter for newline
          </motion.div>

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
