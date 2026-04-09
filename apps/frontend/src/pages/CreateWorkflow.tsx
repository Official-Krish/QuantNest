import { useCallback, useEffect, useMemo, useState } from "react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { type EdgeType, type NodeType } from "@quantnest-trading/types";
import { WorkflowCanvas } from "../components/workflow/WorkflowCanvas";
import { WorkflowNameDialog } from "../components/workflow/WorkflowNameDialog";
import { ImportCodeDialog } from "../components/workflow/ImportCodeDialog";
import { ShareCodeDialog } from "../components/dashboard/ShareCodeDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  apiCreateWorkflow,
  apiGetAiStrategyDraftVersion,
  apiGetWorkflow,
  apiVerifyBrokerCredentials,
  apiUpdateWorkflow,
  apiGenerateShareCode,
} from "@/http";
import { Button } from "@/components/ui/button";
import { OrangeButton } from "@/components/ui/button-orange";
import { Share2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { workflowNodeTypes } from "@/components/workflow/nodeTypes";
import { AppBackground } from "@/components/background";
import type { AiStrategyWorkflowVersion } from "@/types/api";
import { toast } from "sonner";
import {
  buildWorkflowSnapshot,
  collectBrokerVerificationPayloads,
  normalizeWorkflowForBuilder,
} from "@/components/workflow/workflow-builder.utils";

const POSITION_OFFSET = 50;
const MIN_WORKFLOW_NAME_LENGTH = 3;

export const CreateWorkflow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workflowId: routeWorkflowId } = useParams<{ workflowId: string }>();

  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTriggerSheet, setShowTriggerSheet] = useState(false);
  const [showTriggerSheetEdit, setShowTriggerSheetEdit] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [workflowName, setWorkflowName] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<{
    position: { x: number; y: number };
    startingNodeId: string;
    sourceHandle?: string;
  } | null>(null);
  const [showActionSheetEdit, setShowActionSheetEdit] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [marketType, setMarketType] = useState<"Indian" | "Crypto" | null>(null);
  const [executionMode, setExecutionMode] = useState<"live" | "dry-run">("live");
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [aiBuilderContext, setAiBuilderContext] = useState<{
    draftId: string;
    versions: AiStrategyWorkflowVersion[];
  } | null>(null);
  const [activeAiVersionId, setActiveAiVersionId] = useState<string>("");
  const [switchingAiVersion, setSwitchingAiVersion] = useState(false);
  const [nodeMenu, setNodeMenu] = useState<{
    node: NodeType;
    x: number;
    y: number;
  } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [shareCodeDialogOpen, setShareCodeDialogOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [exportingBuilder, setExportingBuilder] = useState(false);

  useEffect(() => {
    if (routeWorkflowId) return;

    const state = (location.state || {}) as {
      generatedPlan?: {
        nodes?: NodeType[];
        edges?: EdgeType[];
        workflowName?: string;
        marketType?: "Indian" | "Crypto";
        executionMode?: "live" | "dry-run";
      };
      aiBuilderContext?: {
        draftId?: string;
        activeVersionId?: string;
        versions?: AiStrategyWorkflowVersion[];
      };
    };

    const generatedPlan = state.generatedPlan;
    if (!generatedPlan) return;

    setNodes((generatedPlan.nodes || []) as NodeType[]);
    setEdges((generatedPlan.edges || []) as EdgeType[]);
    setWorkflowName(String(generatedPlan.workflowName || ""));
    setMarketType((generatedPlan.marketType || "Indian") as "Indian" | "Crypto");
    setExecutionMode((generatedPlan.executionMode || "live") as "live" | "dry-run");

    if (state.aiBuilderContext?.draftId && Array.isArray(state.aiBuilderContext.versions)) {
      setAiBuilderContext({
        draftId: state.aiBuilderContext.draftId,
        versions: state.aiBuilderContext.versions,
      });
      setActiveAiVersionId(
        String(
          state.aiBuilderContext.activeVersionId ||
            state.aiBuilderContext.versions[state.aiBuilderContext.versions.length - 1]?.id ||
            "",
        ),
      );
    }

    setLastSavedSnapshot(null);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, routeWorkflowId]);

  const handleLoadAiVersion = useCallback(
    async (versionId: string) => {
      if (!aiBuilderContext?.draftId || !versionId || versionId === activeAiVersionId) return;

      setSwitchingAiVersion(true);
      setSaveError(null);
      try {
        const payload = await apiGetAiStrategyDraftVersion(aiBuilderContext.draftId, versionId);
        const setupOverrides = payload.setupState?.metadataOverrides || {};
        const normalizedNodes = normalizeGeneratedNodes(payload.version.response.plan, setupOverrides);
        setNodes((normalizedNodes || []) as NodeType[]);
        setEdges((payload.version.response.plan.edges || []) as EdgeType[]);
        setWorkflowName(
          String(
            payload.setupState?.workflowName || payload.version.response.plan.workflowName || "",
          ),
        );
        setMarketType((payload.version.response.plan.marketType || "Indian") as "Indian" | "Crypto");
        setActiveAiVersionId(versionId);
        setLastSavedSnapshot(null);
      } catch (e: any) {
        setSaveError(e?.response?.data?.message ?? e?.message ?? "Failed to load AI version");
      } finally {
        setSwitchingAiVersion(false);
      }
    },
    [activeAiVersionId, aiBuilderContext?.draftId],
  );

  // Load an existing workflow when opened from /workflow/:workflowId
  useEffect(() => {
    if (!routeWorkflowId) return;

    setAiBuilderContext(null);
    setActiveAiVersionId("");

    const load = async () => {
      setLoading(true);
      setSaveError(null);
      try {
        const workflow = await apiGetWorkflow(routeWorkflowId);
        const normalizedWorkflow = normalizeWorkflowForBuilder(workflow as any);
        setNodes(normalizedWorkflow.nodes);
        setEdges(normalizedWorkflow.edges);
        setWorkflowId(normalizedWorkflow.workflowId);
        setWorkflowName(normalizedWorkflow.workflowName);
        setMarketType(normalizedWorkflow.marketType);
        setLastSavedSnapshot(
          buildWorkflowSnapshot({
            workflowName: normalizedWorkflow.workflowName,
            nodes: normalizedWorkflow.nodes,
            edges: normalizedWorkflow.edges,
            executionMode: normalizedWorkflow.executionMode,
          }),
        );
        setExecutionMode((normalizedWorkflow.executionMode || "live") as "live" | "dry-run");
      } catch (e: any) {
        setSaveError(
          e?.response?.data?.message ??
            e?.message ??
            "Failed to load workflow",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [routeWorkflowId]);

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) =>
        applyNodeChanges(
          changes,
          nodesSnapshot.map((node) => ({ ...node, id: node.nodeId }))
        )
      ),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  // Custom onConnect to capture handleId (true/false) for conditional branching
  const onConnect = useCallback(
    (params: any) => {
      const edgeId = `e${params.source}-${params.sourceHandle || "default"}-${params.target}`;
      setEdges((edgesSnapshot) => [
        ...edgesSnapshot,
        {
          id: edgeId,
          source: params.source,
          sourceHandle: params.sourceHandle, // 'true' or 'false' for conditional
          target: params.target,
          targetHandle: params.targetHandle,
        },
      ]);
    },
    [],
  );

  const onNodeClick = useCallback(
    (event: any, node: any) => {
      const current = nodes.find((n) => n.nodeId === node.id);
      if (!current) return;
      setNodeMenu({
        node: current,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [nodes],
  );

  const onConnectEnd = useCallback((_params: any, connectionInfo: any) => {
    if (!connectionInfo.isValid) {
      const sourceHandle = connectionInfo.fromHandle?.id || connectionInfo.handleId || connectionInfo.sourceHandle;
      setSelectedAction({
        startingNodeId: connectionInfo.fromNode.id,
        position: {
          x: connectionInfo.from.x + POSITION_OFFSET,
          y: connectionInfo.from.y + POSITION_OFFSET,
        },
        sourceHandle,
      });
    }
  }, []);

  const canSave = useMemo(
    () => {
      if (nodes.length === 0 || loading) return false;
      if (workflowName.trim().length < MIN_WORKFLOW_NAME_LENGTH) return false;
      if (!workflowId) return true;

      return (
        buildWorkflowSnapshot({
          workflowName,
          nodes,
          edges,
          executionMode,
        }) !== lastSavedSnapshot
      );
    },
    [nodes, edges, workflowName, executionMode, workflowId, loading, lastSavedSnapshot],
  );
  const hasZerodhaAction = useMemo(
    () =>
      nodes.some(
        (node) =>
          String(node.data?.kind || "").toLowerCase() === "action" &&
          ["zerodha", "groww", "lighter"].includes(String(node.type || "").toLowerCase()),
      ),
    [nodes],
  );

  const onSave = useCallback(async () => {
    const normalizedWorkflowName = workflowName.trim();
    if (normalizedWorkflowName.length < MIN_WORKFLOW_NAME_LENGTH) {
      setSaveError(`Workflow name must be at least ${MIN_WORKFLOW_NAME_LENGTH} characters.`);
      setShowNameDialog(true);
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      for (const payload of collectBrokerVerificationPayloads(nodes).values()) {
        await apiVerifyBrokerCredentials(payload);
      }

      const payload = {
        workflowName: normalizedWorkflowName,
        nodes,
        edges,
        executionMode,
      };
      if (!workflowId) {
        const res = await apiCreateWorkflow(payload);
        if (!res.workflowId) throw new Error("Missing workflowId from server");
        setWorkflowName(normalizedWorkflowName);
        toast.success("Workflow created successfully");
        navigate(`/workflow/${res.workflowId}`);
      } else {
        await apiUpdateWorkflow(workflowId, payload);
        setWorkflowName(normalizedWorkflowName);
        setLastSavedSnapshot(
          buildWorkflowSnapshot({
            workflowName: normalizedWorkflowName,
            nodes,
            edges,
            executionMode,
          }),
        );
        toast.success("Workflow updated successfully");
      }
    } catch (e: any) {
      const message =
        e?.response?.data?.message ?? e?.message ?? "Save failed";
      const normalized = String(message).toLowerCase();
      if (
        normalized.includes("verification") ||
        normalized.includes("credential") ||
        normalized.includes("zerodha") ||
        normalized.includes("groww") ||
        normalized.includes("lighter")
      ) {
        setSaveError(`Broker verification failed: ${message}`);
      } else {
        setSaveError(message);
      }
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflowId, workflowName, executionMode, navigate]);

  const handleNameDialogSubmit = () => {
    const normalizedWorkflowName = workflowName.trim();
    if (normalizedWorkflowName.length >= MIN_WORKFLOW_NAME_LENGTH) {
      setWorkflowName(normalizedWorkflowName);
      setSaveError(null);
      setShowNameDialog(false);
      setShowTriggerSheet(true);
      return;
    }

    setSaveError(`Workflow name must be at least ${MIN_WORKFLOW_NAME_LENGTH} characters.`);
  };

  const openEditMenuNode = useCallback(() => {
    if (!nodeMenu) return;
    setEditingNode(nodeMenu.node);
    setNodeMenu(null);

    if (String(nodeMenu.node.data?.kind || "").toLowerCase() === "trigger") {
      setShowTriggerSheetEdit(true);
      return;
    }

    setShowActionSheetEdit(true);
  }, [nodeMenu]);

  const duplicateMenuNode = useCallback(() => {
    if (!nodeMenu) return;
    const sourceNode = nodeMenu.node;
    const duplicatedNode: NodeType = {
      ...sourceNode,
      nodeId: Math.random().toString(),
      position: {
        x: (sourceNode.position?.x || 0) + 56,
        y: (sourceNode.position?.y || 0) + 56,
      },
      data: {
        kind: sourceNode.data?.kind || "action",
        metadata: { ...(sourceNode.data?.metadata || {}) },
      },
    };

    setNodes((prev) => [...prev, duplicatedNode]);
    setNodeMenu(null);
  }, [nodeMenu]);

  const deleteMenuNode = useCallback(() => {
    if (!nodeMenu) return;
    const nodeId = nodeMenu.node.nodeId;
    setNodes((prev) => prev.filter((node) => node.nodeId !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setNodeMenu(null);
    setEditingNode((current) => (current?.nodeId === nodeId ? null : current));
  }, [nodeMenu]);

  const confirmResetWorkflowBuilder = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setWorkflowId(null);
    setWorkflowName("");
    setExecutionMode("live");
    setSaveError(null);
    setMarketType(null);
    setSelectedAction(null);
    setEditingNode(null);
    setNodeMenu(null);
    setLastSavedSnapshot(null);
    setShowTriggerSheet(false);
    setShowTriggerSheetEdit(false);
    setShowActionSheetEdit(false);
    setShowResetDialog(false);
    setShowNameDialog(true);
    setAiBuilderContext(null);
    setActiveAiVersionId("");
  }, []);

  const resetWorkflowBuilder = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const handleExportBuilder = useCallback(async () => {
    if (!workflowId) {
      toast.error("Save workflow first", { description: "Please save your workflow before sharing." });
      return;
    }

    setExportingBuilder(true);
    try {
      const response = await apiGenerateShareCode(workflowId);
      setShareCode(response.shareCode);
      setShareCodeDialogOpen(true);
      toast.success("Share code generated", { description: "Share this code with others!" });
    } catch (error: any) {
      toast.error("Export failed", {
        description: error?.response?.data?.message ?? "Could not generate share code.",
      });
    } finally {
      setExportingBuilder(false);
    }
  }, [workflowId]);

  const handleImportToBuilder = useCallback((importedNodes: NodeType[], importedEdges: EdgeType[], importedExecutionMode: string, importedName?: string) => {
    // Import workflow data into current builder
    setNodes(importedNodes);
    setEdges(importedEdges);
    setExecutionMode((importedExecutionMode as "live" | "dry-run") || "live");
    if (importedName) {
      setWorkflowName(importedName);
    }
    setImportDialogOpen(false);
    toast.success("Workflow imported", { description: "Imported into builder. Save when ready!" });
  }, []);

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-black px-6 pb-8 pt-28 text-white md:px-10">
      <AppBackground />
      <div className={`mx-auto ${isFullscreen ? "max-w-10xl" : "max-w-6xl"}`}>
        {!isFullscreen && (
          <>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
                  {workflowId ? "Edit workflow" : "Create workflow"}
                </p>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                  {aiBuilderContext?.draftId ? (
                    <Button
                      variant="outline"
                      className="w-fit border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 cursor-pointer"
                      onClick={() =>
                        navigate("/create/ai-chat", {
                          state: {
                            draftId: aiBuilderContext.draftId,
                            versionId: activeAiVersionId || undefined,
                          },
                        })
                      }
                    >
                      ← Back to chat
                    </Button>
                  ) : null}
                  <input
                    value={workflowName}
                    onChange={(event) => {
                      setWorkflowName(event.target.value);
                      if (saveError) {
                        setSaveError(null);
                      }
                    }}
                    placeholder="Untitled workflow"
                    className="h-10 w-full max-w-xs md:max-w-sm rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-lg font-medium tracking-tight text-neutral-50 outline-none transition focus:border-[#f17463]/70"
                  />
                  {workflowName.trim().length > 0 && workflowName.trim().length < MIN_WORKFLOW_NAME_LENGTH ? (
                    <p className="text-xs text-amber-300">
                      Workflow name must be at least {MIN_WORKFLOW_NAME_LENGTH} characters.
                    </p>
                  ) : null}
                </div>
                <p className="mt-1 max-w-xl text-sm text-neutral-400">
                  Chain together triggers and broker actions to automate your
                  trading strategies.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-neutral-400">
                    <span className="mr-1 text-neutral-500">Mode:</span>
                    <span className={executionMode === "dry-run" ? "font-medium text-amber-300" : "font-medium text-emerald-300"}>
                      {executionMode === "dry-run" ? "Dry Run" : "Live"}
                    </span>
                  </div>
                  {routeWorkflowId && <div className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-neutral-400">
                    <span className="mr-1 text-neutral-500">Name:</span>
                    <span className="font-mono text-neutral-200">
                      {workflowName || "-"}
                    </span>
                  </div>}
                {workflowId && (
                  <div className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-neutral-400">
                    <span className="mr-1 text-neutral-500">Workflow ID:</span>
                    <span className="font-mono text-neutral-200">
                      {workflowId.slice(0, 6)}...
                    </span>
                  </div>
                )}
                </div>
                {saveError && (
                  <div className="max-w-xs rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {saveError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Select
                    value={executionMode}
                    onValueChange={(value) => setExecutionMode(value as "live" | "dry-run")}
                  >
                    <SelectTrigger className="mt-1 h-9 min-w-34 rounded-xl border-neutral-800 bg-neutral-950 px-3 text-xs font-medium text-neutral-200">
                      <SelectValue placeholder="Execution mode" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                      <SelectItem value="live" className="text-xs cursor-pointer">Live mode</SelectItem>
                      <SelectItem value="dry-run" className="text-xs cursor-pointer">Dry run mode</SelectItem>
                    </SelectContent>
                  </Select>
                  {aiBuilderContext?.versions?.length ? (
                    <Select
                      value={activeAiVersionId || ""}
                      onValueChange={(value) => void handleLoadAiVersion(value)}
                      disabled={switchingAiVersion}
                    >
                      <SelectTrigger className="mt-1 h-9 min-w-47.5 rounded-xl border-neutral-800 bg-neutral-950 px-3 text-xs font-medium text-neutral-200">
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                        {aiBuilderContext.versions.map((version, index) => (
                          <SelectItem key={version.id} value={version.id} className="text-xs cursor-pointer">
                            v{index + 1} - {version.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <OrangeButton
                    onClick={onSave}
                    disabled={!canSave || saving}
                    className="mt-1 shrink-0 whitespace-nowrap px-4 py-2 text-xs md:text-sm"
                  >
                    {switchingAiVersion
                      ? "Loading version..."
                      : saving
                      ? "Saving..."
                      : workflowId
                        ? "Update workflow"
                        : "Save workflow"}
                  </OrangeButton>
                  <Button
                    variant="outline"
                    className="mt-1 border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-medium text-neutral-200 md:text-sm cursor-pointer"
                    onClick={() => setImportDialogOpen(true)}
                    title="Import workflow from file"
                  >
                    ↑ Import
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-1 border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-medium text-neutral-200 md:text-sm cursor-pointer gap-2"
                    onClick={handleExportBuilder}
                    disabled={exportingBuilder}
                    title="Share workflow with code"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {exportingBuilder ? "Generating..." : "Share"}
                  </Button>
                  {routeWorkflowId && 
                    <Button
                      variant="outline"
                      className="mt-1 border-neutral-800 bg-neutral-950 px-5 py-2 text-xs font-medium text-neutral-200 md:text-sm cursor-pointer"
                      onClick={() => {
                        setNodes([]);
                        setEdges([]);
                        setWorkflowId(null);
                        setWorkflowName("");
                        setExecutionMode("live");
                        setAiBuilderContext(null);
                        setActiveAiVersionId("");
                        navigate("/create/builder");
                        setShowNameDialog(true);
                      }}
                    >
                      New workflow
                    </Button>
                  }
                </div>
              </div>
            </div>
          </>
        )}

        <WorkflowCanvas
          nodeTypes={workflowNodeTypes as any}
          nodes={nodes}
          edges={edges}
          loading={loading}
          routeWorkflowId={routeWorkflowId}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
          workflowId={workflowId}
          saveError={saveError}
          canSave={canSave}
          saving={saving}
          onSave={onSave}
          onResetWorkflow={resetWorkflowBuilder}
          showTriggerSheet={showTriggerSheet}
          setShowTriggerSheet={setShowTriggerSheet}
          onTriggerSelect={(type, metadata) => {
            setNodes([
              ...nodes,
              {
                nodeId: Math.random().toString(),
                type,
                data: { kind: "trigger", metadata },
                position: { x: 0, y: 0 },
              },
            ]);
            setShowTriggerSheet(false);
          }}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          onActionSelect={(type, metadata) => {
            if (!selectedAction) return;
            // Use the sourceHandle from selectedAction (set by onConnectEnd)
            let branch: 'true' | 'false' | undefined = undefined;
            if (selectedAction.sourceHandle === 'true' || selectedAction.sourceHandle === 'false') {
              branch = selectedAction.sourceHandle;
            }
            // Set condition boolean for conditional triggers
            let condition: boolean | undefined = undefined;
            if (branch === 'true') condition = true;
            if (branch === 'false') condition = false;
            const nodeId = Math.random().toString();
            const preservesOwnBranching = type === "conditional-trigger" || type === "if";
            const ignoresBranchCondition = type === "merge";
            setNodes([
              ...nodes,
              {
                nodeId,
                type,
                data: {
                  kind: "action",
                  metadata: preservesOwnBranching || ignoresBranchCondition
                    ? { ...metadata }
                    : { ...metadata, branch, ...(condition !== undefined ? { condition } : {}) },
                },
                position: selectedAction.position,
              },
            ]);
            setEdges([
              ...edges,
              {
                id: `e${selectedAction.startingNodeId}-${branch || "default"}-${nodeId}`,
                source: selectedAction.startingNodeId,
                target: nodeId,
                sourceHandle: branch,
              },
            ]);
            setSelectedAction(null);
          }}
          showTriggerSheetEdit={showTriggerSheetEdit}
          setShowTriggerSheetEdit={setShowTriggerSheetEdit}
          showActionSheetEdit={showActionSheetEdit}
          setShowActionSheetEdit={setShowActionSheetEdit}
          editingNode={editingNode}
          setEditingNode={setEditingNode}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          nodeMenu={nodeMenu}
          onNodeMenuOpenChange={(open) => {
            if (!open) setNodeMenu(null);
          }}
          onEditNodeFromMenu={openEditMenuNode}
          onDuplicateNodeFromMenu={duplicateMenuNode}
          onDeleteNodeFromMenu={deleteMenuNode}
          onOpenNameDialog={() => setShowNameDialog(true)}
          onEditTriggerSave={(type, metadata) => {
            if (!editingNode) return;
            setNodes((prev) =>
              prev.map((n) =>
                n.nodeId === editingNode.nodeId
                  ? { ...n, type, data: { ...n.data, metadata } }
                  : n,
              ),
            );
            setShowTriggerSheetEdit(false);
            setEditingNode(null);
          }}
          onEditActionSave={(type, metadata) => {
            if (!editingNode) return;
            setNodes((prev) =>
              prev.map((n) =>
                n.nodeId === editingNode.nodeId
                  ? { ...n, type, data: { ...n.data, metadata } }
                  : n,
              ),
            );
            setShowActionSheetEdit(false);
            setEditingNode(null);
          }}
          marketType={marketType}
          setMarketType={setMarketType}
          hasZerodhaAction={hasZerodhaAction}
        />
        <WorkflowNameDialog
          open={showNameDialog}
          onOpenChange={setShowNameDialog}
          workflowName={workflowName}
          onChangeName={setWorkflowName}
          onSubmit={handleNameDialogSubmit}
        />

        <ImportCodeDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImported={handleImportToBuilder}
        />

        <ShareCodeDialog
          open={shareCodeDialogOpen}
          onOpenChange={setShareCodeDialogOpen}
          shareCode={shareCode || ""}
        />

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="max-w-md border-neutral-800 bg-neutral-950 text-neutral-100">
            <DialogHeader>
              <DialogTitle className="text-base">Reset workflow?</DialogTitle>
              <DialogDescription className="text-neutral-400">
                This will remove all nodes and edges from the canvas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-neutral-700 bg-neutral-900 text-neutral-200 cursor-pointer"
                onClick={() => setShowResetDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                onClick={confirmResetWorkflowBuilder}
              >
                Reset workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
