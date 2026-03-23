import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import { Expand, X } from "lucide-react";
import type { EdgeType, NodeType } from "@quantnest-trading/types";
import { normalizeGeneratedNodes } from "@/components/ai-builder/utils";
import { aiPreviewNodeTypes } from "@/components/ai-builder/previewNodeTypes";
import { buildPreviewLayout, cx, type WorkflowCanvasCardProps } from "./shared";

export function WorkflowCanvasCard({
  version,
  theme,
  compact = false,
  title = "Workflow Preview",
  attached = false,
}: WorkflowCanvasCardProps) {
  const [expanded, setExpanded] = useState(false);
  const nodes = useMemo(
    () => (version ? (normalizeGeneratedNodes(version.response.plan) as NodeType[]) : []),
    [version],
  );
  const edges = useMemo(() => {
    if (!version) return [];

    const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));
    return (version.response.plan.edges as EdgeType[]).map((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const normalizedType = String(sourceNode?.type || "").toLowerCase();
      const isTrigger = ["price", "timer", "conditional-trigger"].includes(normalizedType);
      const stroke =
        edge.sourceHandle === "true"
          ? "#34d399"
          : edge.sourceHandle === "false"
            ? "#f87171"
            : isTrigger
              ? "#60a5fa"
              : "#f17463";

      return {
        ...edge,
        type: "smoothstep",
        animated: !compact,
        style: {
          stroke,
          strokeWidth: 2.4,
        },
      };
    });
  }, [compact, nodes, version]);
  const previewNodes = useMemo(() => buildPreviewLayout(nodes, edges), [edges, nodes]);

  if (!version) return null;

  return (
    <div
      className={cx(
        attached ? "rounded-b-2xl border border-t-0 p-3.5" : "rounded-2xl border p-3.5",
        theme === "dark" ? "border-neutral-800 bg-black" : "border-neutral-200 bg-white",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div
          className={cx(
            "text-[11px] font-medium uppercase tracking-[0.18em]",
            theme === "dark" ? "text-neutral-400" : "text-neutral-500",
          )}
        >
          {title}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className={cx(
            "flex h-7 w-7 items-center justify-center rounded-lg border transition",
            theme === "dark"
              ? "border-neutral-800 bg-[#101010] text-neutral-300 hover:border-neutral-700"
              : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300",
          )}
          aria-label="Expand workflow preview"
        >
          <Expand className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-2 text-[10px]">
        <span className={cx("rounded-full px-2 py-1", theme === "dark" ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-600")}>
          {version.response.plan.nodes.length} nodes
        </span>
        <span className={cx("rounded-full px-2 py-1", theme === "dark" ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-600")}>
          {version.response.validation.branchCount} branches
        </span>
        <span className={cx("rounded-full px-2 py-1", version.response.validation.canOpenInBuilder ? "bg-emerald-500/12 text-emerald-400" : "bg-amber-500/12 text-amber-400")}>
          {version.response.validation.canOpenInBuilder ? "Builder ready" : "Needs review"}
        </span>
      </div>
      <div
        className={cx(
          compact ? "h-37 overflow-hidden rounded-2xl border" : "h-56 overflow-hidden rounded-2xl border",
          theme === "dark" ? "border-neutral-800 bg-[#121212]" : "border-neutral-200 bg-[#f5f7fa]",
        )}
      >
        <ReactFlow
          nodeTypes={aiPreviewNodeTypes as any}
          nodes={previewNodes.map((node) => ({ ...node, id: node.nodeId }))}
          edges={edges}
          fitView
          minZoom={compact ? 0.38 : 0.28}
          maxZoom={1.4}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          zoomOnScroll={false}
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
      <div className={cx("mt-3 text-xs leading-6", theme === "dark" ? "text-neutral-400" : "text-neutral-500")}>
        {version.response.plan.summary}
      </div>
      <div className={cx("mt-2 text-[11px]", theme === "dark" ? "text-neutral-500" : "text-neutral-500")}>
        {new Date(version.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </div>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              className={cx(
                "w-full max-w-6xl rounded-[28px] border p-5 shadow-2xl",
                theme === "dark" ? "border-neutral-800 bg-[#090909]" : "border-neutral-200 bg-white",
              )}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className={cx("text-lg font-semibold", theme === "dark" ? "text-neutral-100" : "text-neutral-900")}>
                    {version.response.plan.workflowName}
                  </div>
                  <div className={cx("mt-1 text-sm", theme === "dark" ? "text-neutral-400" : "text-neutral-500")}>
                    Full workflow preview
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                    theme === "dark"
                      ? "border-neutral-800 bg-[#121212] text-neutral-300 hover:border-neutral-700"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                  )}
                  aria-label="Close workflow preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={cx("h-[72vh] overflow-hidden rounded-[24px] border", theme === "dark" ? "border-neutral-800 bg-[#111111]" : "border-neutral-200 bg-[#f5f7fa]")}>
                <ReactFlow
                  nodeTypes={aiPreviewNodeTypes as any}
                  nodes={previewNodes.map((node) => ({ ...node, id: node.nodeId }))}
                  edges={edges}
                  fitView
                  minZoom={0.2}
                  maxZoom={1.6}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  zoomOnDoubleClick={false}
                  panOnDrag={false}
                  zoomOnScroll={false}
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
