import mongoose from "mongoose";
import { WorkflowExampleModel } from "./index";
import { alertExampleSeeds } from "./seed/examples/alerts";
import { flowControlExampleSeeds } from "./seed/examples/flow-control";
import { reportingExampleSeeds } from "./seed/examples/reporting";
import { tradingExampleSeeds } from "./seed/examples/trading";
import { assertWorkflowExampleSeeds } from "./seed/validators";

type WorkflowExampleNode = {
  nodeId: string;
  type: string;
  data: {
    kind: "action" | "trigger";
    metadata: Record<string, unknown>;
  };
  position: { x: number; y: number };
};

type WorkflowExampleEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type WorkflowExampleSeed = {
  slug: string;
  title: string;
  summary: string;
  category: "Execution" | "Reporting" | "Alerts" | "AI";
  market: "Indian" | "Crypto" | "Cross-market";
  difficulty: "Starter" | "Intermediate" | "Advanced";
  setupMinutes: number;
  nodeFlow: string[];
  trigger: string;
  logic: string;
  actions: string[];
  outcomes: string[];
  nodes: WorkflowExampleNode[];
  edges: WorkflowExampleEdge[];
  sortOrder: number;
};

export const WORKFLOW_EXAMPLE_SEEDS: WorkflowExampleSeed[] = [
  ...tradingExampleSeeds,
  ...alertExampleSeeds,
  ...reportingExampleSeeds,
  ...flowControlExampleSeeds,
];

assertWorkflowExampleSeeds(WORKFLOW_EXAMPLE_SEEDS);

export async function seedWorkflowExamples() {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/myapp";

  await mongoose.connect(mongoUrl);

  try {
    await WorkflowExampleModel.bulkWrite(
      WORKFLOW_EXAMPLE_SEEDS.map((example) => ({
        updateOne: {
          filter: { slug: example.slug },
          update: { $set: example } as any,
          upsert: true,
        },
      })),
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.main) {
  seedWorkflowExamples()
    .then(() => {
      console.log(`Seeded ${WORKFLOW_EXAMPLE_SEEDS.length} workflow examples.`);
    })
    .catch((error) => {
      console.error("Failed to seed workflow examples:", error);
      process.exit(1);
    });
}
