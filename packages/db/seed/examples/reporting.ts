import type { WorkflowExampleSeed } from "../../seed.ts";

export const reportingExampleSeeds: WorkflowExampleSeed[] = [
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
    nodes: [
      {
        nodeId: "timer-2",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 86400, marketType: "indian", asset: "HDFC" },
        },
        position: { x: 0, y: 80 },
      },
      {
        nodeId: "zerodha-2",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "sell",
            qty: 1,
            symbol: "HDFC",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 300, y: 80 },
      },
      {
        nodeId: "notion-2",
        type: "notion-daily-report",
        data: {
          kind: "action",
          metadata: {
            notionApiKey: "secret_demo_key",
            parentPageId: "demo-parent-page-id",
            aiConsent: true,
          },
        },
        position: { x: 620, y: 80 },
      },
    ],
    edges: [
      { id: "e-timer-zerodha-2", source: "timer-2", target: "zerodha-2" },
      { id: "e-zerodha-notion-2", source: "zerodha-2", target: "notion-2" },
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
    nodes: [
      {
        nodeId: "timer-3",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 86400, marketType: "indian", asset: "CDSL" },
        },
        position: { x: 0, y: 80 },
      },
      {
        nodeId: "zerodha-3",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "sell",
            qty: 1,
            symbol: "CDSL",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 300, y: 80 },
      },
      {
        nodeId: "drive-1",
        type: "google-drive-daily-csv",
        data: {
          kind: "action",
          metadata: {
            googleClientEmail: "quantnest-bot@demo.iam.gserviceaccount.com",
            googlePrivateKey:
              "-----BEGIN PRIVATE KEY-----demo-----END PRIVATE KEY-----",
            googleDriveFolderId: "drive-folder-id",
            filePrefix: "quantnest-daily",
            aiConsent: true,
          },
        },
        position: { x: 640, y: 80 },
      },
    ],
    edges: [
      { id: "e-timer-zerodha-3", source: "timer-3", target: "zerodha-3" },
      { id: "e-zerodha-drive-1", source: "zerodha-3", target: "drive-1" },
    ],
  },
  {
    slug: "google-sheets-execution-report",
    title: "Google Sheets Execution Report",
    summary:
      "Append each run summary to Google Sheets so teams can review execution activity in one shared sheet.",
    category: "Reporting",
    market: "Indian",
    difficulty: "Starter",
    setupMinutes: 6,
    sortOrder: 9,
    nodeFlow: ["Timer", "Zerodha", "Google Sheets Report"],
    trigger: "Runs on a fixed interval and writes a reporting row after execution.",
    logic:
      "Timer starts the workflow, Zerodha action executes, and Google Sheets Report appends execution context to the configured spreadsheet tab.",
    actions: ["Execute Zerodha action", "Append row to Google Sheets"],
    outcomes: [
      "Shared live reporting sheet",
      "Low-friction daily monitoring",
      "No manual copy-paste logging",
    ],
    nodes: [
      {
        nodeId: "timer-gs-1",
        type: "timer",
        data: {
          kind: "trigger",
          metadata: { time: 900, marketType: "indian", asset: "HDFC" },
        },
        position: { x: 0, y: 90 },
      },
      {
        nodeId: "zerodha-gs-1",
        type: "zerodha",
        data: {
          kind: "action",
          metadata: {
            type: "buy",
            qty: 1,
            symbol: "HDFC",
            apiKey: "ZERODHA_API_KEY",
            accessToken: "ZERODHA_ACCESS_TOKEN",
            exchange: "NSE",
          },
        },
        position: { x: 320, y: 90 },
      },
      {
        nodeId: "sheets-1",
        type: "google-sheets-report",
        data: {
          kind: "action",
          metadata: {
            sheetUrl: "https://docs.google.com/spreadsheets/d/1exampleSheetId1234567890abcdef/edit?gid=0#gid=0",
            sheetName: "Execution Logs",
            serviceAccountEmail: "quantnest@your-project.iam.gserviceaccount.com",
          },
        },
        position: { x: 680, y: 90 },
      },
    ],
    edges: [
      { id: "e-timer-gs-1-zerodha-gs-1", source: "timer-gs-1", target: "zerodha-gs-1" },
      { id: "e-zerodha-gs-1-sheets-1", source: "zerodha-gs-1", target: "sheets-1" },
    ],
  },
];
