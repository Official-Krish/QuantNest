import { useEffect, useMemo, useRef, useState } from "react";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import type { EdgeType, NodeType } from "@quantnest-trading/types";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Home,
  MessageSquarePlus,
  Moon,
  Search,
  Send,
  Sparkles,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  AiStrategyDraftSession,
  AiStrategyDraftSummary,
  AiStrategyWorkflowVersion,
} from "@/types/api";
import {
  AI_ACTION_OPTIONS,
  AI_ALLOWED_NODE_TYPES,
  DEFAULT_AI_CONSTRAINTS,
} from "@/components/ai-builder/constants";
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { aiPreviewNodeTypes } from "@/components/ai-builder/previewNodeTypes";
import { AiPlanSetupDialog } from "@/components/ai-builder/AiPlanSetupDialog";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";

const LAST_CHAT_DRAFT_STORAGE_KEY = "ai-builder-chat-last-draft-id";

function toRequestPayload(input: {
  prompt: string;
  market: AiStrategyBuilderRequest["market"];
  goal: AiStrategyBuilderRequest["goal"];
  riskPreference: AiStrategyBuilderRequest["riskPreference"];
  brokerExecution: boolean;
  allowDirectExecution: boolean;
  selectedActions: string[];
  constraints: string;
  selectedProvider: string;
  selectedModel: string;
}): AiStrategyBuilderRequest {
  return {
    prompt: input.prompt.trim(),
    market: input.market,
    goal: input.goal,
    riskPreference: input.riskPreference,
    brokerExecution: input.brokerExecution,
    allowDirectExecution: input.allowDirectExecution,
    preferredActions: input.selectedActions as AiStrategyBuilderRequest["preferredActions"],
    constraints: input.constraints
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean),
    model: {
      provider: input.selectedProvider,
      model: input.selectedModel,
    },
    allowedNodeTypes: AI_ALLOWED_NODE_TYPES,
  };
}

function buildPreviewLayout(nodes: NodeType[], edges: EdgeType[]) {
  const incomingCount = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const node of nodes) {
    incomingCount.set(node.nodeId, 0);
    children.set(node.nodeId, []);
  }

  for (const edge of edges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    children.set(edge.source, [...(children.get(edge.source) || []), edge.target]);
  }

  const queue = nodes
    .filter((node) => (incomingCount.get(node.nodeId) || 0) === 0)
    .map((node) => node.nodeId);
  const levels = new Map<string, number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;
    for (const child of children.get(current) || []) {
      levels.set(child, Math.max(levels.get(child) || 0, currentLevel + 1));
      incomingCount.set(child, (incomingCount.get(child) || 1) - 1);
      if ((incomingCount.get(child) || 0) === 0) queue.push(child);
    }
  }

  const lanes = new Map<number, string[]>();
  for (const node of nodes) {
    const level = levels.get(node.nodeId) || 0;
    lanes.set(level, [...(lanes.get(level) || []), node.nodeId]);
  }

  const positioned = new Map<string, { x: number; y: number }>();
  for (const [level, laneNodes] of [...lanes.entries()].sort((a, b) => a[0] - b[0])) {
    laneNodes.forEach((nodeId, index) => {
      positioned.set(nodeId, {
        x: level * 240,
        y: index * 120 - ((laneNodes.length - 1) * 120) / 2,
      });
    });
  }

  return nodes.map((node) => ({
    ...node,
    position: positioned.get(node.nodeId) || node.position,
  }));
}

type LocalTheme = "dark" | "light";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SessionRow({
  item,
  active,
  theme,
  onClick,
}: {
  item: AiStrategyDraftSummary;
  active: boolean;
  theme: LocalTheme;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-xl border px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5",
        theme === "dark"
          ? active
            ? "border-[#f17463]/50 bg-[#f17463]/8"
            : "border-neutral-800 bg-black hover:border-neutral-700"
          : active
            ? "border-[#f17463]/40 bg-[#fff3ee]"
            : "border-neutral-200 bg-white hover:border-neutral-300",
      )}
    >
      <div className={cx("line-clamp-1 text-[13px] font-medium", theme === "dark" ? "text-neutral-100" : "text-neutral-800")}>
        {item.title}
      </div>
      <div className={cx("mt-1 line-clamp-1 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
        {item.lastMessage || "Open to continue refining"}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cx(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
            active
              ? "bg-[#f17463]/12 text-[#f17463]"
              : theme === "dark"
                ? "bg-neutral-800 text-neutral-400"
                : "bg-neutral-100 text-neutral-500",
          )}
        >
          {item.status}
        </span>
      </div>
    </button>
  );
}

