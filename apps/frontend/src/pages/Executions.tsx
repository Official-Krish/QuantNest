import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiGetExecution,
  apiGetMarketStatus,
  apiGetWorkflow,
  apiGetZerodhaTokenStatus,
  apiUpdateWorkflowStatus,
} from "@/http";
import { ExecutionHistory } from "../components/executions/ExecutionHistory";
import { ExecutionHealthSidebar } from "../components/executions/ExecutionHealthSidebar";
import { ExecutionsPageHeader } from "../components/executions/ExecutionsPageHeader";
import type { Execution, ExecutionStatusFilter } from "../components/executions/types";
import {
  calculateDuration,
  computeMetrics,
  filterExecutions,
  formatDate,
  sortExecutionsByStartTime,
} from "../components/executions/utils";
import { AppBackground } from "@/components/background";

export const Executions = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();

  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflowName, setWorkflowName] = useState("Workflow");
  const [workflowStatus, setWorkflowStatus] = useState<"active" | "paused">("active");
  const [loading, setLoading] = useState(true);
  const [hasZerodha, setHasZerodha] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatusFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isUpdatingWorkflowStatus, setIsUpdatingWorkflowStatus] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!workflowId) return;

      const [executionsData, workflowData] = await Promise.all([
        apiGetExecution(workflowId),
        apiGetWorkflow(workflowId),
      ]);

      setExecutions(executionsData.executions || []);
      setWorkflowName(workflowData.workflowName || "Workflow");
      setWorkflowStatus(workflowData.status || "active");

      const hasZerodhaNode = workflowData.nodes?.some(
        (node: any) => node.type?.toLowerCase() === "zerodha",
      );
      setHasZerodha(hasZerodhaNode);

      if (hasZerodhaNode) {
        try {
          const [tokenRes, marketRes] = await Promise.all([
            apiGetZerodhaTokenStatus(workflowId),
            apiGetMarketStatus(),
          ]);
          setTokenStatus(tokenRes.tokenStatus);
          setMarketStatus(marketRes.marketStatus);
        } catch (error) {
          console.error("Failed to fetch status:", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const sortedExecutions = useMemo(
    () => sortExecutionsByStartTime(executions),
    [executions],
  );

  const filteredExecutions = useMemo(
    () => {
      const byDate = sortedExecutions.filter((execution) => {
        if (!dateFrom && !dateTo) return true;

        const executionTime = new Date(execution.startTime).getTime();
        const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
        const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

        if (fromTime && executionTime < fromTime) return false;
        if (toTime && executionTime > toTime) return false;
        return true;
      });

      return filterExecutions(byDate, statusFilter, searchTerm);
    },
    [dateFrom, dateTo, searchTerm, sortedExecutions, statusFilter],
  );

  const metrics = useMemo(() => computeMetrics(executions), [executions]);

  const avgDurationLabel =
    metrics.avgDurationMs > 0
      ? calculateDuration(new Date(0).toISOString(), new Date(metrics.avgDurationMs).toISOString())
      : "0s";

  const lastExecutionLabel = useMemo(() => {
    if (sortedExecutions.length === 0) return "No runs yet";

    const latestExecution = sortedExecutions[0];
    const diffMs = Date.now() - new Date(latestExecution.startTime).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }, [sortedExecutions]);

  const openWorkflow = () => navigate(`/workflow/${workflowId}`);

  const handleToggleWorkflowStatus = useCallback(async () => {
    if (!workflowId || isUpdatingWorkflowStatus) return;

    const nextStatus: "active" | "paused" = workflowStatus === "active" ? "paused" : "active";

    try {
      setIsUpdatingWorkflowStatus(true);
      const response = await apiUpdateWorkflowStatus(workflowId, nextStatus);
      setWorkflowStatus(response.workflow.status || nextStatus);
    } catch (error) {
      console.error("Failed to update workflow status:", error);
    } finally {
      setIsUpdatingWorkflowStatus(false);
    }
  }, [workflowId, workflowStatus, isUpdatingWorkflowStatus]);

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-black px-6 pb-10 pt-20 text-white md:px-10">
      <AppBackground />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <ExecutionsPageHeader
          workflowName={workflowName}
          onBack={() => navigate("/dashboard")}
          onRefresh={() => void fetchData()}
          onOpenWorkflow={openWorkflow}
        />

        <div className="grid items-start gap-6 lg:grid-cols-10">
          <div className="space-y-5 lg:col-span-7">
            <ExecutionHistory
              loading={loading}
              executions={filteredExecutions}
              statusFilter={statusFilter}
              searchTerm={searchTerm}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onStatusFilterChange={setStatusFilter}
              onSearchTermChange={setSearchTerm}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onTriggerNow={openWorkflow}
              formatDate={formatDate}
              calculateDuration={calculateDuration}
            />
          </div>

          <ExecutionHealthSidebar
            metrics={metrics}
            avgDurationLabel={avgDurationLabel}
            lastExecutionLabel={lastExecutionLabel}
            workflowStatus={workflowStatus}
            onToggleWorkflowStatus={handleToggleWorkflowStatus}
            isUpdatingWorkflowStatus={isUpdatingWorkflowStatus}
            hasZerodha={hasZerodha}
            tokenStatus={tokenStatus}
            marketStatus={marketStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default Executions;
