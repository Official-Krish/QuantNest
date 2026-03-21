import { useMemo } from "react";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import type { EdgeType, NodeType } from "@quantnest-trading/types";
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { aiPreviewNodeTypes } from "@/components/ai-builder/previewNodeTypes";
import { buildPreviewLayout, cx, type WorkflowCanvasCardProps } from "./shared";

export function WorkflowCanvasCard({ version, theme }: WorkflowCanvasCardProps) {
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
