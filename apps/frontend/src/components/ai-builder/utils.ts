import type { AiStrategyBuilderResponse } from "@/types/api";
import type { AiMetadataOverrides } from "./types";

export function normalizeGeneratedNodes(
  plan: AiStrategyBuilderResponse["plan"],
  metadataOverrides: AiMetadataOverrides = {},
) {
  return plan.nodes.map((node) => {
    const normalizedType = String(node.type).toLowerCase();

    return {
      id: node.nodeId,
      nodeId: node.nodeId,
      type: normalizedType === "price" ? "price-trigger" : normalizedType,
      data: {
        kind: node.data.kind,
        metadata: {
          ...node.data.metadata,
          ...(metadataOverrides[node.nodeId] || {}),
        },
      },
      position: node.position,
    };
  });
}
