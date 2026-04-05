import { useEffect, useMemo } from "react";
import {
  apiGetAiModels,
  apiGetAiStrategyDraft,
  apiGetAiStrategyDraftVersion,
  apiListAiStrategyDrafts,
  apiSaveAiStrategyDraftSetup,
} from "@/http";
import { LAST_CHAT_DRAFT_STORAGE_KEY } from "@/components/ai-builder/chat/shared";
import { getVersionSetupState } from "@/components/ai-builder/chat/useAiChatDrafts";
import type {
  AiModelDescriptor,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
} from "@/types/api";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";

type UseAiDraftRestoreParams = {
  models: AiModelDescriptor[];
  selectedProvider: string;
  selectedModel: string;
  setModels: (value: AiModelDescriptor[]) => void;
  setSelectedProvider: (value: string) => void;
  setSelectedModel: (value: string) => void;
  setDraftSummaries: (value: AiStrategyDraftSummary[]) => void;
  setError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  syncActiveDraft: (draft: AiStrategyDraftSession) => void;
  activeDraft: AiStrategyDraftSession | null;
  activeVersionId: string;
  workflowName: string;
  metadataOverrides: AiMetadataOverrides;
  setWorkflowName: (value: string) => void;
  setMetadataOverrides: (value: AiMetadataOverrides) => void;
  setActiveDraft: (value: AiStrategyDraftSession) => void;
};

export function useAiDraftRestore({
  models,
  selectedProvider,
  selectedModel,
  setModels,
  setSelectedProvider,
  setSelectedModel,
  setDraftSummaries,
  setError,
  setLoading,
  syncActiveDraft,
  activeDraft,
  activeVersionId,
  workflowName,
  metadataOverrides,
  setWorkflowName,
  setMetadataOverrides,
  setActiveDraft,
}: UseAiDraftRestoreParams) {
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [modelRes, drafts] = await Promise.all([
          apiGetAiModels(),
          apiListAiStrategyDrafts(),
        ]);
        setModels(modelRes.models);
        const preferred =
          modelRes.models.find((entry) => entry.recommended) || modelRes.models[0];
        if (preferred) {
          setSelectedProvider(String(preferred.provider));
          setSelectedModel(preferred.id);
        }
        setDraftSummaries(drafts);

        const lastDraftId = window.localStorage.getItem(LAST_CHAT_DRAFT_STORAGE_KEY);
        const hasKnownLastDraft = Boolean(
          lastDraftId && drafts.some((draft) => draft.draftId === lastDraftId),
        );

        if (lastDraftId && !hasKnownLastDraft) {
          window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
        }

        const draftToLoad = hasKnownLastDraft ? lastDraftId : drafts[0]?.draftId;
        if (draftToLoad) {
          const draft = await apiGetAiStrategyDraft(draftToLoad);
          syncActiveDraft(draft);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load AI Builder chat.");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [
    setDraftSummaries,
    setError,
    setLoading,
    setModels,
    setSelectedModel,
    setSelectedProvider,
    syncActiveDraft,
  ]);

  const providerModels = useMemo(
    () => models.filter((entry) => String(entry.provider) === selectedProvider),
    [models, selectedProvider],
  );

  useEffect(() => {
    if (!providerModels.some((entry) => entry.id === selectedModel)) {
      setSelectedModel(providerModels[0]?.id || "");
    }
  }, [providerModels, selectedModel, setSelectedModel]);

  useEffect(() => {
    if (!activeDraft || !activeVersionId) return;

    const selectedSetupState = getVersionSetupState(activeDraft, activeVersionId);
    const selectedVersion = activeDraft.workflowVersions.find(
      (version) => version.id === activeVersionId,
    );
    if (!selectedVersion) return;

    const nextSetupState = { workflowName, metadataOverrides };
    const existing = {
      workflowName:
        selectedSetupState?.workflowName ||
        selectedVersion.response.plan.workflowName ||
        "",
      metadataOverrides: selectedSetupState?.metadataOverrides || {},
    };

    if (JSON.stringify(nextSetupState) === JSON.stringify(existing)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void apiSaveAiStrategyDraftSetup(
        activeDraft.draftId,
        nextSetupState,
        activeVersionId,
      )
        .then((draft) => setActiveDraft(draft))
        .catch(() => {});
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    activeDraft,
    activeVersionId,
    metadataOverrides,
    setActiveDraft,
    workflowName,
  ]);

  useEffect(() => {
    if (!activeDraft || !activeVersionId) return;

    let cancelled = false;

    void apiGetAiStrategyDraftVersion(activeDraft.draftId, activeVersionId)
      .then((payload) => {
        if (cancelled) return;

        setWorkflowName(
          payload.setupState?.workflowName || payload.version.response.plan.workflowName,
        );
        setMetadataOverrides(payload.setupState?.metadataOverrides || {});
      })
      .catch(() => {
        if (cancelled) return;

        const fallbackVersion =
          activeDraft.workflowVersions.find(
            (version) => version.id === activeVersionId,
          ) ||
          activeDraft.workflowVersions[activeDraft.workflowVersions.length - 1];

        if (!fallbackVersion) return;

        const fallbackSetupState = getVersionSetupState(activeDraft, fallbackVersion.id);
        setWorkflowName(
          fallbackSetupState?.workflowName || fallbackVersion.response.plan.workflowName,
        );
        setMetadataOverrides(fallbackSetupState?.metadataOverrides || {});
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeDraft,
    activeVersionId,
    setMetadataOverrides,
    setWorkflowName,
  ]);
}
