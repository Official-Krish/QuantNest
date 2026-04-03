import { useEffect, useMemo, useState, type RefObject } from "react";
import { apiGetGoogleSheetsServiceAccount, apiGetReusableSecrets, apiVerifyGoogleSheets } from "@/http";
import type {
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
  ReusableSecretService,
  ReusableSecretSummary,
} from "@/types/api";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";
import {
  getFieldLabel,
  getFieldType,
  getGoogleSheetsVerificationErrorDetails,
  getNodeLabel,
  getRequiredMissingInputsCount,
  getReusableSecretServiceForNodeType,
  groupMissingInputs,
  isGoogleSheetsReportNodeType,
  shouldHideInputWhenSecretSelected,
  suggestReusableSecretId,
} from "@/components/ai-builder/setupDialog.utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { ChatBubble } from "./ChatBubble";
import { WorkflowCanvasCard } from "./WorkflowCanvasCard";
import { cx, type LocalTheme } from "./shared";

type ChatMessageItem = AiStrategyConversationMessage & {
  pending?: boolean;
  typing?: boolean;
};

type ChatMessagesPaneProps = {
  chatScrollRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  activeDraft: AiStrategyDraftSession | null;
  messages: ChatMessageItem[];
  animatedMessageId?: string | null;
  workflowVersions: AiStrategyDraftSession["workflowVersions"];
  metadataOverrides: AiMetadataOverrides;
  onMetadataOverridesChange: (value: AiMetadataOverrides) => void;
  panel: string;
  muted: string;
  theme: LocalTheme;
  compact?: boolean;
  onExampleClick?: (example: string) => void;
};

