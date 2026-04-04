import { useCallback, useState } from "react";
import {
  apiDeleteAiStrategyDraft,
  apiGetAiStrategyDraft,
  apiRenameAiStrategyDraft,
} from "@/http";
import type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategySetupState,
} from "@/types/api";
import { DEFAULT_AI_CONSTRAINTS } from "@/components/ai-builder/constants";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";
import { LAST_CHAT_DRAFT_STORAGE_KEY } from "@/components/ai-builder/chat/shared";
import { toast } from "sonner";

export function getVersionSetupState(
  draft: AiStrategyDraftSession,
  versionId?: string,
): AiStrategySetupState | undefined {
  if (!versionId) return undefined;

  const mapped = draft.setupStateByVersionId?.[versionId];
  if (mapped) {
    return mapped;
  }

  const latestVersionId = draft.workflowVersions[draft.workflowVersions.length - 1]?.id;
  if (latestVersionId && latestVersionId === versionId) {
    return draft.setupState;
  }

  return undefined;
}

export type ChatMessageItem = AiStrategyConversationMessage & {
  pending?: boolean;
  typing?: boolean;
};

export function useAiChatDrafts() {

  const [models, setModels] = useState<AiModelDescriptor[]>([]);
  const [draftSummaries, setDraftSummaries] = useState<AiStrategyDraftSummary[]>([]);
  const [activeDraft, setActiveDraft] = useState<AiStrategyDraftSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowName, setWorkflowName] = useState("");
  const [metadataOverrides, setMetadataOverrides] = useState<AiMetadataOverrides>({});
  const [market, setMarket] = useState<AiStrategyBuilderRequest["market"]>("Indian");
  const [goal, setGoal] = useState<AiStrategyBuilderRequest["goal"]>("alerts");
  const [riskPreference, setRiskPreference] =
    useState<AiStrategyBuilderRequest["riskPreference"]>("balanced");
  const [brokerExecution, setBrokerExecution] = useState(false);
  const [allowDirectExecution, setAllowDirectExecution] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [constraints, setConstraints] = useState(DEFAULT_AI_CONSTRAINTS);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedModel, setSelectedModel] = useState("");
  const [activeVersionId, setActiveVersionId] = useState("");
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [pendingDeleteDraftId, setPendingDeleteDraftId] = useState<string | null>(null);

  const syncActiveDraft = useCallback((draft: AiStrategyDraftSession) => {
    const latestVersion = draft.workflowVersions[draft.workflowVersions.length - 1];
    const latestSetupState = getVersionSetupState(draft, latestVersion?.id);

    setActiveDraft(draft);
    setWorkflowName(
      latestSetupState?.workflowName ||
        latestVersion?.response.plan.workflowName ||
        draft.response.plan.workflowName,
    );
    setMetadataOverrides(latestSetupState?.metadataOverrides || {});
    setMarket(draft.request.market);
    setGoal(draft.request.goal);
    setRiskPreference(draft.request.riskPreference ?? "balanced");
    setBrokerExecution(Boolean(draft.request.brokerExecution));
    setAllowDirectExecution(Boolean(draft.request.allowDirectExecution));
    setSelectedActions([...(draft.request.preferredActions || [])]);
    setConstraints((draft.request.constraints || []).join("\n") || DEFAULT_AI_CONSTRAINTS);
    setSelectedProvider((current) => String(draft.request.model?.provider || current));
    setSelectedModel((current) => String(draft.request.model?.model || current));
    setActiveVersionId(latestVersion?.id || "");

    window.localStorage.setItem(LAST_CHAT_DRAFT_STORAGE_KEY, draft.draftId);
    setDraftSummaries((current) => {
      const summary: AiStrategyDraftSummary = {
        draftId: draft.draftId,
        title: draft.title,
        status: draft.status,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        workflowId: draft.workflowId,
        lastMessage: [...draft.messages]
          .reverse()
          .find((message) => message.role === "user")
          ?.content,
      };
      return [summary, ...current.filter((entry) => entry.draftId !== draft.draftId)];
    });
  }, []);

  const handleNewChat = useCallback((onConversationReset?: () => void) => {
    setActiveDraft(null);
    setWorkflowName("");
    setMetadataOverrides({});
    setActiveVersionId("");
    setError(null);
    onConversationReset?.();
    window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
  }, []);

  const handleLoadDraft = useCallback(
    async (draftId: string, onConversationReset?: () => void) => {
      setLoading(true);
      try {
        const draft = await apiGetAiStrategyDraft(draftId);
        onConversationReset?.();
        syncActiveDraft(draft);
      } catch (e: any) {
        if (e?.response?.status === 404) {
          if (window.localStorage.getItem(LAST_CHAT_DRAFT_STORAGE_KEY) === draftId) {
            window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
          }
          setDraftSummaries((current) =>
            current.filter((entry) => entry.draftId !== draftId),
          );
          handleNewChat(onConversationReset);
          return;
        }

        setError(
          e?.response?.data?.message ??
            e?.message ??
            "Failed to load AI conversation.",
        );
      } finally {
        setLoading(false);
      }
    },
    [handleNewChat, syncActiveDraft],
  );

  const performDeleteDraft = useCallback(
    async (draftId: string, onConversationReset?: () => void) => {
      if (!draftId) return;

      try {
        await apiDeleteAiStrategyDraft(draftId);

        const nextSummaries = draftSummaries.filter((entry) => entry.draftId !== draftId);
        setDraftSummaries(nextSummaries);

        const wasActive = activeDraft?.draftId === draftId;
        if (wasActive) {
          const nextDraftId = nextSummaries[0]?.draftId;
          if (nextDraftId) {
            await handleLoadDraft(nextDraftId, onConversationReset);
          } else {
            handleNewChat(onConversationReset);
          }
        }

        if (window.localStorage.getItem(LAST_CHAT_DRAFT_STORAGE_KEY) === draftId) {
          window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
        }

        toast.success("Conversation deleted");
      } catch (e: any) {
        const message =
          e?.response?.data?.message ??
          e?.message ??
          "Failed to delete conversation.";
        toast.error(message);
      } finally {
        setPendingDeleteDraftId(null);
      }
    },
    [activeDraft?.draftId, draftSummaries, handleLoadDraft, handleNewChat],
  );

  const handleDeleteDraft = useCallback((draftId: string) => {
    setPendingDeleteDraftId(draftId);
  }, []);

  const handleRenameDraft = useCallback(
    async (draftId: string, nextTitleRaw: string) => {
      const nextTitle = nextTitleRaw.trim();
      if (nextTitle.length < 3) {
        toast.error("Title must be at least 3 characters.");
        return;
      }

      try {
        const updatedDraft = await apiRenameAiStrategyDraft(draftId, nextTitle);
        setDraftSummaries((current) =>
          current.map((entry) =>
            entry.draftId === updatedDraft.draftId
              ? {
                  ...entry,
                  title: updatedDraft.title,
                  updatedAt: updatedDraft.updatedAt,
                }
              : entry,
          ),
        );

        if (activeDraft?.draftId === updatedDraft.draftId) {
          setActiveDraft(updatedDraft);
        }

        toast.success("Conversation renamed");
      } catch (e: any) {
        const message =
          e?.response?.data?.message ??
          e?.message ??
          "Failed to rename conversation.";
        toast.error(message);
        throw e;
      }
    },
    [activeDraft?.draftId],
  );

  return {
    models,
    setModels,
    draftSummaries,
    setDraftSummaries,
    activeDraft,
    setActiveDraft,
    error,
    setError,
    loading,
    setLoading,
    workflowName,
    setWorkflowName,
    metadataOverrides,
    setMetadataOverrides,
    market,
    setMarket,
    goal,
    setGoal,
    riskPreference,
    setRiskPreference,
    brokerExecution,
    setBrokerExecution,
    allowDirectExecution,
    setAllowDirectExecution,
    selectedActions,
    setSelectedActions,
    constraints,
    setConstraints,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    activeVersionId,
    setActiveVersionId,
    showRightSidebar,
    setShowRightSidebar,
    pendingDeleteDraftId,
    setPendingDeleteDraftId,
    syncActiveDraft,
    handleNewChat,
    handleLoadDraft,
    performDeleteDraft,
    handleDeleteDraft,
    handleRenameDraft,
  };
}
