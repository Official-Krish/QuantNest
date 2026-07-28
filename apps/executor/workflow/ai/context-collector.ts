import type { NodeMetadata } from "@quantnest-trading/types";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";

export interface CollectedContext {
  prompt: string;
  upstreamData: Record<string, unknown>;
}

export function collectUpstreamContext(params: {
  nodeId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
}): CollectedContext {
  const { nodeId, nodes, edges, context } = params;

  const visited = new Set<string>();
  const upstreamNodeIds = new Set<string>();

  function walkUp(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const incomingEdges = edges.filter((e) => e.target === currentId);
    for (const edge of incomingEdges) {
      upstreamNodeIds.add(edge.source);
      walkUp(edge.source);
    }
  }

  walkUp(nodeId);

  const upstreamData: Record<string, unknown> = {};
  const fragments: string[] = [];

  for (const upstreamId of upstreamNodeIds) {
    const upstreamNode = nodes.find((n) => n.id === upstreamId);
    if (!upstreamNode || !upstreamNode.data?.metadata) continue;

    const meta = upstreamNode.data.metadata as NodeMetadata &
      Record<string, unknown>;
    upstreamData[upstreamNode.nodeId] = meta;

    const title = upstreamNode.type ?? "unknown";
    fragments.push(`[${title}]: ${JSON.stringify(meta)}`);
  }

  fragments.push(`[Trigger Context]: ${JSON.stringify(context.details ?? {})}`);

  return {
    prompt: fragments.join("\n\n"),
    upstreamData,
  };
}
