import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import type { EdgeType, NodeType } from "@quantnest-trading/types";
import { Button } from "@/components/ui/button";
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
  onOpenNameDialog: () => void;
  onEditTriggerSave: (type: any, metadata: any) => void;
  onEditActionSave: (type: any, metadata: any) => void;
  marketType: "Indian" | "Crypto" | null;
  setMarketType: React.Dispatch<React.SetStateAction<"Indian" | "Crypto" | null>>;
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
  onOpenNameDialog,
  onEditTriggerSave,
  onEditActionSave,
  marketType,
  setMarketType,
}: WorkflowCanvasProps) => {
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

      <button
        type="button"
        className="absolute right-4 top-4 z-20 rounded-full border border-neutral-800 bg-neutral-950/80 px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-900/90 cursor-pointer"
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? "Close full screen" : "Full screen"}
      </button>

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
            className="bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-gray-200 cursor-pointer"
          >
            {saving ? "Saving..." : workflowId ? "Update workflow" : "Save workflow"}
          </Button>
        </div>
      )}

      <div className="h-full overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-950">
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
          onNodeClick={onNodeClick}
          fitView
        >
          <Background gap={22} size={2} color="#262626" variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>
    </div>
  );
};
