import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetExecution, apiGetMarketStatus, apiGetWorkflow, apiGetZerodhaTokenStatus } from "@/http";
import { ExecutionBrokerStatus } from "./executions/ExecutionBrokerStatus";
import { ExecutionHistory } from "./executions/ExecutionHistory";
import { ExecutionsHeader } from "./executions/ExecutionsHeader";
import { ExecutionMetrics } from "./executions/ExecutionMetrics";
import type { Execution, ExecutionStatusFilter } from "./executions/types";
import {
  calculateDuration,
  computeMetrics,
  filterExecutions,
  formatDate,
  sortExecutionsByStartTime,
} from "./executions/utils";

export const Executions = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();

  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflowName, setWorkflowName] = useState("Workflow");
  const [loading, setLoading] = useState(true);
  const [hasZerodha, setHasZerodha] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatusFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");

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
    () => filterExecutions(sortedExecutions, statusFilter, searchTerm),
    [sortedExecutions, statusFilter, searchTerm],
  );

  const metrics = useMemo(() => computeMetrics(executions), [executions]);

  const avgDurationLabel =
    metrics.avgDurationMs > 0
      ? calculateDuration(new Date(0).toISOString(), new Date(metrics.avgDurationMs).toISOString())
      : "0s";

  const openWorkflow = () => navigate(`/workflow/${workflowId}`);

  return (
    <div className="min-h-screen w-full bg-black px-6 pb-10 pt-24 text-white md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <ExecutionsHeader
          workflowName={workflowName}
          hasZerodha={hasZerodha}
          onBack={() => navigate("/dashboard")}
          onRefresh={() => void fetchData()}
          onOpenWorkflow={openWorkflow}
        />

        <ExecutionBrokerStatus
          hasZerodha={hasZerodha}
          tokenStatus={tokenStatus}
          marketStatus={marketStatus}
        />

        <ExecutionMetrics
          loading={loading}
          metrics={metrics}
          avgDurationLabel={avgDurationLabel}
        />

        <ExecutionHistory
          loading={loading}
          executions={filteredExecutions}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          onStatusFilterChange={setStatusFilter}
          onSearchTermChange={setSearchTerm}
          formatDate={formatDate}
          calculateDuration={calculateDuration}
        />
      </div>
    </div>
  );
};

export default Executions;
