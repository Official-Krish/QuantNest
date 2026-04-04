import { useEffect, useMemo, useState, type RefObject } from "react";
import type {
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
} from "@/types/api";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";
import {
  getRequiredMissingInputsCount,
} from "@/components/ai-builder/setupDialog.utils";
import { InlineMissingInputsCard } from "./InlineMissingInputsCard";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatBubble } from "./ChatBubble";
import { PendingWorkflowCard } from "./PendingWorkflowCard";
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
          <ChatEmptyState
            panel={panel}
            muted={muted}
            theme={theme}
            onExampleClick={onExampleClick}
          />
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
