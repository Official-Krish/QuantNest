import type { WorkflowExample } from "@/types/api";

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

export function ExampleWorkflowGraph({ example }: { example: WorkflowExample }) {
  const maxX = Math.max(
    ...example.nodes.map((node) => node.position.x + NODE_SIZE.width),
    NODE_SIZE.width,
  );
  const maxY = Math.max(
    ...example.nodes.map((node) => node.position.y + NODE_SIZE.height),
    NODE_SIZE.height,
  );
  const width = maxX + 80;
  const height = maxY + 60;

  return (
    <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-neutral-800 bg-black/40 p-4">
      <div className="relative min-w-[720px]" style={{ width, height }}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${width} ${height}`}
        >
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
                stroke={
                  edge.sourceHandle === "false"
                    ? "#f87171"
                    : edge.sourceHandle === "true"
                      ? "#34d399"
                      : "#737373"
                }
                strokeLinecap="round"
                strokeWidth="2.5"
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
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${getNodeAccent(node.type)}`}
                >
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
