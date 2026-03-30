import type { AiStrategyBuilderResponse } from "@/types/api";
import type { AiMetadataOverrides } from "./types";
import { getNodeRegistryEntry } from "@quantnest-trading/node-registry";

export function normalizeGeneratedNodes(
  plan: AiStrategyBuilderResponse["plan"],
  metadataOverrides: AiMetadataOverrides = {},
) {
  return plan.nodes.map((node) => {
    const normalizedType = String(node.type).toLowerCase();
    const registryMatch = getNodeRegistryEntry(normalizedType);
    const canonicalType = registryMatch?.id || normalizedType;

    return {
      id: node.nodeId,
      nodeId: node.nodeId,
      type: canonicalType === "price" ? "price-trigger" : canonicalType,
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
