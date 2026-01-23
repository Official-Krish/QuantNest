import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  BackgroundVariant,
  Background,
} from "@xyflow/react";
import { useNavigate, useParams } from "react-router-dom";
import { type EdgeType, type NodeType } from "@n8n-trading/types";
import { TriggerSheet } from "./TriggerSheet";
import { PriceTrigger } from "./nodes/triggers/PriceTrigger";
import { Timer } from "./nodes/triggers/timers";
import { ActionSheet } from "./ActionSheet";
import { zerodhaAction } from "./nodes/actions/zerodha";
import { growwAction } from "./nodes/actions/growwAction";
import {
  apiCreateWorkflow,
  apiGetWorkflow,
  apiUpdateWorkflow,
} from "@/http";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "./ui/input";

const nodeTypes = {
  "price-trigger": PriceTrigger,
  timer: Timer,
  zerodha: zerodhaAction,
  groww: growwAction,
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
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [workflowName, setWorkflowName] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<{
    position: { x: number; y: number };
    startingNodeId: string;
  } | null>(null);

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
          }
          if (!nodeType) {
            const metadata = node.data?.metadata || {};
            if (metadata.time !== undefined) {
              nodeType = "timer";
            } else if (metadata.asset !== undefined && metadata.targetPrice !== undefined) {
              nodeType = "price-trigger";
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
        setNodes(normalizedNodes as NodeType[]);
        setEdges(workflow.edges as EdgeType[]);
        setWorkflowId(workflow._id);
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
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const onConnectEnd = useCallback((_params: any, connectionInfo: any) => {
    if (!connectionInfo.isValid) {
      setSelectedAction({
        startingNodeId: connectionInfo.fromNode.id,
        position: {
          x: connectionInfo.from.x + POSITION_OFFSET,
          y: connectionInfo.from.y + POSITION_OFFSET,
        },
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
      <div className="mx-auto max-w-6xl">
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
                {workflowId && (
                  <div className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-neutral-400">
                    <span className="mr-1 text-neutral-500">Workflow ID:</span>
                    <span className="font-mono text-neutral-200">
                      {workflowId.slice(0, 6)}...
                    </span>
                  </div>
                )}
                {saveError && (
                  <div className="max-w-xs rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {saveError}
                  </div>
                )}
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
              </div>
            </div>

            <div className="mb-4 grid gap-3 text-xs text-neutral-400 md:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Trigger
                </p>
                <p className="mt-1 text-sm text-neutral-200">
                  Start with a market event or timer node. You can only have one
                  root trigger per workflow.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Actions
                </p>
                <p className="mt-1 text-sm text-neutral-200">
                  Connect Zerodha or Groww execution blocks to define how trades
                  should be placed when your conditions hit.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Live-safe
                </p>
                <p className="mt-1 text-sm text-neutral-200">
                  Changes to an existing workflow are versioned via the backend.
                  Save frequently before promoting to live trading.
                </p>
              </div>
            </div>
          </>
        )}

        <div
          className={`relative mt-4 rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-black to-neutral-900/90 p-3 ${
            isFullscreen
              ? "fixed inset-0 z-40 h-screen md:h-screen pt-24 md:pt-24 px-4 md:px-10"
              : "h-[60vh] md:h-[65vh]"
          }`}
        >
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-sm text-neutral-300">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
                <span>Loading workflow canvas…</span>
              </div>
            </div>
          )}

          {!nodes.length && !routeWorkflowId && !loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                Start with a trigger
              </p>
              <p className="max-w-sm text-sm text-neutral-300">
                Choose a market price trigger or a timer to kick off your
                strategy. We will guide you through connecting broker actions.
              </p>
              <Button
                className="mt-2 bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200 md:text-sm cursor-pointer"
                onClick={() => setShowNameDialog(true)}
              >
                + Add your trigger
              </Button>
            </div>
          )}

          <button
            type="button"
            className="absolute right-4 top-4 z-20 rounded-full border border-neutral-800 bg-neutral-950/80 px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-900/90 cursor-pointer"
            onClick={() => setIsFullscreen((prev) => !prev)}
          >
            {isFullscreen ? "Close full screen" : "Full screen"}
          </button>

            <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
              <DialogContent className="bg-neutral-900 text-neutral-200 border border-neutral-800 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-neutral-100">Name your workflow</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Give your workflow a descriptive name to identify it later.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="e.g., NIFTY Swing Trading Strategy"
                    className="bg-neutral-800 text-neutral-200 placeholder-neutral-500"
                    onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNameDialogSubmit();
                    }
                    }}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                    <button
                      onClick={() => setShowNameDialog(false)}
                      className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:text-neutral-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNameDialogSubmit}
                      disabled={!workflowName.trim()}
                      className="px-4 py-2 ml-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-lg hover:scale-103 disabled:opacity-50 transform transition duration-300 cursor-pointer"
                    >
                      Continue
                    </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          {isFullscreen && (
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
              {workflowId && (
                <div className="rounded-full border border-neutral-800 bg-neutral-950/80 px-3 py-1 text-[11px] text-neutral-300">
                  <span className="mr-1 text-neutral-500">ID:</span>
                  <span className="font-mono text-neutral-100">
                    {workflowId.slice(0, 6)}...
                  </span>
                </div>
              )}
              {saveError && (
                <div className="max-w-xs rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] text-red-300">
                  {saveError}
                </div>
              )}
              <Button
                onClick={onSave}
                disabled={!canSave || saving}
                className="bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200"
              >
                {saving
                  ? "Saving..."
                  : workflowId
                    ? "Update workflow"
                    : "Save workflow"}
              </Button>
            </div>
          )}

          <div className="h-full overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-950">
            {showTriggerSheet && (
              <TriggerSheet
                open={showTriggerSheet}
                onOpenChange={setShowTriggerSheet}
                onSelect={(type, metadata) => {
                  setNodes([
                    ...nodes,
                    {
                      nodeId: Math.random().toString(),
                      type,
                      data: {
                        kind: "trigger",
                        metadata,
                      },
                      position: { x: 0, y: 0 },
                    },
                  ]);
                  setShowTriggerSheet(false);
                }}
              />
            )}

            {selectedAction && (
              <ActionSheet
                open={!!selectedAction}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedAction(null);
                  }
                }}
                onSelect={(type, metadata) => {
                  const nodeId = Math.random().toString();
                  setNodes([
                    ...nodes,
                    {
                      nodeId: nodeId,
                      type,
                      data: {
                        kind: "action",
                        metadata,
                      },
                      position: selectedAction.position,
                    },
                  ]);
                  setEdges([
                    ...edges,
                    {
                      id: `e${selectedAction.startingNodeId}-${nodeId}`,
                      source: selectedAction.startingNodeId,
                      target: nodeId,
                    },
                  ]);
                  setSelectedAction(null);
                }}
              />
            )}

            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes.map((node) => ({
                ...node,
                id: node.nodeId,
              }))}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectEnd={onConnectEnd}
              fitView
            >
              <Background
                gap={22}
                size={2}
                color="#262626"
                variant={BackgroundVariant.Dots}
              />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};
