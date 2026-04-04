import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  apiCreateAiStrategyDraft,
  apiDeleteAiStrategyDraft,
  apiEditAiStrategyDraft,
  apiGetAiModels,
  apiGetAiStrategyDraft,
  apiGetAiStrategyDraftVersion,
  apiListAiStrategyDrafts,
  apiRenameAiStrategyDraft,
  apiSaveAiStrategyDraftSetup,
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
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { AiPlanSetupDialog } from "@/components/ai-builder/AiPlanSetupDialog";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";
import {
  cx,
  LAST_CHAT_DRAFT_STORAGE_KEY,
  toRequestPayload,
  type LocalTheme,
} from "@/components/ai-builder/chat/shared";
import { LeftSidebar } from "@/components/ai-builder/chat/LeftSidebar";
import { ChatTopHeader } from "@/components/ai-builder/chat/ChatTopHeader";
import { ChatMessagesPane } from "@/components/ai-builder/chat/ChatMessagesPane";
import { ChatComposerSection } from "@/components/ai-builder/chat/ChatComposerSection";
import { RightSidebar } from "@/components/ai-builder/chat/RightSidebar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function getVersionSetupState(
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

export function AiStrategyChatBuilder() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<LocalTheme>("dark");
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<AiModelDescriptor[]>([]);
  const [draftSummaries, setDraftSummaries] = useState<AiStrategyDraftSummary[]>([]);
  const [activeDraft, setActiveDraft] = useState<AiStrategyDraftSession | null>(null);
  const [composer, setComposer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<
    Array<AiStrategyConversationMessage & { pending?: boolean; typing?: boolean }>
  >([]);
  const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
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
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [modelRes, drafts] = await Promise.all([apiGetAiModels(), apiListAiStrategyDrafts()]);
        setModels(modelRes.models);
        const preferred = modelRes.models.find((entry) => entry.recommended) ?? modelRes.models[0];
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
  }, []);

  const providerModels = useMemo(
    () => models.filter((entry) => String(entry.provider) === selectedProvider),
    [models, selectedProvider],
  );

  useEffect(() => {
    if (!providerModels.some((entry) => entry.id === selectedModel)) {
      setSelectedModel(providerModels[0]?.id || "");
    }
  }, [providerModels, selectedModel]);

  const filteredDrafts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return draftSummaries;
    return draftSummaries.filter((draft) =>
      `${draft.title} ${draft.lastMessage || ""}`.toLowerCase().includes(query),
    );
  }, [draftSummaries, search]);

  const syncActiveDraft = (draft: AiStrategyDraftSession) => {
    const latestVersion = draft.workflowVersions[draft.workflowVersions.length - 1];
    const latestSetupState = getVersionSetupState(draft, latestVersion?.id);

    setActiveDraft(draft);
    setWorkflowName(latestSetupState?.workflowName || latestVersion?.response.plan.workflowName || draft.response.plan.workflowName);
    setMetadataOverrides(latestSetupState?.metadataOverrides || {});
    setMarket(draft.request.market);
    setGoal(draft.request.goal);
    setRiskPreference(draft.request.riskPreference ?? "balanced");
    setBrokerExecution(Boolean(draft.request.brokerExecution));
    setAllowDirectExecution(Boolean(draft.request.allowDirectExecution));
    setSelectedActions([...(draft.request.preferredActions || [])]);
    setConstraints((draft.request.constraints || []).join("\n") || DEFAULT_AI_CONSTRAINTS);
    setSelectedProvider(String(draft.request.model?.provider || selectedProvider));
    setSelectedModel(String(draft.request.model?.model || selectedModel));
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
        lastMessage: [...draft.messages].reverse().find((message) => message.role === "user")?.content,
      };
      return [summary, ...current.filter((entry) => entry.draftId !== draft.draftId)];
    });
  };

  useEffect(() => {
    if (!activeDraft || !activeVersionId) return;

    const selectedSetupState = getVersionSetupState(activeDraft, activeVersionId);
    const selectedVersion = activeDraft.workflowVersions.find((version) => version.id === activeVersionId);
    if (!selectedVersion) return;

    const nextSetupState = { workflowName, metadataOverrides };
    const existing = {
      workflowName: selectedSetupState?.workflowName || selectedVersion.response.plan.workflowName || "",
      metadataOverrides: selectedSetupState?.metadataOverrides || {},
    };

    if (JSON.stringify(nextSetupState) === JSON.stringify(existing)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void apiSaveAiStrategyDraftSetup(activeDraft.draftId, nextSetupState, activeVersionId)
        .then((draft) => setActiveDraft(draft))
        .catch(() => {});
    }, 350);

    return () => window.clearTimeout(timer);
  }, [activeDraft, activeVersionId, workflowName, metadataOverrides]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [activeDraft?.messages.length, pendingMessages.length, loading]);

  const visibleMessages = useMemo(
    () => [...(activeDraft?.messages || []), ...pendingMessages],
    [activeDraft?.messages, pendingMessages],
  );

  const hasGeneratedWorkflow = (activeDraft?.workflowVersions.length || 0) > 0;
  const isRightPreviewVisible = hasGeneratedWorkflow && showRightSidebar;

  const selectedVersion = useMemo(() => {
    if (!activeDraft?.workflowVersions.length) return null;
    return (
      activeDraft.workflowVersions.find((version) => version.id === activeVersionId) ||
      activeDraft.workflowVersions[activeDraft.workflowVersions.length - 1]
    );
  }, [activeDraft?.workflowVersions, activeVersionId]);

  useEffect(() => {
    if (!activeDraft || !activeVersionId) return;

    let cancelled = false;

    void apiGetAiStrategyDraftVersion(activeDraft.draftId, activeVersionId)
      .then((payload) => {
        if (cancelled) return;

        setWorkflowName(payload.setupState?.workflowName || payload.version.response.plan.workflowName);
        setMetadataOverrides(payload.setupState?.metadataOverrides || {});
      })
      .catch(() => {
        if (cancelled) return;

        const fallbackVersion =
          activeDraft.workflowVersions.find((version) => version.id === activeVersionId) ||
          activeDraft.workflowVersions[activeDraft.workflowVersions.length - 1];

        if (!fallbackVersion) return;

        const fallbackSetupState = getVersionSetupState(activeDraft, fallbackVersion.id);
        setWorkflowName(fallbackSetupState?.workflowName || fallbackVersion.response.plan.workflowName);
        setMetadataOverrides(fallbackSetupState?.metadataOverrides || {});
      });

    return () => {
      cancelled = true;
    };
  }, [activeDraft, activeVersionId]);

  const handleNewChat = () => {
    setActiveDraft(null);
    setComposer("");
    setPendingMessages([]);
    setAnimatedMessageId(null);
    setWorkflowName("");
    setMetadataOverrides({});
    setActiveVersionId("");
    setError(null);
    window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
  };

  const handleLoadDraft = async (draftId: string) => {
    setLoading(true);
    try {
      const draft = await apiGetAiStrategyDraft(draftId);
      setPendingMessages([]);
      setAnimatedMessageId(null);
      syncActiveDraft(draft);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        if (window.localStorage.getItem(LAST_CHAT_DRAFT_STORAGE_KEY) === draftId) {
          window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
        }
        setDraftSummaries((current) => current.filter((entry) => entry.draftId !== draftId));
        handleNewChat();
        return;
      }

      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load AI conversation.");
    } finally {
      setLoading(false);
    }
  };

  const performDeleteDraft = async (draftId: string) => {
    if (!draftId) return;

    try {
      await apiDeleteAiStrategyDraft(draftId);

      const nextSummaries = draftSummaries.filter((entry) => entry.draftId !== draftId);
      setDraftSummaries(nextSummaries);

      const wasActive = activeDraft?.draftId === draftId;
      if (wasActive) {
        const nextDraftId = nextSummaries[0]?.draftId;
        if (nextDraftId) {
          await handleLoadDraft(nextDraftId);
        } else {
          handleNewChat();
        }
      }

      if (window.localStorage.getItem(LAST_CHAT_DRAFT_STORAGE_KEY) === draftId) {
        window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
      }

      toast.success("Conversation deleted");
    } catch (e: any) {
      const message = e?.response?.data?.message ?? e?.message ?? "Failed to delete conversation.";
      toast.error(message);
    } finally {
      setPendingDeleteDraftId(null);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    setPendingDeleteDraftId(draftId);
  };

  const handleRenameDraft = async (draftId: string, nextTitleRaw: string) => {
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
      const message = e?.response?.data?.message ?? e?.message ?? "Failed to rename conversation.";
      toast.error(message);
      throw e;
    }
  };

  const handleSend = async () => {
    if (composer.trim().length < 4 || !selectedModel) return;

    const messageText = composer.trim();
    const now = new Date().toISOString();
    const optimisticUserMessage: AiStrategyConversationMessage & { pending?: boolean } = {
      id: `pending_user_${Date.now()}`,
      role: "user",
      kind: activeDraft ? "edit" : "prompt",
      content: messageText,
      createdAt: now,
      pending: true,
    };
    const optimisticAssistantMessage: AiStrategyConversationMessage & {
      pending?: boolean;
      typing?: boolean;
    } = {
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
          [...draft.messages].reverse().find((message) => message.role === "assistant" && message.kind === "result")
            ?.id || null,
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
          [...draft.messages].reverse().find((message) => message.role === "assistant" && message.kind === "result")
            ?.id || null,
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
  };

  const openInBuilder = () => {
    if (!selectedVersion) return;

    navigate("/create/builder", {
      state: {
        generatedPlan: {
          workflowName: workflowName || selectedVersion.response.plan.workflowName,
          marketType: selectedVersion.response.plan.marketType,
          nodes: normalizeGeneratedNodes(selectedVersion.response.plan, metadataOverrides),
          edges: selectedVersion.response.plan.edges,
        },
      },
    });
  };

  const shell = theme === "dark" ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-neutral-900";
  const panel = theme === "dark" ? "border-neutral-800 bg-[#0a0a0a]" : "border-neutral-200 bg-white";
  const border = theme === "dark" ? "border-neutral-800" : "border-neutral-200";
  const muted = theme === "dark" ? "text-neutral-400" : "text-neutral-500";
  const heading = theme === "dark" ? "text-neutral-100" : "text-neutral-900";
  const inputClass =
    theme === "dark"
      ? "border-neutral-800 bg-black text-neutral-100 placeholder:text-neutral-500"
      : "border-neutral-200 bg-[#f8f9fc] text-neutral-800 placeholder:text-neutral-400";

  return (
    <div className={cx("h-screen overflow-hidden transition-colors", shell)}>
      <div className="grid h-full grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
        <LeftSidebar
          theme={theme}
          panel={panel}
          border={border}
          muted={muted}
          inputClass={inputClass}
          search={search}
          onSearchChange={setSearch}
          filteredDrafts={filteredDrafts}
          activeDraftId={activeDraft?.draftId}
          onLoadDraft={handleLoadDraft}
          onRenameDraft={handleRenameDraft}
          onDeleteDraft={handleDeleteDraft}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          onNewChat={handleNewChat}
        />

        <div className="flex h-full min-h-0 min-w-0">
          <main className={cx("flex-1 grid h-full min-h-0 min-w-0 overflow-hidden grid-rows-[auto_minmax(0,1fr)_auto]", border)}>
            <ChatTopHeader
              border={border}
              muted={muted}
              heading={heading}
              theme={theme}
              compact={isRightPreviewVisible}
              title={activeDraft?.title || "New workflow conversation"}
              canOpenBuilder={Boolean(selectedVersion)}
              canTogglePreview={hasGeneratedWorkflow}
              showPreview={showRightSidebar}
              onTogglePreview={() => setShowRightSidebar((current) => !current)}
              onGoHome={() => navigate("/create/onboarding")}
              onOpenSetup={() => setSetupOpen(true)}
            />

            <ChatMessagesPane
              chatScrollRef={chatScrollRef}
              loading={loading}
              activeDraft={activeDraft}
              messages={visibleMessages}
              animatedMessageId={animatedMessageId}
              workflowVersions={activeDraft?.workflowVersions || []}
              metadataOverrides={metadataOverrides}
              onMetadataOverridesChange={setMetadataOverrides}
              panel={panel}
              muted={muted}
              theme={theme}
              compact={isRightPreviewVisible}
              onExampleClick={(example) => setComposer(example)}
            />

            <ChatComposerSection
              border={border}
              muted={muted}
              theme={theme}
              compact={isRightPreviewVisible}
              market={market}
              onMarketChange={setMarket}
              goal={goal}
              onGoalChange={setGoal}
              riskPreference={riskPreference}
              onRiskPreferenceChange={setRiskPreference}
              brokerExecution={brokerExecution}
              onBrokerExecutionChange={setBrokerExecution}
              allowDirectExecution={allowDirectExecution}
              onAllowDirectExecutionChange={setAllowDirectExecution}
              selectedActions={selectedActions}
              onToggleAction={(action) =>
                setSelectedActions((current) =>
                  current.includes(action)
                    ? current.filter((entry) => entry !== action)
                    : [...current, action],
                )
              }
              models={models}
              selectedProvider={selectedProvider}
              onSelectedProviderChange={setSelectedProvider}
              selectedModel={selectedModel}
              onSelectedModelChange={setSelectedModel}
              composer={composer}
              onComposerChange={setComposer}
              onSend={handleSend}
              sending={sending}
              canSend={composer.trim().length >= 4 && Boolean(selectedModel)}
              error={error}
            />
          </main>

          <AnimatePresence initial={false}>
            {isRightPreviewVisible ? (
              <motion.div
                key="workflow-preview-sidebar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22 }}
                className={cx("hidden h-full min-h-0 w-95 shrink-0 overflow-hidden border-l xl:block", border)}
              >
                <RightSidebar
                  panel={panel}
                  border={border}
                  muted={muted}
                  heading={heading}
                  theme={theme}
                  selectedVersion={selectedVersion}
                  activeDraft={activeDraft}
                  activeVersionId={selectedVersion?.id || activeVersionId}
                  onSelectVersion={setActiveVersionId}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AiPlanSetupDialog
        open={setupOpen}
        result={selectedVersion?.response || null}
        workflowName={workflowName}
        metadataOverrides={metadataOverrides}
        onOpenChange={setSetupOpen}
        onWorkflowNameChange={setWorkflowName}
        onMetadataOverridesChange={setMetadataOverrides}
        onContinue={openInBuilder}
      />

      <Dialog open={Boolean(pendingDeleteDraftId)} onOpenChange={(open) => !open && setPendingDeleteDraftId(null)}>
        <DialogContent className="max-w-md border-neutral-800 bg-neutral-950 text-neutral-100">
          <DialogHeader>
            <DialogTitle className="text-base">Delete conversation?</DialogTitle>
            <DialogDescription className="text-neutral-400">
              This will permanently delete the selected AI-builder chat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-neutral-700 bg-neutral-900 text-neutral-200 cursor-pointer"
              onClick={() => setPendingDeleteDraftId(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-500 cursor-pointer"
              onClick={() => void performDeleteDraft(pendingDeleteDraftId || "")}
            >
              Delete chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AiStrategyChatBuilder;
