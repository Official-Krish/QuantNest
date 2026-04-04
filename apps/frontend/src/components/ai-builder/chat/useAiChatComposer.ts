import { useCallback, useState } from "react";
import { apiCreateAiStrategyDraft, apiEditAiStrategyDraft } from "@/http";
import type {
  AiStrategyBuilderRequest,
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
} from "@/types/api";
import { toRequestPayload } from "@/components/ai-builder/chat/shared";

type PendingMessage = AiStrategyConversationMessage & {
  pending?: boolean;
  typing?: boolean;
};

type UseAiChatComposerParams = {
  activeDraft: AiStrategyDraftSession | null;
  market: AiStrategyBuilderRequest["market"];
  goal: AiStrategyBuilderRequest["goal"];
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  brokerExecution: boolean;
  allowDirectExecution: boolean;
  selectedActions: string[];
  constraints: string;
  selectedProvider: string;
  selectedModel: string;
  syncActiveDraft: (draft: AiStrategyDraftSession) => void;
  setError: (value: string | null) => void;
};

export function useAiChatComposer({
  activeDraft,
  market,
  goal,
  riskPreference,
  brokerExecution,
  allowDirectExecution,
  selectedActions,
  constraints,
  selectedProvider,
  selectedModel,
  syncActiveDraft,
  setError,
}: UseAiChatComposerParams) {
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(null);

  const resetConversationUi = useCallback(() => {
    setComposer("");
    setPendingMessages([]);
    setAnimatedMessageId(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (composer.trim().length < 4 || !selectedModel) return;

    const messageText = composer.trim();
    const now = new Date().toISOString();
    const optimisticUserMessage: PendingMessage = {
      id: `pending_user_${Date.now()}`,
      role: "user",
      kind: activeDraft ? "edit" : "prompt",
      content: messageText,
      createdAt: now,
      pending: true,
    };
    const optimisticAssistantMessage: PendingMessage = {
      id: `pending_assistant_${Date.now()}`,
      role: "assistant",
      kind: "result",
      content: "",
      createdAt: now,
      pending: true,
      typing: true,
    };

    setComposer("");
    setPendingMessages([optimisticUserMessage, optimisticAssistantMessage]);
    setSending(true);
    setError(null);

    try {
      if (!activeDraft) {
        const draft = await apiCreateAiStrategyDraft(
          toRequestPayload({
            prompt: messageText,
            market,
            goal,
            riskPreference,
            brokerExecution,
            allowDirectExecution,
            selectedActions,
            constraints,
            selectedProvider,
            selectedModel,
          }),
        );
        syncActiveDraft(draft);
        setAnimatedMessageId(
          [...draft.messages]
            .reverse()
            .find(
              (message) =>
                message.role === "assistant" && message.kind === "result",
            )?.id || null,
        );
      } else {
        const draft = await apiEditAiStrategyDraft(activeDraft.draftId, {
          instruction: messageText,
          model: {
            provider: selectedProvider,
            model: selectedModel,
          },
        });
        syncActiveDraft(draft);
        setAnimatedMessageId(
          [...draft.messages]
            .reverse()
            .find(
              (message) =>
                message.role === "assistant" && message.kind === "result",
            )?.id || null,
        );
      }
      setPendingMessages([]);
    } catch (e: any) {
      setComposer(messageText);
      setPendingMessages([]);
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to send AI message.");
    } finally {
      setSending(false);
    }
  }, [
    activeDraft,
    allowDirectExecution,
    brokerExecution,
    composer,
    constraints,
    goal,
    market,
    riskPreference,
    selectedActions,
    selectedModel,
    selectedProvider,
    setError,
    syncActiveDraft,
  ]);

  const visibleMessages = [
    ...(activeDraft?.messages || []),
    ...pendingMessages,
  ] as Array<PendingMessage>;

  return {
    composer,
    setComposer,
    sending,
    pendingMessages,
    animatedMessageId,
    handleSend,
    visibleMessages,
    resetConversationUi,
  };
}
