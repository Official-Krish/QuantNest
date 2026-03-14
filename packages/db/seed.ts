import mongoose from "mongoose";
import { WorkflowExampleModel } from "./index";

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
  sortOrder: number;
};

export const WORKFLOW_EXAMPLE_SEEDS: WorkflowExampleSeed[] = [
  {
    slug: "rsi-volume-reversal-alert",
    title: "RSI Reversal Alert With AI Reasoning",
    summary:
      "Watch for short-term oversold conditions with volume confirmation, then send a structured AI-backed alert to Gmail or Discord.",
    category: "Alerts",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 8,
    sortOrder: 1,
    nodeFlow: ["Timer", "Conditional", "Gmail"],
    trigger: "Runs every 5 minutes during market hours.",
    logic:
      "RSI(14) below 30 on 5m plus volume spike above average. Optional higher-timeframe EMA alignment improves quality.",
    actions: ["Send Gmail alert", "Send Discord alert", "Attach AI reasoning"],
    outcomes: [
      "Fast pullback awareness",
      "Cleaner signal context for non-screen time",
      "Reduced false positives with volume confirmation",
    ],
  },
  {
    slug: "zerodha-breakout-execution",
    title: "Zerodha Breakout Execution With Conditional Branching",
    summary:
      "A momentum workflow that branches into true/false paths before placing a Zerodha buy order and logging the outcome.",
    category: "Execution",
    market: "Indian",
    difficulty: "Advanced",
    setupMinutes: 15,
    sortOrder: 2,
    nodeFlow: ["Price Trigger", "Conditional", "Zerodha", "Notion"],
    trigger: "Fires when price breaks above a key intraday level.",
    logic:
      "Conditional branch checks follow-through metrics like EMA slope, RSI confirmation, or breakout volume before executing.",
    actions: ["Place Zerodha order", "Create trade note in Notion", "Notify on failed branch"],
    outcomes: [
      "Fewer low-quality breakouts",
      "Structured branch-based risk gating",
      "Automatic post-trade documentation",
    ],
  },
  {
    slug: "daily-performance-report",
    title: "Daily Performance Report To Notion",
    summary:
      "Generate an end-of-day report for Zerodha-connected workflows with AI commentary, trade review, and structured journal output.",
    category: "Reporting",
    market: "Indian",
    difficulty: "Intermediate",
    setupMinutes: 12,
    sortOrder: 3,
    nodeFlow: ["Timer", "Zerodha", "Notion"],
    trigger: "Runs once after market close.",
    logic:
      "Collects daily trade activity, summarizes wins and mistakes, and produces a clean AI-assisted report inside Notion.",
    actions: ["Fetch trade history", "Generate AI review", "Create Notion report page"],
    outcomes: [
      "Daily trade journaling without manual effort",
      "Consistent review discipline",
      "Historical performance visibility",
    ],
  },
  {
    slug: "drive-csv-export",
    title: "Daily Google Drive Trade Export",
    summary:
      "Export today’s trades to CSV, enrich them with AI observations, and push the file to a configured Google Drive folder.",
    category: "AI",
    market: "Cross-market",
    difficulty: "Intermediate",
    setupMinutes: 10,
    sortOrder: 4,
    nodeFlow: ["Timer", "Zerodha", "Google Drive"],
    trigger: "Runs once daily after the reporting window opens.",
    logic:
      "Collects the day’s fills, appends AI confidence and improvement notes, and uploads a timestamped CSV.",
    actions: ["Build CSV", "Attach AI insights", "Upload to Google Drive"],
    outcomes: [
      "Portable daily records",
      "Ops-friendly archive format",
      "Shared review data for teams",
    ],
  },
];

export async function seedWorkflowExamples() {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/myapp";

  await mongoose.connect(mongoUrl);

  try {
    await WorkflowExampleModel.bulkWrite(
      WORKFLOW_EXAMPLE_SEEDS.map((example) => ({
        updateOne: {
          filter: { slug: example.slug },
          update: { $set: example },
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
