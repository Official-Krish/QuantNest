import { useCallback, useEffect, useMemo, useState } from "react";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { useNavigate, useParams } from "react-router-dom";
import { type EdgeType, type NodeType } from "@n8n-trading/types";
import { WorkflowCanvas } from "./workflow/WorkflowCanvas";
import { WorkflowNameDialog } from "./workflow/WorkflowNameDialog";
import { PriceTrigger } from "./nodes/triggers/PriceTrigger";
import { Timer } from "./nodes/triggers/timers";
import { zerodhaAction } from "./nodes/actions/zerodha";
import { growwAction } from "./nodes/actions/growwAction";
import { gmailAction } from "./nodes/actions/gmailAction";
import { discordAction } from "./nodes/actions/discordAction";
import {
  apiCreateWorkflow,
  apiGetWorkflow,
  apiUpdateWorkflow,
} from "@/http";
import { Button } from "@/components/ui/button";
import { lighterAction } from "./nodes/actions/lighterAction";
import { conditionTrigger } from "./nodes/triggers/condtional";

const nodeTypes = {
  "price-trigger": PriceTrigger,
  timer: Timer,
  zerodha: zerodhaAction,
  groww: growwAction,
  gmail: gmailAction,
  discord: discordAction,
  lighter: lighterAction,
  "conditional-trigger": conditionTrigger,
};

const POSITION_OFFSET = 50;

export const CreateWorkflow = () => {
  const navigate = useNavigate();
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
            if (metadata.time !== undefined) {
              nodeType = "timer";
            } else if (metadata.expression !== undefined) {
              nodeType = "conditional-trigger";
            } else if (metadata.asset !== undefined && metadata.targetPrice !== undefined && metadata.condition !== undefined) {
              nodeType = metadata.timeWindowMinutes !== undefined
                ? "conditional-trigger"
                : "price-trigger";
            } else if (metadata.type !== undefined && metadata.qty !== undefined && metadata.symbol !== undefined) {
              nodeType = "zerodha";
            } else {
              const kind = node.data?.kind?.toLowerCase();
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
        const nodeById = new Map(
          normalizedNodes.map((node: any) => [node.nodeId, node]),
        );
        const normalizedEdges = (workflow.edges || []).map((edge: any) => {
          if (edge.sourceHandle) {
            return edge;
          }
          const sourceNode = nodeById.get(edge.source);
          const targetNode = nodeById.get(edge.target);
          if (sourceNode?.type !== "conditional-trigger") {
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
      // params: { source, sourceHandle, target, targetHandle, ... }
      setEdges((edgesSnapshot) => [
        ...edgesSnapshot,
        {
          id: `e${params.source}-${params.target}`,
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
    (_event: any, node: any) => {
      const current = nodes.find((n) => n.nodeId === node.id);
      if (!current) return;
      setEditingNode(current);
      if (current.data?.kind === "trigger") {
        setShowTriggerSheetEdit(true);
      } else {
        setShowActionSheetEdit(true);
      }
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
    () => nodes.length > 0 && !loading,
    [nodes.length, loading],
  );

  const onSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const payload = { workflowName, nodes, edges };
      if (!workflowId) {
        const res = await apiCreateWorkflow(payload);
        if (!res.workflowId) throw new Error("Missing workflowId from server");
        navigate(`/workflow/${res.workflowId}`);
      } else {
        await apiUpdateWorkflow(workflowId, payload);
      }
    } catch (e: any) {
      setSaveError(
        e?.response?.data?.message ?? e?.message ?? "Save failed",
      );
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflowId]);

  const handleNameDialogSubmit = () => {
    if (workflowName.trim()) {
      setWorkflowName(workflowName.trim());
      setShowNameDialog(false);
      setShowTriggerSheet(true);
    }
  };

  return (
    <div className="bg-black min-h-screen w-full text-white pt-24 pb-8 px-6 md:px-10">
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
                  trading strategies, with the same aesthetic as your landing
                  experience.
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
                  <Button
                    variant="default"
                    onClick={onSave}
                    disabled={!canSave || saving}
                    className="mt-1 bg-white px-5 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200 md:text-sm cursor-pointer"
                  >
                    {saving
                      ? "Saving..."
                      : workflowId
                        ? "Update workflow"
                        : "Save workflow"}
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
                        navigate("/create");
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
          nodeTypes={nodeTypes as any}
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
            setNodes([
              ...nodes,
              {
                nodeId,
                type,
                data: { kind: "action", metadata: { ...metadata, branch, ...(condition !== undefined ? { condition } : {}) } },
                position: selectedAction.position,
              },
            ]);
            setEdges([
              ...edges,
              {
                id: `e${selectedAction.startingNodeId}-${nodeId}`,
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
