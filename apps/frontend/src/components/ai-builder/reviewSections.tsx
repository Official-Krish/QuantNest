import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import type { EdgeType, NodeType } from "@quantnest-trading/types";
import type { AiStrategyBuilderResponse, AiStrategyDraftSession } from "@/types/api";
import { AI_EMPTY_STATE_EXAMPLES, AI_EMPTY_STATE_TIPS } from "./constants";
import { aiPreviewNodeTypes } from "./previewNodeTypes";
import { normalizeGeneratedNodes } from "./utils";

function getResponse(result: AiStrategyBuilderResponse | AiStrategyDraftSession) {
  return "response" in result ? result.response : result;
}

export function LoadingState() {
  const steps = ["Interpreting strategy", "Building workflow graph", "Validating node structure"];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#f17463]">Generating plan</p>
        <p className="mt-2 text-sm text-neutral-400">
          AI is drafting the workflow and checking whether the graph is valid before it is shown here.
        </p>
        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#f17463]" style={{ animationDelay: `${index * 150}ms` }} />
              <div className="flex-1">
                <div className="text-sm text-neutral-200">{step}</div>
                <div className="mt-2 h-2 w-4/5 rounded-full bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-black p-4">
        <div className="h-4 w-28 rounded-full bg-neutral-800" />
        <div className="mt-4 h-40 rounded-xl border border-neutral-800 bg-neutral-950" />
      </div>
    </div>
  );
}

