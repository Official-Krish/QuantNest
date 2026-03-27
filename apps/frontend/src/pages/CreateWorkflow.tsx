import { useCallback, useEffect, useMemo, useState } from "react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { type EdgeType, type NodeType } from "@quantnest-trading/types";
import { WorkflowCanvas } from "../components/workflow/WorkflowCanvas";
import { WorkflowNameDialog } from "../components/workflow/WorkflowNameDialog";
import {
  apiCreateWorkflow,
  apiGetWorkflow,
  apiVerifyBrokerCredentials,
  apiUpdateWorkflow,
} from "@/http";
import { Button } from "@/components/ui/button";
import { OrangeButton } from "@/components/ui/button-orange";
import { workflowNodeTypes } from "@/components/workflow/nodeTypes";
import { AppBackground } from "@/components/background";
import { toast } from "sonner";

const POSITION_OFFSET = 50;

function normalizeNodeForCompare(node: NodeType) {
  return {
    nodeId: node.nodeId,
    type: String(node.type || ""),
    data: {
      kind: String(node.data?.kind || ""),
      metadata: node.data?.metadata || {},
    },
  };
}

function normalizeEdgeForCompare(edge: EdgeType) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
  };
}

function buildWorkflowSnapshot(params: {
  workflowName: string;
  nodes: NodeType[];
  edges: EdgeType[];
}) {
  return JSON.stringify({
    workflowName: params.workflowName.trim(),
    nodes: params.nodes.map(normalizeNodeForCompare),
    edges: params.edges.map(normalizeEdgeForCompare),
  });
}

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
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{
    node: NodeType;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (routeWorkflowId) return;

    const generatedPlan = (location.state as any)?.generatedPlan;
    if (!generatedPlan) return;

    setNodes((generatedPlan.nodes || []) as NodeType[]);
    setEdges((generatedPlan.edges || []) as EdgeType[]);
    setWorkflowName(String(generatedPlan.workflowName || ""));
    setMarketType((generatedPlan.marketType || "Indian") as "Indian" | "Crypto");
    setLastSavedSnapshot(null);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, routeWorkflowId]);

  // Load an existing workflow when opened from /workflow/:workflowId
  useEffect(() => {
    if (!routeWorkflowId) return;

    const load = async () => {
      setLoading(true);
      setSaveError(null);
      try {
        const workflow = await apiGetWorkflow(routeWorkflowId);
        const normalizedNodes = workflow.nodes.map((node: any) => {
          const nodeId = node.nodeId || node.id;
          let nodeType = node.type;
          if (nodeType) {
            nodeType = nodeType.toLowerCase();
            if (nodeType === "price") nodeType = "price-trigger";
            if (nodeType === "conditional") nodeType = "conditional-trigger";
          }
          if (!nodeType) {
            const metadata = node.data?.metadata || {};
            const kind = node.data?.kind?.toLowerCase();
            if (metadata.time !== undefined) {
              nodeType = "timer";
            } else if (metadata.asset !== undefined && metadata.targetPrice !== undefined && metadata.condition !== undefined) {
              nodeType = kind === "trigger"
                ? "conditional-trigger"
                : "price-trigger";
            } else if (metadata.recipientEmail !== undefined) {
              nodeType = "gmail";
            } else if (metadata.durationSeconds !== undefined) {
              nodeType = "delay";
            } else if (
              metadata.expression !== undefined ||
              (metadata.targetPrice !== undefined && metadata.condition !== undefined && metadata.asset !== undefined)
            ) {
              nodeType = kind === "trigger" ? "conditional-trigger" : "if";
            } else if (metadata.slackUserId !== undefined || metadata.slackBotToken !== undefined) {
              nodeType = "slack";
            } else if (metadata.webhookUrl !== undefined) {
              nodeType = "discord";
            } else if (metadata.type !== undefined && metadata.qty !== undefined && metadata.symbol !== undefined) {
              nodeType = "zerodha";
            } else if (metadata.notionApiKey !== undefined || metadata.parentPageId !== undefined || metadata.aiConsent !== undefined) {
              nodeType = "notion-daily-report";
            } else if (metadata.googleClientEmail !== undefined || metadata.googlePrivateKey !== undefined || metadata.googleDriveFolderId !== undefined) {
              nodeType = "google-drive-daily-csv";
            } else if (metadata.recipientPhone !== undefined) {
              nodeType = "whatsapp";
            } else {
              nodeType = kind === "action" ? "zerodha" : "timer";
            }
          }
          
          return {
            nodeId,
            type: nodeType,
            data: {
              kind: (node.data?.kind?.toLowerCase() || node.data?.kind || "trigger") as "action" | "trigger",
              metadata: node.data?.metadata || {},
            },
            position: node.position || { x: 0, y: 0 },
          };
        });
        const nodeById = new Map<string, any>(
          normalizedNodes.map((node: any) => [node.nodeId, node] as const),
        );
        const normalizedEdges = (workflow.edges || []).map((edge: any) => {
          if (edge.sourceHandle) {
            return edge;
          }
          const sourceNode = nodeById.get(edge.source);
          const targetNode = nodeById.get(edge.target);
          if (sourceNode?.type !== "conditional-trigger" && sourceNode?.type !== "if") {
            return edge;
          }
          const targetCondition = targetNode?.data?.metadata?.condition;
          if (typeof targetCondition === "boolean") {
            return {
              ...edge,
              sourceHandle: targetCondition ? "true" : "false",
            };
          }
          return edge;
        });
        setNodes(normalizedNodes as NodeType[]);
        setEdges(normalizedEdges as EdgeType[]);
        setWorkflowId(workflow._id);
        setWorkflowName(workflow.workflowName || "");
        setMarketType(workflow.marketType || "Indian");
        setLastSavedSnapshot(
          buildWorkflowSnapshot({
            workflowName: workflow.workflowName || "",
            nodes: normalizedNodes as NodeType[],
            edges: normalizedEdges as EdgeType[],
          }),
        );
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
      if (!workflowId) return true;

      return (
        buildWorkflowSnapshot({
          workflowName,
          nodes,
          edges,
        }) !== lastSavedSnapshot
      );
    },
    [nodes, edges, workflowName, workflowId, loading, lastSavedSnapshot],
  );
  const hasZerodhaAction = useMemo(
    () =>
      nodes.some(
        (node) =>
          String(node.data?.kind || "").toLowerCase() === "action" &&
          String(node.type || "").toLowerCase() === "zerodha",
      ),
    [nodes],
  );

  const onSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const verificationPayloads = new Map<
        string,
        {
          brokerType: "zerodha" | "groww" | "lighter";
          apiKey?: string;
          accessToken?: string;
          accountIndex?: number;
          apiKeyIndex?: number;
        }
      >();

      for (const node of nodes) {
        if (String(node.data?.kind || "").toLowerCase() !== "action") continue;
        const nodeType = String(node.type || "").toLowerCase();
        const metadata: any = node.data?.metadata || {};

        if (nodeType === "zerodha") {
          const payload = {
            brokerType: "zerodha" as const,
            apiKey: String(metadata.apiKey || "").trim(),
            accessToken: String(metadata.accessToken || "").trim(),
          };
          verificationPayloads.set(
            `zerodha:${payload.apiKey}:${payload.accessToken}`,
            payload
          );
          continue;
        }

        if (nodeType === "groww") {
          const payload = {
            brokerType: "groww" as const,
            accessToken: String(metadata.accessToken || "").trim(),
          };
          verificationPayloads.set(
            `groww:${payload.accessToken}`,
            payload
          );
          continue;
        }

        if (nodeType === "lighter") {
          const payload = {
            brokerType: "lighter" as const,
            apiKey: String(metadata.apiKey || "").trim(),
            accountIndex: Number(metadata.accountIndex),
            apiKeyIndex: Number(metadata.apiKeyIndex),
          };
          verificationPayloads.set(
            `lighter:${payload.apiKey}:${payload.accountIndex}:${payload.apiKeyIndex}`,
            payload
          );
        }
      }

      for (const payload of verificationPayloads.values()) {
        await apiVerifyBrokerCredentials(payload);
      }

      const payload = { workflowName, nodes, edges };
      if (!workflowId) {
        const res = await apiCreateWorkflow(payload);
        if (!res.workflowId) throw new Error("Missing workflowId from server");
        toast.success("Workflow created successfully");
        navigate(`/workflow/${res.workflowId}`);
      } else {
        await apiUpdateWorkflow(workflowId, payload);
        setLastSavedSnapshot(
          buildWorkflowSnapshot({
            workflowName,
            nodes,
            edges,
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
  }, [nodes, edges, workflowId, workflowName, navigate]);

  const handleNameDialogSubmit = () => {
    if (workflowName.trim()) {
      setWorkflowName(workflowName.trim());
      setShowNameDialog(false);
      setShowTriggerSheet(true);
    }
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
                <h1 className="mt-2 text-2xl font-medium tracking-tight text-neutral-50 md:text-3xl">
                  Visual workflow builder
                </h1>
                <p className="mt-1 max-w-xl text-sm text-neutral-400">
                  Chain together triggers and broker actions to automate your
                  trading strategies.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
                <div className="flex items-center gap-2">
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
                  <OrangeButton
                    onClick={onSave}
                    disabled={!canSave || saving}
                    className="mt-1 px-5 py-2 text-xs md:text-sm"
                  >
                    {saving
                      ? "Saving..."
                      : workflowId
                        ? "Update workflow"
                        : "Save workflow"}
                  </OrangeButton>
                  {routeWorkflowId && 
                    <Button
                      variant="outline"
                      className="mt-1 border-neutral-800 bg-neutral-950 px-5 py-2 text-xs font-medium text-neutral-200 md:text-sm cursor-pointer"
                      onClick={() => {
                        setNodes([]);
                        setEdges([]);
                        setWorkflowId(null);
                        setWorkflowName("");
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
      </div>
    </div>
  );
};
