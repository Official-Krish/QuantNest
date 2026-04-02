import { useMemo, useState } from "react";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import type { EdgeType, NodeType } from "@quantnest-trading/types";
import { Button } from "@/components/ui/button";
import { OrangeButton } from "@/components/ui/button-orange";
import { ServiceLogo } from "@/components/workflow/service-branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { TriggerSheet } from "./TriggerSheet";
import { ActionSheet } from "./ActionSheet";

export interface SelectedActionState {
  position: { x: number; y: number };
  startingNodeId: string;
  sourceHandle?: string;
}

export interface WorkflowCanvasProps {
  nodeTypes: Record<string, any>;
  nodes: NodeType[];
  edges: EdgeType[];
  loading: boolean;
  routeWorkflowId?: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  workflowId: string | null;
  saveError: string | null;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onResetWorkflow: () => void;
  showTriggerSheet: boolean;
  setShowTriggerSheet: (open: boolean) => void;
  onTriggerSelect: (type: any, metadata: any) => void;
  selectedAction: SelectedActionState | null;
  setSelectedAction: (v: SelectedActionState | null) => void;
  onActionSelect: (type: any, metadata: any) => void;
  showTriggerSheetEdit: boolean;
  setShowTriggerSheetEdit: (open: boolean) => void;
  showActionSheetEdit: boolean;
  setShowActionSheetEdit: (open: boolean) => void;
  editingNode: NodeType | null;
  setEditingNode: (node: NodeType | null) => void;
  onNodesChange: (c: any) => void;
  onEdgesChange: (c: any) => void;
  onConnect: (p: any) => void;
  onConnectEnd: (p: any, info: any) => void;
  onNodeClick: (e: any, node: any) => void;
  nodeMenu: {
    node: NodeType;
    x: number;
    y: number;
  } | null;
  onNodeMenuOpenChange: (open: boolean) => void;
  onEditNodeFromMenu: () => void;
  onDuplicateNodeFromMenu: () => void;
  onDeleteNodeFromMenu: () => void;
  onOpenNameDialog: () => void;
  onEditTriggerSave: (type: any, metadata: any) => void;
  onEditActionSave: (type: any, metadata: any) => void;
  marketType: "Indian" | "Crypto" | null;
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
  hasZerodhaAction: boolean;
}

