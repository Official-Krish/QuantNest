import type { Execution, ExecutionMetrics } from "./types";

export function sortExecutionsByStartTime(executions: Execution[]): Execution[] {
  return [...executions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );
}

export function filterExecutions(
  executions: Execution[],
  statusFilter: "All" | "Success" | "Failed" | "InProgress",
  searchTerm: string,
): Execution[] {
  return executions.filter((execution) => {
    if (statusFilter !== "All" && execution.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;

    const q = searchTerm.toLowerCase();
    const inRun =
      execution._id.toLowerCase().includes(q) ||
      execution.status.toLowerCase().includes(q);
    const inSteps = (execution.steps || []).some(
      (step) =>
        step.message?.toLowerCase().includes(q) ||
        step.nodeType?.toLowerCase().includes(q) ||
        step.nodeId?.toLowerCase().includes(q),
    );
    return inRun || inSteps;
  });
}

export function calculateDurationMs(startTime: string, endTime?: string): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  return Math.max(0, end - start);
}

export function calculateDuration(startTime: string, endTime?: string): string {
  const seconds = Math.floor(calculateDurationMs(startTime, endTime) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function computeMetrics(executions: Execution[]): ExecutionMetrics {
  const successCount = executions.filter((e) => e.status === "Success").length;
  const failedCount = executions.filter((e) => e.status === "Failed").length;
  const inProgressCount = executions.filter((e) => e.status === "InProgress").length;
  const totalCount = executions.length;
  const successRate = totalCount === 0 ? 0 : Math.round((successCount / totalCount) * 100);
  const avgDurationMs =
    totalCount === 0
      ? 0
      : Math.round(
          executions.reduce((acc, execution) => {
            return acc + calculateDurationMs(execution.startTime, execution.endTime);
          }, 0) / totalCount,
        );

  return {
    successCount,
    failedCount,
    inProgressCount,
    totalCount,
    successRate,
    avgDurationMs,
  };
}

export function getStatusPillClass(status: string): string {
  switch (status) {
    case "Success":
      return "border-green-500/30 bg-green-500/10 text-green-300";
    case "Failed":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "InProgress":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    default:
      return "border-neutral-600 bg-neutral-800 text-neutral-300";
  }
}
