import { getNodeRegistryEntry } from "@quantnest-trading/node-registry";
import type { WorkflowExampleSeed } from "../seed.ts";

export function assertWorkflowExampleSeeds(seeds: WorkflowExampleSeed[]) {
  for (const example of seeds) {
    const nodeIds = new Set<string>();

    for (const node of example.nodes) {
      if (nodeIds.has(node.nodeId)) {
        throw new Error(
          `Workflow example "${example.slug}" has duplicate nodeId "${node.nodeId}".`,
        );
      }

      nodeIds.add(node.nodeId);

      const registryEntry = getNodeRegistryEntry(node.type);
      if (!registryEntry) {
        throw new Error(
          `Workflow example "${example.slug}" uses unsupported node type "${node.type}".`,
        );
      }

      if (registryEntry.kind !== node.data.kind) {
        throw new Error(
          `Workflow example "${example.slug}" uses node "${node.nodeId}" as kind "${node.data.kind}", but registry defines "${registryEntry.kind}".`,
        );
      }
    }

    for (const edge of example.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(
          `Workflow example "${example.slug}" has edge "${edge.id}" with missing source "${edge.source}".`,
        );
      }

      if (!nodeIds.has(edge.target)) {
        throw new Error(
          `Workflow example "${example.slug}" has edge "${edge.id}" with missing target "${edge.target}".`,
        );
      }
    }
  }
}
