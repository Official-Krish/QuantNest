import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  apiCreateAiStrategyDraft,
  apiEditAiStrategyDraft,
  apiGetAiModels,
  apiGetAiStrategyDraft,
  apiListAiStrategyDrafts,
  apiSaveAiStrategyDraftSetup,
} from "@/http";
import type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyConversationMessage,
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
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
        const draftToLoad = lastDraftId || drafts[0]?.draftId;
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
    setActiveDraft(draft);
    setWorkflowName(draft.setupState?.workflowName || draft.response.plan.workflowName);
    setMetadataOverrides(draft.setupState?.metadataOverrides || {});
    setMarket(draft.request.market);
    setGoal(draft.request.goal);
    setRiskPreference(draft.request.riskPreference ?? "balanced");
    setBrokerExecution(Boolean(draft.request.brokerExecution));
    setAllowDirectExecution(Boolean(draft.request.allowDirectExecution));
    setSelectedActions([...(draft.request.preferredActions || [])]);
    setConstraints((draft.request.constraints || []).join("\n") || DEFAULT_AI_CONSTRAINTS);
    setSelectedProvider(String(draft.request.model?.provider || selectedProvider));
    setSelectedModel(String(draft.request.model?.model || selectedModel));
    setActiveVersionId(draft.workflowVersions[draft.workflowVersions.length - 1]?.id || "");
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
    if (!activeDraft) return;

    const nextSetupState = { workflowName, metadataOverrides };
    const existing = {
      workflowName: activeDraft.setupState?.workflowName || "",
      metadataOverrides: activeDraft.setupState?.metadataOverrides || {},
    };

    if (JSON.stringify(nextSetupState) === JSON.stringify(existing)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void apiSaveAiStrategyDraftSetup(activeDraft.draftId, nextSetupState)
        .then((draft) => setActiveDraft(draft))
        .catch(() => {});
    }, 350);

    return () => window.clearTimeout(timer);
  }, [activeDraft, workflowName, metadataOverrides]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [activeDraft?.messages.length, pendingMessages.length, loading]);

  const visibleMessages = useMemo(
    () => [...(activeDraft?.messages || []), ...pendingMessages],
    [activeDraft?.messages, pendingMessages],
  );

  const hasGeneratedWorkflow = (activeDraft?.workflowVersions.length || 0) > 0;

  const selectedVersion = useMemo(() => {
    if (!activeDraft?.workflowVersions.length) return null;
    return (
      activeDraft.workflowVersions.find((version) => version.id === activeVersionId) ||
      activeDraft.workflowVersions[activeDraft.workflowVersions.length - 1]
    );
  }, [activeDraft?.workflowVersions, activeVersionId]);

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
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load AI conversation.");
    } finally {
      setLoading(false);
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
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          onNewChat={handleNewChat}
        />

        <div
          className={cx(
            "grid h-full min-h-0",
            hasGeneratedWorkflow && showRightSidebar
              ? "xl:grid-cols-[minmax(0,1fr)_380px]"
              : "grid-cols-1",
          )}
        >
          <main className={cx("grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]", border)}>
            <ChatTopHeader
              border={border}
              muted={muted}
              heading={heading}
              theme={theme}
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
              onExampleClick={(example) => setComposer(example)}
            />

            <ChatComposerSection
              border={border}
              muted={muted}
              theme={theme}
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
            {hasGeneratedWorkflow && showRightSidebar ? (
              <motion.div
                key="workflow-preview-sidebar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22 }}
                className={cx("hidden h-full border-l xl:block", border)}
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
        result={activeDraft}
        workflowName={workflowName}
        metadataOverrides={metadataOverrides}
        onOpenChange={setSetupOpen}
        onWorkflowNameChange={setWorkflowName}
        onMetadataOverridesChange={setMetadataOverrides}
        onContinue={openInBuilder}
      />
    </div>
  );
}

export default AiStrategyChatBuilder;