function InlineMissingInputsCard({
  activeDraft,
  metadataOverrides,
  onMetadataOverridesChange,
  theme,
}: {
  activeDraft: AiStrategyDraftSession;
  metadataOverrides: AiMetadataOverrides;
  onMetadataOverridesChange: (value: AiMetadataOverrides) => void;
  theme: LocalTheme;
}) {
  const secretHelperTextByService: Record<string, string> = {
    slack: "Your Slack Bot token",
    discord: "Your Discord webhook credential",
    telegram: "Your Telegram bot credential",
    whatsapp: "Your WhatsApp API credential",
    gmail: "Your Gmail app credential",
    zerodha: "Your Zerodha broker credential",
    groww: "Your Groww broker credential",
    lighter: "Your Lighter broker credential",
    "notion-daily-report": "Your Notion integration credential",
    "google-drive-daily-csv": "Your Google Drive credential",
    "google-sheets-report": "Your Google Sheets credential",
  };

  const groupedInputs = groupMissingInputs(activeDraft);
  const entries = Object.entries(groupedInputs);
  const [secretsByService, setSecretsByService] = useState<Partial<Record<ReusableSecretService, ReusableSecretSummary[]>>>({});
  const [googleSheetsServiceAccountEmail, setGoogleSheetsServiceAccountEmail] = useState("");
  const [googleSheetsVerifyingByNode, setGoogleSheetsVerifyingByNode] = useState<Record<string, boolean>>({});
  const [googleSheetsVerifySuccessByNode, setGoogleSheetsVerifySuccessByNode] = useState<Record<string, string>>({});
  const [copiedGoogleSheetsNodeId, setCopiedGoogleSheetsNodeId] = useState<string | null>(null);

  const hasGoogleSheetsNode = entries.some(([nodeId]) => {
    const node = activeDraft.response.plan.nodes.find((entry) => entry.nodeId === nodeId);
    return node ? isGoogleSheetsReportNodeType(String(node.type)) : false;
  });

  const servicesToLoad = Array.from(
    new Set(
      entries
        .map(([nodeId]) => {
          const node = activeDraft.response.plan.nodes.find((entry) => entry.nodeId === nodeId);
          return node ? getReusableSecretServiceForNodeType(String(node.type)) : null;
        })
        .filter((service): service is ReusableSecretService => Boolean(service)),
    ),
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const missing = servicesToLoad.filter((service) => !secretsByService[service]);
      if (!missing.length) return;

      const results = await Promise.all(
        missing.map(async (service) => [service, await apiGetReusableSecrets(service)] as const),
      );

      if (cancelled) return;

      setSecretsByService((current) => ({
        ...current,
        ...Object.fromEntries(results),
      }));
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [servicesToLoad.join("|"), secretsByService]);

  useEffect(() => {
    if (!hasGoogleSheetsNode || googleSheetsServiceAccountEmail) return;

    let cancelled = false;

    const loadServiceAccount = async () => {
      try {
        const response = await apiGetGoogleSheetsServiceAccount();
        if (!cancelled) {
          setGoogleSheetsServiceAccountEmail(response.serviceAccountEmail || "");
        }
      } catch {
        // Keep setup usable even when the helper endpoint is temporarily unavailable.
      }
    };

    void loadServiceAccount();

    return () => {
      cancelled = true;
    };
  }, [hasGoogleSheetsNode, googleSheetsServiceAccountEmail]);

  useEffect(() => {
    const nextOverrides = { ...metadataOverrides };
    let changed = false;

    for (const [nodeId] of entries) {
      const node = activeDraft.response.plan.nodes.find((entry) => entry.nodeId === nodeId);
      if (!node) continue;

      const service = getReusableSecretServiceForNodeType(String(node.type));
      if (!service || !(service in secretsByService)) continue;

      const baseMetadata = node.data.metadata || {};
      const overrideMetadata = metadataOverrides[nodeId] || {};
      const resolvedSecretId = Object.prototype.hasOwnProperty.call(overrideMetadata, "secretId")
        ? String(overrideMetadata.secretId || "").trim()
        : String(baseMetadata.secretId || "").trim();

      if (!resolvedSecretId) continue;

      const isValid = (secretsByService[service] || []).some((secret) => secret.id === resolvedSecretId);
      if (isValid) continue;

      nextOverrides[nodeId] = {
        ...overrideMetadata,
        secretId: "",
      };
      changed = true;
    }

    if (changed) {
      onMetadataOverridesChange(nextOverrides);
    }
  }, [activeDraft.response.plan.nodes, entries, metadataOverrides, onMetadataOverridesChange, secretsByService]);

  const setFieldValue = (nodeId: string, key: string, rawValue: string, type: string) => {
    const nextValue = type === "number" ? Number(rawValue) : rawValue;

    if (key === "sheetUrl") {
      setGoogleSheetsVerifySuccessByNode((current) => {
        const next = { ...current };
        delete next[nodeId];
        return next;
      });
    }

    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: {
        ...(metadataOverrides[nodeId] || {}),
        [key]: nextValue,
      },
    });
  };

  const verifyGoogleSheetNode = async (
    nodeId: string,
    baseMetadata: Record<string, unknown>,
    overrideMetadata: Record<string, unknown>,
  ) => {
    const sheetUrl = String(overrideMetadata.sheetUrl ?? baseMetadata.sheetUrl ?? "").trim();
    if (!sheetUrl) {
      toast.error("Google Sheet verification failed", {
        description: "Please paste a valid Google Sheet link.",
      });
      return;
    }

    setGoogleSheetsVerifyingByNode((current) => ({ ...current, [nodeId]: true }));
    setGoogleSheetsVerifySuccessByNode((current) => {
      const next = { ...current };
      delete next[nodeId];
      return next;
    });

    try {
      const response = await apiVerifyGoogleSheets({ sheetUrl });

      onMetadataOverridesChange({
        ...metadataOverrides,
        [nodeId]: {
          ...(metadataOverrides[nodeId] || {}),
          sheetId: response.sheet.sheetId,
          sheetName: response.sheet.sheetName,
          serviceAccountEmail: response.sheet.serviceAccountEmail,
        },
      });

      setGoogleSheetsServiceAccountEmail(response.sheet.serviceAccountEmail || "");
      setGoogleSheetsVerifySuccessByNode((current) => ({
        ...current,
        [nodeId]: `Verified: ${response.sheet.spreadsheetTitle} (${response.sheet.sheetName})`,
      }));

      toast.success("Google Sheet verified", {
        description: `${response.sheet.spreadsheetTitle} (${response.sheet.sheetName})`,
      });
    } catch (error) {
      const { friendlyMessage, serviceAccountEmail } = getGoogleSheetsVerificationErrorDetails(error);
      if (serviceAccountEmail) {
        setGoogleSheetsServiceAccountEmail(serviceAccountEmail);
        onMetadataOverridesChange({
          ...metadataOverrides,
          [nodeId]: {
            ...(metadataOverrides[nodeId] || {}),
            serviceAccountEmail,
          },
        });
      }

      toast.error("Google Sheet verification failed", {
        description: friendlyMessage,
      });
    } finally {
      setGoogleSheetsVerifyingByNode((current) => ({ ...current, [nodeId]: false }));
    }
  };

  const copyGoogleSheetsServiceAccount = async (nodeId: string, email: string) => {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopiedGoogleSheetsNodeId(nodeId);
      setTimeout(() => {
        setCopiedGoogleSheetsNodeId((current) => (current === nodeId ? null : current));
      }, 1500);
    } catch {
      toast.error("Could not copy service account email", {
        description: "Please copy it manually.",
      });
    }
  };

  const setSecretId = (nodeId: string, secretId?: string) => {
    const nextNodeOverrides = { ...(metadataOverrides[nodeId] || {}) };
    if (secretId !== undefined) {
      nextNodeOverrides.secretId = secretId;
    } else {
      delete nextNodeOverrides.secretId;
    }

    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: nextNodeOverrides,
    });
  };

  if (entries.length === 0) return null;

  return (
    <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white")}>
      <div>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f17463]">
            <span>Setup needed</span>
            <span className={cx("rounded-full px-2 py-0.5 text-[10px] normal-case tracking-normal", theme === "dark" ? "bg-[#f17463]/15 text-[#f7b2a7]" : "bg-[#fff2ed] text-[#d95f4f]")}>
              {getRequiredMissingInputsCount(activeDraft)} required
            </span>
          </div>
          <div className={cx("mt-1 text-sm", theme === "dark" ? "text-neutral-200" : "text-neutral-800")}>
            Fill these required values inline and they will be saved to this draft automatically.
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {entries.map(([nodeId, inputs]) => {
          const node = activeDraft.response.plan.nodes.find((entry) => entry.nodeId === nodeId);
          if (!node) return null;
          const baseMetadata = node.data.metadata || {};
          const overrideMetadata = metadataOverrides[nodeId] || {};
          const service = getReusableSecretServiceForNodeType(String(node.type));
          const availableSecrets = service ? (secretsByService[service] || []) : [];
          const nodeType = String(node.type);
          const isGoogleSheetsNode = isGoogleSheetsReportNodeType(nodeType);
          const currentSecretId = Object.prototype.hasOwnProperty.call(overrideMetadata, "secretId")
            ? String(overrideMetadata.secretId || "").trim()
            : String(baseMetadata.secretId || "").trim();
          const hasValidSecretId = currentSecretId.length > 0 && availableSecrets.some((secret) => secret.id === currentSecretId);
          const suggestedSecretId = hasValidSecretId ? null : suggestReusableSecretId(availableSecrets, inputs);
          const suggestedSecret = suggestedSecretId
            ? availableSecrets.find((secret) => secret.id === suggestedSecretId)
            : null;
          const secretHelperText = service ? secretHelperTextByService[service] : null;
          const googleSheetsServiceEmail = String(
            overrideMetadata.serviceAccountEmail ??
            baseMetadata.serviceAccountEmail ??
            googleSheetsServiceAccountEmail,
          ).trim();
          const isVerifyingGoogleSheet = Boolean(googleSheetsVerifyingByNode[nodeId]);
          const googleSheetsVerifySuccess = googleSheetsVerifySuccessByNode[nodeId] || "";

          return (
            <div key={nodeId} className={cx("rounded-xl border p-3", theme === "dark" ? "border-neutral-800 bg-black" : "border-neutral-200 bg-[#fafafa]")}>
              <div className={cx("mb-3 text-xs font-medium", theme === "dark" ? "text-neutral-200" : "text-neutral-800")}>
                {getNodeLabel(nodeType)}
              </div>

              {service ? (
                <div className="mb-3 space-y-2">
                  {secretHelperText ? (
                    <div className={cx("inline-flex items-center gap-1.5 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
                      <CircleHelp className="h-3.5 w-3.5" />
                      <span>{secretHelperText}</span>
                    </div>
                  ) : null}
                  <Select
                    value={hasValidSecretId ? currentSecretId : "manual"}
                    onValueChange={(value) => setSecretId(nodeId, value === "manual" ? "" : value)}
                  >
                    <SelectTrigger
                      className={cx(
                        "h-9 text-xs font-medium",
                        theme === "dark"
                          ? "border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-600"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400",
                      )}
                    >
                      <SelectValue placeholder="Use one-time values" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-[#0f0f0f] text-neutral-100">
                      <SelectItem value="manual" className="text-xs">Use one-time values</SelectItem>
                      {availableSecrets.map((secret) => (
                        <SelectItem key={secret.id} value={secret.id} className="text-xs">
                          {secret.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasValidSecretId ? (
                    <div className="text-[11px] text-[#f7b2a7]">
                      Credentials will resolve from this saved secret at runtime.
                    </div>
                  ) : currentSecretId ? (
                    <div className="text-[11px] text-amber-300">
                      This saved secret is no longer available. Choose another secret or enter values manually.
                    </div>
                  ) : suggestedSecret ? (
                    <button
                      type="button"
                      onClick={() => setSecretId(nodeId, suggestedSecret.id)}
                      className={cx(
                        "rounded-lg border px-2.5 py-1 text-[11px] transition",
                        theme === "dark"
                          ? "border-[#f17463]/35 bg-[#f17463]/8 text-[#f7b2a7] hover:border-[#f17463]/55"
                          : "border-[#f17463]/30 bg-[#fff3ee] text-[#d95f4f] hover:border-[#f17463]/45",
                      )}
                    >
                      Use suggested: {suggestedSecret.name}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {inputs
                  .filter((input) => !shouldHideInputWhenSecretSelected(nodeType, input.field, hasValidSecretId))
                  .map((input) => {
                  const type = getFieldType(input.field, input.secret);
                  const value = overrideMetadata[input.field] ?? baseMetadata[input.field] ?? "";
                  return (
                    <label key={`${nodeId}-${input.field}`} className="space-y-1.5">
                      <span className={cx("text-[11px]", theme === "dark" ? "text-neutral-400" : "text-neutral-500")}>
                        {input.label || getFieldLabel(input.field)}
                      </span>
                      <input
                        type={type}
                        value={String(value)}
                        onChange={(e) => setFieldValue(nodeId, input.field, e.target.value, type)}
                        placeholder={input.reason}
                        className={cx(
                          "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                          theme === "dark"
                            ? "border-neutral-800 bg-[#111111] text-neutral-100 placeholder:text-neutral-500"
                            : "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400",
                        )}
                      />
                    </label>
                  );
                  })}
              </div>

              {isGoogleSheetsNode ? (
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => verifyGoogleSheetNode(nodeId, baseMetadata, overrideMetadata)}
                    disabled={isVerifyingGoogleSheet}
                    className={cx(
                      "w-full rounded-xl px-3 py-2 text-xs font-medium transition",
                      theme === "dark"
                        ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
                        : "bg-neutral-900 text-neutral-100 hover:bg-neutral-700 disabled:opacity-60",
                    )}
                  >
                    {isVerifyingGoogleSheet ? "Verifying access..." : "Verify Sheet Access"}
                  </button>

                  {googleSheetsVerifySuccess ? (
                    <div className={cx("rounded-lg border p-2 text-[11px]", theme === "dark" ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-emerald-300 bg-emerald-50 text-emerald-700")}>
                      {googleSheetsVerifySuccess}
                    </div>
                  ) : null}

                  <div className={cx("rounded-lg border p-2", theme === "dark" ? "border-neutral-700/50 bg-neutral-900/30" : "border-neutral-200 bg-neutral-50") }>
                    <p className={cx("text-[11px]", theme === "dark" ? "text-neutral-400" : "text-neutral-600")}>
                      Share your Google Sheet with this service account as Editor before verification.
                    </p>
                    {googleSheetsServiceEmail ? (
                      <div className={cx("mt-2 flex items-center justify-between gap-2 rounded-md border px-2 py-2", theme === "dark" ? "border-neutral-700/70 bg-black/30" : "border-neutral-200 bg-white") }>
                        <p className={cx("truncate text-[11px]", theme === "dark" ? "text-neutral-200" : "text-neutral-700")}>{googleSheetsServiceEmail}</p>
                        <button
                          type="button"
                          onClick={() => copyGoogleSheetsServiceAccount(nodeId, googleSheetsServiceEmail)}
                          className={cx(
                            "rounded-md border px-2 py-1 text-[11px] transition",
                            theme === "dark"
                              ? "border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                              : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
                          )}
                        >
                          {copiedGoogleSheetsNodeId === nodeId ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <p className={cx("mt-1 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
                        Service account email will appear once backend configuration is loaded.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendingWorkflowCard({ theme }: { theme: LocalTheme }) {
  return (
    <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white")}>
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f17463]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f17463]" />
        Building workflow preview
      </div>
      <div className={cx("mt-3 h-44 rounded-2xl border", theme === "dark" ? "border-neutral-800 bg-[#111111]" : "border-neutral-200 bg-[#f7f7f7]")} />
      <div className="mt-3 space-y-2">
        <div className={cx("h-3 w-2/3 animate-pulse rounded", theme === "dark" ? "bg-neutral-800" : "bg-neutral-200")} />
        <div className={cx("h-3 w-1/2 animate-pulse rounded", theme === "dark" ? "bg-neutral-800" : "bg-neutral-200")} />
      </div>
    </div>
  );
}

const EXAMPLE_PROMPTS = [
  "For HDFC, trigger a Gmail alert when price drops below 1000 and include current price, day low, and volume in the message.",
  "Monitor RELIANCE on 15m timeframe and send a Discord alert when RSI crosses below 30 with symbol, RSI value, and timestamp.",
  "Every day at 9:15 PM, send a WhatsApp summary of NIFTY 50 top gainers and losers with percentage change and closing price.",
  "For BTCUSDT, execute a sell signal when price breaks below the 20 EMA and also send a fallback Gmail alert if execution fails.",
];

export function ChatMessagesPane({
  chatScrollRef,
  loading,
  activeDraft,
  messages,
  animatedMessageId,
  workflowVersions,
  metadataOverrides,
  onMetadataOverridesChange,
  panel,
  muted,
  theme,
  compact = false,
  onExampleClick,
}: ChatMessagesPaneProps) {
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const loadingSteps = useMemo(
    () => ["Updating workflow logic", "Validating nodes", "Preparing preview"],
    [],
  );

  useEffect(() => {
    if (!messages.some((message) => message.typing)) return;

    const timer = window.setInterval(() => {
      setLoadingStepIndex((current) => (current + 1) % loadingSteps.length);
    }, 1100);

    return () => window.clearInterval(timer);
  }, [loadingSteps, messages]);

  let resultIndex = -1;

  return (
    <div ref={chatScrollRef} className="min-h-0 overflow-y-auto px-5 py-8">
      <div className={cx("mx-auto flex w-full min-w-0 flex-col gap-4", compact ? "max-w-245" : "max-w-295")}>
        {loading ? (
          <div className={cx("rounded-2xl border px-4 py-4 text-sm", panel)}>Loading conversation...</div>
        ) : !activeDraft && messages.length === 0 ? (
          <div className="flex min-h-[calc(100vh-360px)] flex-col gap-4">
            <div className={cx("rounded-2xl border px-5 py-5", panel)}>
              <div className="text-sm font-medium text-[#f17463]">Start a new workflow</div>
              <div className={cx("mt-2 text-sm leading-7", muted)}>
                Describe the workflow, then keep refining it in chat. Every edit creates a version in the right-side history.
              </div>
            </div>

            <div>
              <div className={cx("mb-3 text-xs font-medium uppercase tracking-[0.12em]", muted)}>
                Get started with examples
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    onClick={() => onExampleClick?.(example)}
                    className={cx(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:border-[#f17463]/50 hover:bg-[#f17463]/5 cursor-pointer",
                      theme === "dark"
                        ? "border-neutral-800 text-neutral-300"
                        : "border-neutral-200 text-neutral-700",
                    )}
                  >
                    <div className="font-medium">{example}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[#f17463]/25 blur-[10px]" aria-hidden="true" />
                  <img
                    src="/Logo.png"
                    width={40}
                    height={40}
                    alt="QuantNest logo"
                    className="relative rounded-full opacity-95"
                  />
                </div>
                <div className={cx("text-[10px] font-medium uppercase tracking-[0.14em]", muted)}>
                  Ready When You Are
                </div>
                <div className={cx("text-xs", muted)}>
                  Pick an example or write a prompt to generate your first workflow.
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isAssistantResult = message.role === "assistant" && message.kind === "result" && !message.typing;
            if (isAssistantResult) {
              resultIndex += 1;
            }
            const versionForMessage = isAssistantResult ? workflowVersions[resultIndex] || null : null;

            return (
              <div key={message.id} className="space-y-3">
                <ChatBubble
                  role={message.role}
                  content={message.content}
                  kind={message.kind}
                  timestamp={message.createdAt}
                  theme={theme}
                  pending={message.pending}
                  typing={message.typing}
                  animate={message.id === animatedMessageId}
                />
                {message.typing ? (
                  <div className="pl-8 space-y-2">
                    <div className={cx("rounded-xl border px-3 py-2 text-xs", theme === "dark" ? "border-[#f17463]/20 bg-[#120d0b] text-[#f3c7bf]" : "border-neutral-200 bg-white text-neutral-600")}>
                      {loadingSteps[loadingStepIndex]}
                    </div>
                    <PendingWorkflowCard theme={theme} />
                  </div>
                ) : null}
                {versionForMessage ? (
                  <div className="pl-8 space-y-0">
                    <WorkflowCanvasCard
                      version={versionForMessage}
                      theme={theme}
                      title={resultIndex === 0 ? "Generated Workflow" : versionForMessage.label}
                      attached
                    />
                    {activeDraft &&
                    versionForMessage.id === activeDraft.workflowVersions[activeDraft.workflowVersions.length - 1]?.id &&
                    getRequiredMissingInputsCount(activeDraft) > 0 ? (
                      <div className="pt-2">
                        <InlineMissingInputsCard
                          activeDraft={activeDraft}
                          metadataOverrides={metadataOverrides}
                          onMetadataOverridesChange={onMetadataOverridesChange}
                          theme={theme}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
