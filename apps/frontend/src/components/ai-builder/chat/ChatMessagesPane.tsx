import type { RefObject } from "react";
import type { AiStrategyDraftSession } from "@/types/api";
import { ChatBubble } from "./ChatBubble";
import { cx, type LocalTheme } from "./shared";

type ChatMessagesPaneProps = {
  chatScrollRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  activeDraft: AiStrategyDraftSession | null;
  panel: string;
  muted: string;
  theme: LocalTheme;
};

export function ChatMessagesPane({
  chatScrollRef,
  loading,
  activeDraft,
  panel,
  muted,
  theme,
}: ChatMessagesPaneProps) {
  return (
    <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <div className="mx-auto flex max-w-215 flex-col gap-3.5">
        {loading ? (
          <div className={cx("rounded-2xl border px-4 py-4 text-sm", panel)}>Loading conversation...</div>
        ) : !activeDraft ? (
          <div className={cx("rounded-2xl border px-5 py-5", panel)}>
            <div className="text-sm font-medium text-[#f17463]">Start a new workflow</div>
            <div className={cx("mt-2 text-sm leading-7", muted)}>
              Describe the workflow, then keep refining it in chat. Every edit creates a version in the right-side history.
            </div>
          </div>
        ) : (
          activeDraft.messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              kind={message.kind}
              timestamp={message.createdAt}
              theme={theme}
            />
          ))
        )}
      </div>
    </div>
  );
}