export function EmptyReviewState() {
  return (
    <div className="mt-3 space-y-5">
      <div className="rounded-2xl border border-neutral-800 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#f17463]">What happens here</p>
        <p className="mt-2 text-sm text-neutral-400">
          After generation, this panel will show the workflow summary, missing inputs, warnings, and a visual preview of the generated flow.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoBox text="Graph preview" />
          <InfoBox text="Missing credentials" />
          <InfoBox text="Warnings and assumptions" />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-200">Example prompts</p>
        <div className="mt-2 space-y-2">
          {AI_EMPTY_STATE_EXAMPLES.map((example) => (
            <div key={example} className="rounded-xl border border-neutral-800 bg-black px-3 py-3 text-sm text-neutral-400">
              {example}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-200">Prompt tips</p>
        <ul className="mt-2 space-y-2 text-sm text-neutral-400">
          {AI_EMPTY_STATE_TIPS.map((tip) => (
            <li key={tip} className="rounded-xl border border-neutral-800 bg-black px-3 py-3">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfoBox({ text }: { text: string }) {
  return <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-xs text-neutral-400">{text}</div>;
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

  const queue = nodes.filter((node) => (incomingCount.get(node.nodeId) || 0) === 0).map((node) => node.nodeId);
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
  const xGap = 340;
  const yGap = 190;

  for (const [level, laneNodes] of [...lanes.entries()].sort((a, b) => a[0] - b[0])) {
    const totalHeight = (laneNodes.length - 1) * yGap;
    laneNodes.forEach((nodeId, index) => {
      positioned.set(nodeId, {
        x: level * xGap,
        y: index * yGap - totalHeight / 2,
      });
    });
  }

  return nodes.map((node) => ({
    ...node,
    position: positioned.get(node.nodeId) || node.position,
  }));
}

export function WorkflowPreview({ result }: { result: AiStrategyBuilderResponse | AiStrategyDraftSession }) {
  const response = getResponse(result);
  const nodes = normalizeGeneratedNodes(response.plan) as NodeType[];
  const edges = response.plan.edges as EdgeType[];
  const previewNodes = useMemo(() => buildPreviewLayout(nodes, edges), [edges, nodes]);

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
      <ReactFlow
        nodeTypes={aiPreviewNodeTypes as any}
        nodes={previewNodes.map((node) => ({ ...node, id: node.nodeId }))}
        edges={edges}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.72 }}
        fitViewOptions={{ padding: 0.22, minZoom: 0.42, maxZoom: 1.05 }}
        minZoom={0.38}
        maxZoom={1.4}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        zoomOnPinch
        zoomOnScroll
        panOnDrag
        panOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1.5} color="#262626" variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}

export function GeneratedSummary({ result }: { result: AiStrategyBuilderResponse | AiStrategyDraftSession }) {
  const response = getResponse(result);
  const draftMeta = "draftId" in result ? result : null;
  return (
    <div className="mt-3 rounded-2xl border border-neutral-800 bg-black p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#f17463]">Generated by</p>
      <p className="mt-2 text-sm text-neutral-200">
        {response.provider} / {response.model}
      </p>
      <h2 className="mt-4 text-xl font-semibold text-white">{response.plan.workflowName}</h2>
      <p className="mt-2 text-sm text-neutral-400">{response.plan.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-400">
        <span className="rounded-full border border-neutral-800 px-3 py-1">{response.plan.marketType}</span>
        <span className="rounded-full border border-neutral-800 px-3 py-1">{response.plan.nodes.length} nodes</span>
        <span className="rounded-full border border-neutral-800 px-3 py-1">{response.plan.edges.length} edges</span>
        <span className="rounded-full border border-neutral-800 px-3 py-1">{response.validation.triggerCount} triggers</span>
        <span className="rounded-full border border-neutral-800 px-3 py-1">{response.validation.branchCount} branches</span>
        {draftMeta ? <span className="rounded-full border border-neutral-800 px-3 py-1">Draft {draftMeta.status}</span> : null}
      </div>
    </div>
  );
}

export function MissingInputsSection({ result }: { result: AiStrategyBuilderResponse | AiStrategyDraftSession }) {
  const response = getResponse(result);
  return (
    <div>
      <p className="text-sm font-medium text-neutral-200">Missing inputs</p>
      <div className="mt-2 space-y-2">
        {response.plan.missingInputs.length === 0 ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
            No missing inputs returned. You can open this in the builder directly.
          </p>
        ) : (
          response.plan.missingInputs.map((input) => (
            <div key={`${input.nodeId}-${input.field}`} className="rounded-xl border border-neutral-800 bg-black px-3 py-3 text-sm text-neutral-300">
              <p className="font-medium text-white">{input.label}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {input.nodeType} · {input.reason}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function WarningsSection({ result }: { result: AiStrategyBuilderResponse | AiStrategyDraftSession }) {
  const response = getResponse(result);
  return (
    <div>
      <p className="text-sm font-medium text-neutral-200">Warnings</p>
      <div className="mt-2 space-y-2">
        {response.plan.warnings.length === 0 && response.validation.issues.filter((issue) => issue.severity === "warning").length === 0 ? (
          <p className="text-sm text-neutral-500">No warnings returned.</p>
        ) : (
          [
            ...response.plan.warnings.map((warning) => ({
              key: `${warning.code}-${warning.message}`,
              code: warning.code,
              message: warning.message,
            })),
            ...response.validation.issues
              .filter((issue) => issue.severity === "warning")
              .map((issue) => ({
                key: `${issue.code}-${issue.message}-${issue.nodeId || ""}`,
                code: issue.code,
                message: issue.message,
              })),
          ].map((warning) => (
            <div key={warning.key} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <span className="font-medium">{warning.code}</span>: {warning.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AssumptionsSection({ result }: { result: AiStrategyBuilderResponse | AiStrategyDraftSession }) {
  const response = getResponse(result);
  return (
    <div>
      <p className="text-sm font-medium text-neutral-200">Assumptions</p>
      <ul className="mt-2 space-y-2 text-sm text-neutral-400">
        {response.plan.assumptions.map((assumption) => (
          <li key={assumption} className="rounded-xl border border-neutral-800 bg-black px-3 py-2">
            {assumption}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValidationSection({ result }: { result: AiStrategyBuilderResponse | AiStrategyDraftSession }) {
  const response = getResponse(result);
  const errors = response.validation.issues.filter((issue) => issue.severity === "error");

  return (
    <div>
      <p className="text-sm font-medium text-neutral-200">Validation</p>
      <div className="mt-2 space-y-2">
        {errors.length === 0 ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
            Draft passed blocking validation checks.
          </p>
        ) : (
          errors.map((issue) => (
            <div key={`${issue.code}-${issue.message}-${issue.nodeId || ""}`} className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <span className="font-medium">{issue.code}</span>: {issue.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
