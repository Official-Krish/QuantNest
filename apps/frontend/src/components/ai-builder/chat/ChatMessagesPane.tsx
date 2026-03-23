import { useEffect, useMemo, useState, type RefObject } from "react";
import type { AiStrategyConversationMessage, AiStrategyDraftSession } from "@/types/api";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";
import { getFieldLabel, getFieldType, getNodeLabel, groupMissingInputs } from "@/components/ai-builder/setupDialog.utils";
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
};

function AssistantResponseCard({
  version,
  theme,
}: {
  version: AiStrategyDraftSession["workflowVersions"][number];
  theme: LocalTheme;
}) {
  const validation = version.response.validation;
  const missingCount = version.response.plan.missingInputs.filter((input) => input.required).length;
  const topWarnings = version.response.validation.issues.filter((issue) => issue.severity === "warning").slice(0, 2);
  const topErrors = version.response.validation.issues.filter((issue) => issue.severity === "error").slice(0, 2);

  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-3.5",
        theme === "dark" ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#f17463]/12 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#f17463]">
          {validation.canOpenInBuilder ? "Ready to use" : "Needs review"}
        </span>
        <span className={cx("rounded-full px-2.5 py-1 text-[10px]", theme === "dark" ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-600")}>
          {version.response.plan.nodes.length} nodes
        </span>
        <span className={cx("rounded-full px-2.5 py-1 text-[10px]", theme === "dark" ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-600")}>
          {validation.branchCount} branches
        </span>
        {missingCount > 0 ? (
          <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] text-amber-400">
            {missingCount} inputs needed
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className={cx("text-[10px] font-medium uppercase tracking-[0.16em]", theme === "dark" ? "text-neutral-500" : "text-neutral-400")}>
            Workflow
          </div>
          <div className={cx("mt-1 text-sm font-medium", theme === "dark" ? "text-neutral-100" : "text-neutral-900")}>
            {version.response.plan.workflowName}
          </div>
          <div className={cx("mt-2 text-xs leading-6", theme === "dark" ? "text-neutral-400" : "text-neutral-500")}>
            {version.response.plan.summary}
          </div>
        </div>

        <div className="space-y-2">
          <div className={cx("text-[10px] font-medium uppercase tracking-[0.16em]", theme === "dark" ? "text-neutral-500" : "text-neutral-400")}>
            Attention
          </div>
          {topErrors.length > 0 ? topErrors.map((issue) => (
            <div key={`${issue.code}-${issue.message}`} className={cx("rounded-xl px-3 py-2 text-xs leading-5", theme === "dark" ? "bg-rose-500/10 text-rose-200" : "bg-rose-50 text-rose-700")}>
              {issue.message}
            </div>
          )) : null}
          {topWarnings.length > 0 ? topWarnings.map((issue) => (
            <div key={`${issue.code}-${issue.message}`} className={cx("rounded-xl px-3 py-2 text-xs leading-5", theme === "dark" ? "bg-amber-500/10 text-amber-200" : "bg-amber-50 text-amber-700")}>
              {issue.message}
            </div>
          )) : null}
          {topErrors.length === 0 && topWarnings.length === 0 ? (
            <div className={cx("rounded-xl px-3 py-2 text-xs leading-5", theme === "dark" ? "bg-emerald-500/10 text-emerald-200" : "bg-emerald-50 text-emerald-700")}>
              Validation looks clean. You can keep refining or open this version in the builder.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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
  const groupedInputs = groupMissingInputs(activeDraft);
  const entries = Object.entries(groupedInputs);

  if (entries.length === 0) return null;

  const setFieldValue = (nodeId: string, key: string, rawValue: string, type: string) => {
    const nextValue = type === "number" ? Number(rawValue) : rawValue;
    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: {
        ...(metadataOverrides[nodeId] || {}),
        [key]: nextValue,
      },
    });
  };

  return (
    <div className={cx("rounded-2xl border p-4", theme === "dark" ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#f17463]">Setup needed</div>
          <div className={cx("mt-1 text-sm", theme === "dark" ? "text-neutral-200" : "text-neutral-800")}>
            Fill these required values inline and they will be saved to this draft automatically.
          </div>
        </div>
        <div className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] text-amber-400">
          {activeDraft.response.plan.missingInputs.filter((input) => input.required).length} required
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {entries.map(([nodeId, inputs]) => {
          const node = activeDraft.response.plan.nodes.find((entry) => entry.nodeId === nodeId);
          if (!node) return null;
          const baseMetadata = node.data.metadata || {};
          const overrideMetadata = metadataOverrides[nodeId] || {};

          return (
            <div key={nodeId} className={cx("rounded-xl border p-3", theme === "dark" ? "border-neutral-800 bg-black" : "border-neutral-200 bg-[#fafafa]")}>
              <div className={cx("mb-3 text-xs font-medium", theme === "dark" ? "text-neutral-200" : "text-neutral-800")}>
                {getNodeLabel(String(node.type))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {inputs.map((input) => {
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
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        {loading ? (
          <div className={cx("rounded-2xl border px-4 py-4 text-sm", panel)}>Loading conversation...</div>
        ) : !activeDraft && messages.length === 0 ? (
          <div className={cx("rounded-2xl border px-5 py-5", panel)}>
            <div className="text-sm font-medium text-[#f17463]">Start a new workflow</div>
            <div className={cx("mt-2 text-sm leading-7", muted)}>
              Describe the workflow, then keep refining it in chat. Every edit creates a version in the right-side history.
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
                    <AssistantResponseCard version={versionForMessage} theme={theme} />
                    <WorkflowCanvasCard
                      version={versionForMessage}
                      theme={theme}
                      title={resultIndex === 0 ? "Generated Workflow" : versionForMessage.label}
                      attached
                    />
                    {activeDraft &&
                    versionForMessage.id === activeDraft.workflowVersions[activeDraft.workflowVersions.length - 1]?.id &&
                    versionForMessage.response.plan.missingInputs.length > 0 ? (
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
