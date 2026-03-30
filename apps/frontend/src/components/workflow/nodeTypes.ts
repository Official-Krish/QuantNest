import { NODE_REGISTRY } from "@quantnest-trading/node-registry";
import { getBuilderNodeRenderer } from "./builderRegistry";

export const workflowNodeTypes = Object.fromEntries(
  NODE_REGISTRY
    .map((entry) => [entry.id, getBuilderNodeRenderer(entry.id)])
    .filter(([, renderer]) => Boolean(renderer)),
);