function ChatBubble({
  role,
  content,
  kind,
  timestamp,
  theme,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  kind: string;
  timestamp: string;
  theme: LocalTheme;
}) {
  const isUser = role === "user";
  return (
    <div className={cx("flex gap-2.5 transition-opacity duration-200", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div
          className={cx(
            "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            theme === "dark" ? "bg-[#f8ede8] text-[#f17463]" : "bg-[#fff1ea] text-[#f17463]",
          )}
        >
          <Sparkles className="h-4 w-4" />
        </div>
      ) : null}
      <div className="max-w-[74%]">
        <div
          className={cx(
            "rounded-3xl px-3.5 py-2.5 text-[13px] leading-6",
            isUser
              ? theme === "dark"
                ? "bg-[#121212] text-white"
                : "bg-[#151515] text-white"
              : kind === "validation"
                ? theme === "dark"
                  ? "border border-amber-500/30 bg-amber-500/8 text-amber-100"
                  : "border border-amber-300 bg-amber-50 text-amber-900"
                : theme === "dark"
                  ? "bg-[#ececec] text-neutral-800"
                  : "bg-[#eef1f5] text-neutral-800",
          )}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        <div className={cx("mt-1 px-1 text-[10px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
          {kind === "validation" ? "Validation" : role === "user" ? "You" : "QuantNest AI"} ·{" "}
          {new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
      {isUser ? (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[10px] font-semibold text-white">
          Y
        </div>
      ) : null}
    </div>
  );
}

function SmallPill({
  label,
  active = false,
  theme,
}: {
  label: string;
  active?: boolean;
  theme: LocalTheme;
}) {
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 text-[10px]",
        active
          ? "bg-[#fff0e9] text-[#f17463]"
          : theme === "dark"
            ? "bg-[#151515] text-neutral-300"
            : "bg-[#eef1f4] text-neutral-600",
      )}
    >
      {label}
    </span>
  );
}

function WorkflowCanvasCard({
  version,
  theme,
}: {
  version: AiStrategyWorkflowVersion | null;
  theme: LocalTheme;
}) {
  const nodes = useMemo(
    () => (version ? (normalizeGeneratedNodes(version.response.plan) as NodeType[]) : []),
    [version],
  );
  const edges = useMemo(() => (version ? (version.response.plan.edges as EdgeType[]) : []), [version]);
  const previewNodes = useMemo(() => buildPreviewLayout(nodes, edges), [edges, nodes]);

  if (!version) return null;

  return (
    <div
      className={cx(
        "rounded-2xl border p-3.5",
        theme === "dark" ? "border-neutral-800 bg-black" : "border-neutral-200 bg-white",
      )}
    >
      <div className={cx("mb-2 text-[11px] font-medium uppercase tracking-[0.18em]", theme === "dark" ? "text-neutral-400" : "text-neutral-500")}>
        Workflow Preview
      </div>
      <div
        className={cx(
          "h-37 overflow-hidden rounded-2xl border",
          theme === "dark" ? "border-neutral-800 bg-[#121212]" : "border-neutral-200 bg-[#f5f7fa]",
        )}
      >
        <ReactFlow
          nodeTypes={aiPreviewNodeTypes as any}
          nodes={previewNodes.map((node) => ({ ...node, id: node.nodeId }))}
          edges={edges}
          fitView
          minZoom={0.38}
          maxZoom={1.4}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            gap={18}
            size={1.2}
            color={theme === "dark" ? "#2c2c2c" : "#d8dde7"}
            variant={BackgroundVariant.Dots}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function AiStrategyChatBuilder() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<LocalTheme>("dark");
  const [showSetup, setShowSetup] = useState(false);
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<AiModelDescriptor[]>([]);
  const [draftSummaries, setDraftSummaries] = useState<AiStrategyDraftSummary[]>([]);
  const [activeDraft, setActiveDraft] = useState<AiStrategyDraftSession | null>(null);
  const [activeVersionId, setActiveVersionId] = useState("");
  const [composer, setComposer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
    setActiveVersionId(draft.workflowVersions[draft.workflowVersions.length - 1]?.id || "");
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
  }, [activeDraft?.messages.length, loading]);

  const selectedVersion =
    activeDraft?.workflowVersions.find((version) => version.id === activeVersionId) ||
    activeDraft?.workflowVersions[activeDraft.workflowVersions.length - 1] ||
    null;

  const handleNewChat = () => {
    setActiveDraft(null);
    setActiveVersionId("");
    setComposer("");
    setWorkflowName("");
    setMetadataOverrides({});
    setError(null);
    window.localStorage.removeItem(LAST_CHAT_DRAFT_STORAGE_KEY);
  };

  const handleLoadDraft = async (draftId: string) => {
    setLoading(true);
    try {
      const draft = await apiGetAiStrategyDraft(draftId);
      syncActiveDraft(draft);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load AI conversation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (composer.trim().length < 4 || !selectedModel) return;

    setSending(true);
    setError(null);
    try {
      if (!activeDraft) {
        const draft = await apiCreateAiStrategyDraft(
          toRequestPayload({
            prompt: composer,
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
      } else {
        const draft = await apiEditAiStrategyDraft(activeDraft.draftId, {
          instruction: composer,
          model: {
            provider: selectedProvider,
            model: selectedModel,
          },
        });
        syncActiveDraft(draft);
      }
      setComposer("");
    } catch (e: any) {
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
      <div className="grid h-full grid-cols-1 xl:grid-cols-[270px_minmax(0,1fr)_310px]">
        <aside className={cx("flex h-full min-h-0 flex-col border-r", panel)}>
          <div className={cx("flex items-center justify-between border-b px-3.5 py-2.5", border)}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/onboarding")}
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-xl border cursor-pointer",
                  theme === "dark" ? "border-neutral-700 bg-[#111111] text-neutral-300" : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                <Home className="h-4 w-4" />
              </button>
              <div>
                <div className={cx("text-[10px] uppercase tracking-[0.18em]", muted)}>Conversations</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-xl border cursor-pointer",
                  theme === "dark" ? "border-neutral-700 bg-[#111111] text-neutral-300" : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleNewChat}
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-xl border cursor-pointer",
                  theme === "dark" ? "border-neutral-700 bg-[#111111] text-neutral-300" : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-3.5 py-2.5">
            <div className={cx("flex items-center gap-2 rounded-xl border px-3 py-1.5", inputClass)}>
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 pb-3.5">
            {filteredDrafts.map((item) => (
              <SessionRow
                key={item.draftId}
                item={item}
                active={activeDraft?.draftId === item.draftId}
                theme={theme}
                onClick={() => handleLoadDraft(item.draftId)}
              />
            ))}
          </div>
        </aside>

        <main className={cx("flex h-full min-h-0 flex-col border-r", border)}>
          <div className={cx("border-b px-4 py-2.5", border)}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={cx("flex items-center gap-2 text-[13px] font-medium", heading)}>
                  <Sparkles className="h-4 w-4 text-[#f17463]" />
                  {activeDraft?.title || "New workflow conversation"}
                </div>
                <div className={cx("mt-0.5 text-[11px]", muted)}>AI Strategy Builder</div>
              </div>

              <Button
                onClick={() => setSetupOpen(true)}
                disabled={!selectedVersion}
                className="h-9 rounded-2xl bg-black px-4 text-[13px] text-white hover:bg-[#111111] cursor-pointer"
              >
                Open in Builder
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={cx("border-b px-4 py-2", border)}>
            <div className="flex flex-wrap items-center gap-2">
              <SmallPill label={market} theme={theme} active />
              <SmallPill label={goal.charAt(0).toUpperCase() + goal.slice(1)} theme={theme} />
              <SmallPill
                label={riskPreference ? riskPreference.charAt(0).toUpperCase() + riskPreference.slice(1) : "Balanced"}
                theme={theme}
              />
              <SmallPill label={providerModels.find((model) => model.id === selectedModel)?.label || selectedModel || "Model"} theme={theme} />
              {selectedActions.slice(0, 4).map((action) => (
                <SmallPill key={action} label={action} theme={theme} />
              ))}
            </div>
          </div>

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

          <div className={cx("border-t px-4 py-2.5", border)}>
            <div className="mx-auto max-w-215">
              <button
                type="button"
                onClick={() => setShowSetup((current) => !current)}
                className={cx("mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors", muted)}
              >
                {showSetup ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showSetup ? "Hide options" : "Show options"}
              </button>

              <div
                className={cx(
                  "overflow-hidden transition-all duration-300 ease-out",
                  showSetup ? "mb-3 max-h-96 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className={cx("rounded-2xl border p-2.5", panel)}>
                  <div className="grid gap-3 lg:grid-cols-4">
                    <select value={market} onChange={(e) => setMarket(e.target.value as any)} className={cx("rounded-xl border px-3 py-2 text-sm outline-none", inputClass)}>
                      <option value="Indian">Indian</option>
                      <option value="Crypto">Crypto</option>
                    </select>
                    <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className={cx("rounded-xl border px-3 py-2 text-sm outline-none", inputClass)}>
                      <option value="alerts">Alerts</option>
                      <option value="execution">Execution</option>
                      <option value="reporting">Reporting</option>
                      <option value="journaling">Journaling</option>
                    </select>
                    <select value={riskPreference || "balanced"} onChange={(e) => setRiskPreference(e.target.value as any)} className={cx("rounded-xl border px-3 py-2 text-sm outline-none", inputClass)}>
                      <option value="conservative">Conservative</option>
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                    <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} className={cx("rounded-xl border px-3 py-2 text-sm outline-none", inputClass)}>
                      {[...new Set(models.map((entry) => String(entry.provider)))].map((provider) => (
                        <option key={provider} value={provider}>{provider}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className={cx("rounded-xl border px-3 py-2 text-sm outline-none", inputClass)}>
                      {providerModels.map((model) => (
                        <option key={model.id} value={model.id}>{model.label}</option>
                      ))}
                    </select>
                    <label className={cx("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", inputClass)}>
                      <input type="checkbox" checked={brokerExecution} onChange={(e) => setBrokerExecution(e.target.checked)} />
                      Broker execution
                    </label>
                    <label className={cx("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", inputClass)}>
                      <input type="checkbox" checked={allowDirectExecution} onChange={(e) => setAllowDirectExecution(e.target.checked)} />
                      Direct execution
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {AI_ACTION_OPTIONS.map((action) => {
                      const active = selectedActions.includes(action);
                      return (
                        <button
                          key={action}
                          type="button"
                          onClick={() =>
                            setSelectedActions((current) =>
                              active ? current.filter((entry) => entry !== action) : [...current, action],
                            )
                          }
                          className={cx(
                            "rounded-full px-2.5 py-1 text-[11px]",
                            active
                              ? "bg-[#fff0e9] text-[#f17463]"
                              : theme === "dark"
                                ? "bg-[#151515] text-neutral-300"
                                : "bg-[#eef1f4] text-neutral-600",
                          )}
                        >
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={cx("rounded-3xl border px-4 py-2.5", theme === "dark" ? "border-neutral-800 bg-black" : "border-neutral-200 bg-white")}>
                <div className="flex items-end gap-3">
                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Refine this workflow..."
                    className={cx(
                      "min-h-14 flex-1 resize-none bg-transparent text-[13px] leading-6 outline-none",
                      theme === "dark" ? "text-neutral-100 placeholder:text-neutral-500" : "text-neutral-800 placeholder:text-neutral-400",
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || composer.trim().length < 4 || !selectedModel}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f17463] text-white transition duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className={cx("mt-2 text-[11px]", muted)}>Enter to send · Shift+Enter for newline</div>
              {error ? <div className="mt-2 text-xs text-red-400">{error}</div> : null}
            </div>
          </div>
        </main>

        <aside className={cx("h-full overflow-y-auto", panel)}>
          <div className="space-y-0">
            {selectedVersion ? (
              <div className={cx("border-b px-4 py-4", border)}>
                <WorkflowCanvasCard version={selectedVersion} theme={theme} />
              </div>
            ) : null}

            <div className={cx("border-b px-4 py-4", border)}>
              <div className={cx("mb-4 text-xs font-medium uppercase tracking-[0.18em]", muted)}>Version History</div>
              <div className="space-y-3">
                {activeDraft?.workflowVersions.length ? (
                  activeDraft.workflowVersions.map((version, index) => {
                    const isActive = version.id === selectedVersion?.id;
                    return (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => setActiveVersionId(version.id)}
                        className={cx(
                          "w-full rounded-2xl border px-4 py-4 text-left transition",
                          isActive
                            ? theme === "dark"
                              ? "border-[#f17463]/50 bg-[#f17463]/8"
                              : "border-[#f17463]/40 bg-[#fff3ee]"
                            : theme === "dark"
                              ? "border-neutral-800 bg-[#0f0f0f] hover:border-neutral-700"
                              : "border-neutral-200 bg-white hover:border-neutral-300",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={cx("text-sm font-medium", isActive ? "text-[#f17463]" : heading)}>
                              {index === 0 ? "Initial Generation" : version.label}
                            </div>
                            <div className={cx("mt-1 text-xs", muted)}>{version.response.plan.workflowName}</div>
                          </div>
                          <div className={cx("rounded-full px-2 py-0.5 text-[10px]", theme === "dark" ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-500")}>
                            v{index + 1}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SmallPill label={version.response.plan.marketType} theme={theme} />
                          <SmallPill label={`${version.response.plan.nodes.length}`} theme={theme} />
                          <SmallPill label={`${version.response.validation.branchCount} branches`} theme={theme} />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className={cx("rounded-2xl border px-4 py-4 text-sm", panel)}>Generated workflow versions will appear here.</div>
                )}
              </div>
            </div>

            <div className="px-4 py-4">
              <div className={cx("mb-4 text-xs font-medium uppercase tracking-[0.18em]", muted)}>Context</div>
              <div className={cx("rounded-2xl border p-4 text-sm leading-7", panel)}>
                <div><span className={muted}>Prompt:</span> {selectedVersion?.prompt || "No prompt selected."}</div>
                {selectedVersion?.instruction ? (
                  <div className="mt-3"><span className={muted}>Edit:</span> {selectedVersion.instruction}</div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
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
