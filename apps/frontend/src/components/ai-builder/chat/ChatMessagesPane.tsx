import type { RefObject } from "react";
import type { AiStrategyConversationMessage, AiStrategyDraftSession } from "@/types/api";
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
  panel: string;
  muted: string;
  theme: LocalTheme;
};

export function ChatMessagesPane({
  chatScrollRef,
  loading,
  activeDraft,
  messages,
  animatedMessageId,
  workflowVersions,
  panel,
  muted,
  theme,
}: ChatMessagesPaneProps) {
  let resultIndex = -1;

  return (
    <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <div className="mx-auto flex max-w-215 flex-col gap-3.5">
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
              <div key={message.id} className="space-y-2.5">
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
                {versionForMessage ? (
                  <div className="pl-10">
                    <WorkflowCanvasCard
                      version={versionForMessage}
                      theme={theme}
                      title={resultIndex === 0 ? "Generated Workflow" : versionForMessage.label}
                    />
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
