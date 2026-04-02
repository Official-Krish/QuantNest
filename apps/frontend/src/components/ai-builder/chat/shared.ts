import type { EdgeType, NodeType } from "@quantnest-trading/types";
import type {
  AiStrategyBuilderRequest,
  AiStrategyDraftSummary,
  AiStrategyWorkflowVersion,
} from "@/types/api";
import {
  AI_ALLOWED_NODE_TYPES,
} from "@/components/ai-builder/constants";

export type LocalTheme = "dark" | "light";

export const LAST_CHAT_DRAFT_STORAGE_KEY = "ai-builder-chat-last-draft-id";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function toRequestPayload(input: {
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

export function buildPreviewLayout(nodes: NodeType[], edges: EdgeType[]) {
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

export type SessionRowProps = {
  item: AiStrategyDraftSummary;
  active: boolean;
  theme: LocalTheme;
  onClick: () => void;
  onDelete: () => void;
};

export type WorkflowCanvasCardProps = {
  version: AiStrategyWorkflowVersion | null;
  theme: LocalTheme;
  compact?: boolean;
  title?: string;
  attached?: boolean;
};
