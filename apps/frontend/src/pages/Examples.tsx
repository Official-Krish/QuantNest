import { useEffect, useState } from "react";
import { apiGetExamples, hasAuthSession } from "@/http";
import type { WorkflowExample } from "@/types/api";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";

const NODE_SIZE = {
  width: 220,
  height: 96,
};

function getNodeAccent(type: string) {
  switch (type) {
    case "timer":
    case "price-trigger":
    case "conditional-trigger":
    case "price":
      return "text-[#f17463]";
    case "gmail":
      return "text-[#4285f4]";
    case "discord":
      return "text-indigo-300";
    case "zerodha":
    case "Zerodha":
      return "text-[#f17463]";
    case "notion-daily-report":
      return "text-[#7ecb89]";
    case "google-drive-daily-csv":
      return "text-[#8ab4f8]";
    default:
      return "text-neutral-300";
  }
}

function getNodeBadge(type: string, metadata: Record<string, any>) {
  switch (type) {
    case "timer":
      return `${(metadata.time || 0) / 60}m`;
    case "price-trigger":
    case "price":
      return metadata.asset || "PRICE";
    case "conditional-trigger":
      return metadata.expression?.conditions?.length
        ? `${metadata.expression.conditions.length} Groups`
        : "Logic";
    case "zerodha":
    case "Zerodha":
      return String(metadata.type || "TRADE").toUpperCase();
    case "gmail":
      return "EMAIL";
    case "discord":
      return "WEBHOOK";
    case "notion-daily-report":
      return "REPORT";
    case "google-drive-daily-csv":
      return "CSV";
    default:
      return "NODE";
  }
}

function getNodeTitle(type: string, metadata: Record<string, any>) {
  switch (type) {
    case "timer":
      return `Every ${(metadata.time || 0) / 60} minutes`;
    case "price-trigger":
    case "price":
      return `${metadata.asset || "-"} ${metadata.condition || "above"} ${metadata.targetPrice || 0}`;
    case "conditional-trigger":
      return "Conditional branch";
    case "zerodha":
    case "Zerodha":
      return `${metadata.qty || "-"} units on ${metadata.symbol || "-"}`;
    case "gmail":
      return metadata.recipientName || "Trader inbox";
    case "discord":
      return "Discord route";
    case "notion-daily-report":
      return "Daily AI report";
    case "google-drive-daily-csv":
      return "Daily trades export";
    default:
      return type;
  }
}

function getNodeDescription(type: string, metadata: Record<string, any>) {
  switch (type) {
    case "timer":
      return "Schedules downstream actions on this cadence.";
    case "price-trigger":
    case "price":
      return "Executes when price crosses this level.";
    case "conditional-trigger":
      return "True and false paths branch from this node.";
    case "zerodha":
    case "Zerodha":
      return "Broker execution node";
    case "gmail":
      return metadata.recipientEmail || "Email notification path";
    case "discord":
      return "Fallback alert path";
    case "notion-daily-report":
      return "Structured reporting output";
    case "google-drive-daily-csv":
      return metadata.filePrefix || "CSV archive output";
    default:
      return "";
  }
}

function ExampleWorkflowGraph({ example }: { example: WorkflowExample }) {
  const maxX = Math.max(...example.nodes.map((node) => node.position.x + NODE_SIZE.width), NODE_SIZE.width);
  const maxY = Math.max(...example.nodes.map((node) => node.position.y + NODE_SIZE.height), NODE_SIZE.height);
  const width = maxX + 80;
  const height = maxY + 60;

  return (
    <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-neutral-800 bg-black/40 p-4">
      <div
        className="relative min-w-[720px]"
        style={{ width, height }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
          {example.edges.map((edge) => {
            const sourceNode = example.nodes.find((node) => node.nodeId === edge.source);
            const targetNode = example.nodes.find((node) => node.nodeId === edge.target);

            if (!sourceNode || !targetNode) return null;

            const sourceX = sourceNode.position.x + NODE_SIZE.width;
            const sourceY =
              sourceNode.position.y +
              (edge.sourceHandle === "true"
                ? NODE_SIZE.height * 0.35
                : edge.sourceHandle === "false"
                ? NODE_SIZE.height * 0.65
                : NODE_SIZE.height / 2);
            const targetX = targetNode.position.x;
            const targetY = targetNode.position.y + NODE_SIZE.height / 2;
            const midX = sourceX + (targetX - sourceX) / 2;

            return (
              <path
                key={edge.id}
                d={`M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`}
                fill="none"
                stroke={edge.sourceHandle === "false" ? "#f87171" : edge.sourceHandle === "true" ? "#34d399" : "#737373"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {example.nodes.map((node) => {
          const metadata = (node.data?.metadata || {}) as Record<string, any>;

          return (
            <div
              key={node.nodeId}
              className="absolute w-[220px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
              style={{ left: node.position.x, top: node.position.y }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${getNodeAccent(node.type)}`}>
                  {String(node.type).replaceAll("-", " ")}
                </span>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                  {getNodeBadge(node.type, metadata)}
                </span>
              </div>
              <div className="mt-2 text-sm font-medium text-neutral-100">
                {getNodeTitle(node.type, metadata)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-400">
                {getNodeDescription(node.type, metadata)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Examples = () => {
  const [examples, setExamples] = useState<WorkflowExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExamples = async () => {
      try {
        const res = await apiGetExamples();
        setExamples(res.examples);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Could not load examples.");
      } finally {
        setLoading(false);
      }
    };

    void loadExamples();
  }, []);

  return (
    <div className="min-h-screen bg-black px-6 pb-16 pt-32 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950/80 p-8 md:p-10">
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#f17463]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#f17463]">
              Example workflows
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              Real workflow patterns you can adapt, not empty templates
            </h1>
            <p className="text-base leading-7 text-neutral-400 md:text-lg">
              These examples show how QuantNest can be used for alerts, execution,
              reporting, and AI-assisted review. Treat them as production-style
              starting points and adapt the trigger, logic, and action chain to your setup.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
              onClick={() => {
                window.location.href = hasAuthSession() ? "/create/onboarding" : "/signup";
              }}
            >
              Start from scratch
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-8 text-sm text-neutral-400">
            Loading example workflows...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-8 text-sm text-red-200">
            {error}
          </div>
        ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {examples.map((example) => (
            <article
              key={example.slug}
              className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#f17463]/30 bg-[#f17463]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#f4937d]">
                  {example.category}
                </span>
                <span className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                  {example.market}
                </span>
                <span className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                  {example.difficulty}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">
                  {example.title}
                </h2>
                <p className="text-sm leading-6 text-neutral-400">{example.summary}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-xs text-neutral-400">
                <div className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#f17463]" />
                  <span>{example.setupMinutes} min setup</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span>{example.nodeFlow.join(" -> ")}</span>
                </div>
              </div>

              <ExampleWorkflowGraph example={example} />

              <div className="mt-6 grid gap-4 rounded-2xl border border-neutral-800 bg-black/40 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Trigger
                  </p>
                  <p className="mt-1 text-sm text-neutral-300">{example.trigger}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Logic
                  </p>
                  <p className="mt-1 text-sm text-neutral-300">{example.logic}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Actions
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                    {example.actions.map((action) => (
                      <li key={action} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#f17463]" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Expected outcome
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                    {example.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