export const WorkflowCanvas = ({
  nodeTypes,
  nodes,
  edges,
  loading,
  routeWorkflowId,
  isFullscreen,
  onToggleFullscreen,
  workflowId,
  saveError,
  canSave,
  saving,
  onSave,
  onResetWorkflow,
  showTriggerSheet,
  setShowTriggerSheet,
  onTriggerSelect,
  selectedAction,
  setSelectedAction,
  onActionSelect,
  showTriggerSheetEdit,
  setShowTriggerSheetEdit,
  showActionSheetEdit,
  setShowActionSheetEdit,
  editingNode,
  setEditingNode,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectEnd,
  onNodeClick,
  nodeMenu,
  onNodeMenuOpenChange,
  onEditNodeFromMenu,
  onDuplicateNodeFromMenu,
  onDeleteNodeFromMenu,
  onOpenNameDialog,
  onEditTriggerSave,
  onEditActionSave,
  marketType,
  setMarketType,
  hasZerodhaAction,
}: WorkflowCanvasProps) => {
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const menuNodeKind = nodeMenu ? String(nodeMenu.node.data?.kind || "action").toLowerCase() : "action";
  const menuNodeType = nodeMenu ? String(nodeMenu.node.type || "node") : "node";
  const menuNodeLabel = menuNodeType.replaceAll("-", " ");

  const sourceNodeColor = (nodeType: string) => {
    const normalized = nodeType.toLowerCase();
    if (normalized === "price-trigger" || normalized === "timer") return "#f17463";
    if (normalized === "gmail" || normalized === "slack" || normalized === "telegram") return "#38bdf8";
    if (normalized === "zerodha" || normalized === "groww" || normalized === "lighter") return "#34d399";
    if (normalized === "conditional-trigger" || normalized === "if") return "#a78bfa";
    if (normalized === "filter") return "#14b8a6";
    return "#a3a3a3";
  };

  const styledEdges = useMemo(() => {
    const typeById = new Map<string, string>(
      nodes.map((node) => [node.nodeId, String(node.type || "")]),
    );

    return edges.map((edge) => {
      const color = edge.sourceHandle === "true"
        ? "#34d399"
        : edge.sourceHandle === "false"
          ? "#f87171"
          : sourceNodeColor(typeById.get(edge.source) || "");
      return {
        ...edge,
        style: {
          stroke: color,
          strokeWidth: 2,
        },
      };
    });
  }, [edges, nodes]);

  return (
    <div
      className={`relative mt-4 rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-black to-neutral-900/90 p-3 ${
        isFullscreen
          ? "fixed inset-0 z-40 h-screen w-full md:h-screen pt-24 md:pt-24 px-4 md:px-10"
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
            onClick={onOpenNameDialog}
          >
            + Add your trigger
          </Button>
        </div>
      )}

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/85 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm">
        <button
          type="button"
          className="rounded-full px-3 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10 cursor-pointer"
          onClick={onResetWorkflow}
        >
          Reset workflow
        </button>
        <button
          type="button"
          className="rounded-full px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-900/90 cursor-pointer"
          onClick={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 350 })}
        >
          Center nodes
        </button>
        <button
          type="button"
          className="rounded-full px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-900/90 cursor-pointer"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? "Close full screen" : "Full screen"}
        </button>
      </div>

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
          <OrangeButton
            onClick={onSave}
            disabled={!canSave || saving}
            className="px-4 py-2 text-xs"
          >
            {saving ? "Saving..." : workflowId ? "Update workflow" : "Save workflow"}
          </OrangeButton>
          <Button
            variant="outline"
            className="border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
            onClick={onResetWorkflow}
          >
            Reset workflow
          </Button>
        </div>
      )}

      <div className="h-full overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-950">
        {nodeMenu ? (
          <DropdownMenu open={!!nodeMenu} onOpenChange={onNodeMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="pointer-events-none fixed h-1 w-1 opacity-0"
                style={{ left: nodeMenu.x, top: nodeMenu.y }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="border-neutral-800 bg-neutral-950 text-neutral-100"
              align="start"
              sideOffset={10}
            >
              <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                  <ServiceLogo service={menuNodeType} size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                    {menuNodeKind}
                  </span>
                  <span className="block truncate text-sm font-medium text-neutral-100">
                    {menuNodeLabel}
                  </span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem className="cursor-pointer hover:text-neutral-100" onClick={onEditNodeFromMenu}>
                <Pencil className="size-4" />
                Edit {menuNodeKind}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={onDuplicateNodeFromMenu}>
                <Copy className="size-4" />
                Duplicate {menuNodeKind}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-400"
                onClick={onDeleteNodeFromMenu}
              >
                <Trash2 className="size-4" />
                Delete {menuNodeKind}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {showTriggerSheet && (
          <TriggerSheet
            open={showTriggerSheet}
            onOpenChange={setShowTriggerSheet}
            onSelect={onTriggerSelect}
            marketType={marketType}
            setMarketType={setMarketType}
          />
        )}

        {showTriggerSheetEdit && editingNode && (
          <TriggerSheet
            open={showTriggerSheetEdit}
            onOpenChange={(open) => {
              setShowTriggerSheetEdit(open);
              if (!open) setEditingNode(null);
            }}
            initialKind={editingNode.type as any}
            initialMetadata={editingNode.data?.metadata as any}
            submitLabel="Save trigger"
            title="Edit trigger"
            onSelect={onEditTriggerSave}
            marketType={marketType}
            setMarketType={setMarketType}
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
            onSelect={onActionSelect}
            marketType={marketType}
            setMarketType={setMarketType}
            hasZerodhaAction={hasZerodhaAction}
          />
        )}

        {showActionSheetEdit && editingNode && (
          <ActionSheet
            open={showActionSheetEdit}
            onOpenChange={(open) => {
              setShowActionSheetEdit(open);
              if (!open) setEditingNode(null);
            }}
            initialKind={editingNode.type as any}
            initialMetadata={editingNode.data?.metadata as any}
            submitLabel="Save action"
            title="Edit action"
            onSelect={onEditActionSave}
            marketType={marketType}
            setMarketType={setMarketType}
            hasZerodhaAction={hasZerodhaAction}
          />
        )}

        <ReactFlow
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          nodes={nodes.map((node) => ({
            ...node,
            id: node.nodeId,
          }))}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background gap={22} size={2} color="#262626" variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>
    </div>
  );
};
