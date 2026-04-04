import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { AiPlanSetupDialog } from "@/components/ai-builder/AiPlanSetupDialog";
import { cx, type LocalTheme } from "@/components/ai-builder/chat/shared";
import { LeftSidebar } from "@/components/ai-builder/chat/LeftSidebar";
import { ChatTopHeader } from "@/components/ai-builder/chat/ChatTopHeader";
import { ChatMessagesPane } from "@/components/ai-builder/chat/ChatMessagesPane";
import { ChatComposerSection } from "@/components/ai-builder/chat/ChatComposerSection";
import { RightSidebar } from "@/components/ai-builder/chat/RightSidebar";
import { useAiChatComposer } from "@/components/ai-builder/chat/useAiChatComposer";
import { useAiChatDrafts } from "@/components/ai-builder/chat/useAiChatDrafts";
import { useAiDraftRestore } from "@/components/ai-builder/chat/useAiDraftRestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AiStrategyChatBuilder() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<LocalTheme>("dark");
  const [search, setSearch] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const drafts = useAiChatDrafts();

  const composerState = useAiChatComposer({
    activeDraft: drafts.activeDraft,
    market: drafts.market,
    goal: drafts.goal,
    riskPreference: drafts.riskPreference,
    brokerExecution: drafts.brokerExecution,
    allowDirectExecution: drafts.allowDirectExecution,
    selectedActions: drafts.selectedActions,
    constraints: drafts.constraints,
    selectedProvider: drafts.selectedProvider,
    selectedModel: drafts.selectedModel,
    syncActiveDraft: drafts.syncActiveDraft,
    setError: drafts.setError,
  });

  useAiDraftRestore({
    models: drafts.models,
    selectedProvider: drafts.selectedProvider,
    selectedModel: drafts.selectedModel,
    setModels: drafts.setModels,
    setSelectedProvider: drafts.setSelectedProvider,
    setSelectedModel: drafts.setSelectedModel,
    setDraftSummaries: drafts.setDraftSummaries,
    setError: drafts.setError,
    setLoading: drafts.setLoading,
    syncActiveDraft: drafts.syncActiveDraft,
    activeDraft: drafts.activeDraft,
    activeVersionId: drafts.activeVersionId,
    workflowName: drafts.workflowName,
    metadataOverrides: drafts.metadataOverrides,
    setWorkflowName: drafts.setWorkflowName,
    setMetadataOverrides: drafts.setMetadataOverrides,
    setActiveDraft: drafts.setActiveDraft,
  });

  const filteredDrafts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return drafts.draftSummaries;
    return drafts.draftSummaries.filter((draft) =>
      `${draft.title} ${draft.lastMessage || ""}`.toLowerCase().includes(query),
    );
  }, [drafts.draftSummaries, search]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [
    drafts.activeDraft?.messages.length,
    composerState.pendingMessages.length,
    drafts.loading,
  ]);

  const hasGeneratedWorkflow = (drafts.activeDraft?.workflowVersions.length || 0) > 0;
  const isRightPreviewVisible = hasGeneratedWorkflow && drafts.showRightSidebar;

  const selectedVersion = useMemo(() => {
    if (!drafts.activeDraft?.workflowVersions.length) return null;
    return (
      drafts.activeDraft.workflowVersions.find(
        (version) => version.id === drafts.activeVersionId,
      ) ||
      drafts.activeDraft.workflowVersions[
        drafts.activeDraft.workflowVersions.length - 1
      ]
    );
  }, [drafts.activeDraft?.workflowVersions, drafts.activeVersionId]);

  const handleNewChat = () => {
    drafts.handleNewChat(composerState.resetConversationUi);
  };

  const handleLoadDraft = async (draftId: string) => {
    await drafts.handleLoadDraft(draftId, composerState.resetConversationUi);
  };

  const performDeleteDraft = async (draftId: string) => {
    await drafts.performDeleteDraft(draftId, composerState.resetConversationUi);
  };

  const openInBuilder = () => {
    if (!selectedVersion) return;

    navigate("/create/builder", {
      state: {
        generatedPlan: {
          workflowName:
            drafts.workflowName || selectedVersion.response.plan.workflowName,
          marketType: selectedVersion.response.plan.marketType,
          nodes: normalizeGeneratedNodes(
            selectedVersion.response.plan,
            drafts.metadataOverrides,
          ),
          edges: selectedVersion.response.plan.edges,
        },
      },
    });
  };

  const shell =
    theme === "dark" ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-neutral-900";
  const panel =
    theme === "dark"
      ? "border-neutral-800 bg-[#0a0a0a]"
      : "border-neutral-200 bg-white";
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
          activeDraftId={drafts.activeDraft?.draftId}
          onLoadDraft={handleLoadDraft}
          onRenameDraft={drafts.handleRenameDraft}
          onDeleteDraft={drafts.handleDeleteDraft}
          onToggleTheme={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
          onNewChat={handleNewChat}
        />

        <div className="flex h-full min-h-0 min-w-0">
          <main
            className={cx(
              "flex-1 grid h-full min-h-0 min-w-0 overflow-hidden grid-rows-[auto_minmax(0,1fr)_auto]",
              border,
            )}
          >
            <ChatTopHeader
              border={border}
              muted={muted}
              heading={heading}
              theme={theme}
              compact={isRightPreviewVisible}
              title={drafts.activeDraft?.title || "New workflow conversation"}
              canOpenBuilder={Boolean(selectedVersion)}
              canTogglePreview={hasGeneratedWorkflow}
              showPreview={drafts.showRightSidebar}
              onTogglePreview={() =>
                drafts.setShowRightSidebar((current) => !current)
              }
              onGoHome={() => navigate("/create/onboarding")}
              onOpenSetup={() => setSetupOpen(true)}
            />

            <ChatMessagesPane
              chatScrollRef={chatScrollRef}
              loading={drafts.loading}
              activeDraft={drafts.activeDraft}
              messages={composerState.visibleMessages}
              animatedMessageId={composerState.animatedMessageId}
              workflowVersions={drafts.activeDraft?.workflowVersions || []}
              metadataOverrides={drafts.metadataOverrides}
              onMetadataOverridesChange={drafts.setMetadataOverrides}
              panel={panel}
              muted={muted}
              theme={theme}
              compact={isRightPreviewVisible}
              onExampleClick={(example) => composerState.setComposer(example)}
            />

            <ChatComposerSection
              border={border}
              muted={muted}
              theme={theme}
              compact={isRightPreviewVisible}
              market={drafts.market}
              onMarketChange={drafts.setMarket}
              goal={drafts.goal}
              onGoalChange={drafts.setGoal}
              riskPreference={drafts.riskPreference}
              onRiskPreferenceChange={drafts.setRiskPreference}
              brokerExecution={drafts.brokerExecution}
              onBrokerExecutionChange={drafts.setBrokerExecution}
              allowDirectExecution={drafts.allowDirectExecution}
              onAllowDirectExecutionChange={drafts.setAllowDirectExecution}
              selectedActions={drafts.selectedActions}
              onToggleAction={(action) =>
                drafts.setSelectedActions((current) =>
                  current.includes(action)
                    ? current.filter((entry) => entry !== action)
                    : [...current, action],
                )
              }
              models={drafts.models}
              selectedProvider={drafts.selectedProvider}
              onSelectedProviderChange={drafts.setSelectedProvider}
              selectedModel={drafts.selectedModel}
              onSelectedModelChange={drafts.setSelectedModel}
              composer={composerState.composer}
              onComposerChange={composerState.setComposer}
              onSend={composerState.handleSend}
              sending={composerState.sending}
              canSend={
                composerState.composer.trim().length >= 4 &&
                Boolean(drafts.selectedModel)
              }
              error={drafts.error}
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
                className={cx(
                  "hidden h-full min-h-0 w-95 shrink-0 overflow-hidden border-l xl:block",
                  border,
                )}
              >
                <RightSidebar
                  panel={panel}
                  border={border}
                  muted={muted}
                  heading={heading}
                  theme={theme}
                  selectedVersion={selectedVersion}
                  activeDraft={drafts.activeDraft}
                  activeVersionId={selectedVersion?.id || drafts.activeVersionId}
                  onSelectVersion={drafts.setActiveVersionId}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AiPlanSetupDialog
        open={setupOpen}
        result={selectedVersion?.response || null}
        workflowName={drafts.workflowName}
        metadataOverrides={drafts.metadataOverrides}
        onOpenChange={setSetupOpen}
        onWorkflowNameChange={drafts.setWorkflowName}
        onMetadataOverridesChange={drafts.setMetadataOverrides}
        onContinue={openInBuilder}
      />

      <Dialog
        open={Boolean(drafts.pendingDeleteDraftId)}
        onOpenChange={(open) => !open && drafts.setPendingDeleteDraftId(null)}
      >
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
              onClick={() => drafts.setPendingDeleteDraftId(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-500 cursor-pointer"
              onClick={() => void performDeleteDraft(drafts.pendingDeleteDraftId || "")}
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
