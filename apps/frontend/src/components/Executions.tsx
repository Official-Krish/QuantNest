import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, Hourglass, Clock } from "lucide-react";
import { apiGetExecution, apiGetWorkflow } from "@/http";

interface Execution {
  _id: string;
  workflowId: string;
  userId: string;
  status: string;
  message?: string;
  startTime: string;
  endTime?: string;
}

export const Executions = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflowName, setWorkflowName] = useState("Workflow");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (workflowId) {
          const [executionsData, workflowData] = await Promise.all([
            apiGetExecution(workflowId),
            apiGetWorkflow(workflowId),
          ]);
          setExecutions(executionsData.executions || []);
          setWorkflowName(workflowData.workflowName || "Workflow");
        }
      } catch (error) {
        console.error("Failed to fetch executions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workflowId]);

  const successCount = executions.filter((e) => e.status === "Success").length;
  const failedCount = executions.filter((e) => e.status === "Failed").length;
  const totalCount = executions.length;
  const successRate = totalCount === 0 ? 0 : Math.round((successCount / totalCount) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "Failed":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "InProgress":
        return <Hourglass className="h-4 w-4 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen w-full bg-black text-white px-6 pb-10 pt-24 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <section className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Workflow Executions
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {workflowName}
            </h1>
          </div>
        </section>

        {/* Stats Cards */}
        {!loading && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm p-5 transition-colors hover:border-neutral-600/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-2 w-2 rounded-full bg-neutral-500" />
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Total Executions</p>
              </div>
              <p className="text-3xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-neutral-500 mt-2">All-time total</p>
            </div>

            <div className="rounded-lg border border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm p-5 transition-colors hover:border-green-600/30">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Successful</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{successCount}</p>
              <p className="text-xs text-green-500/70 mt-2">{successRate}% success rate</p>
            </div>

            <div className="rounded-lg border border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm p-5 transition-colors hover:border-red-600/30">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Failed</p>
              </div>
              <p className="text-3xl font-bold text-red-400">{failedCount}</p>
              <p className="text-xs text-red-500/70 mt-2">{totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0}% failure rate</p>
            </div>

            <div className="rounded-lg border border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm p-5 transition-colors hover:border-neutral-600/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">Success Rate</p>
              </div>
              <p className="text-3xl font-bold text-white">{successRate}%</p>
              <div className="w-full h-1.5 bg-neutral-700/50 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Executions Table */}
        <section className="rounded-lg border border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-700/50">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">
              Recent Executions
            </h2>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex items-center gap-3 text-neutral-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
                <span className="text-sm">Loading executions…</span>
              </div>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-neutral-400">No executions yet</p>
            </div>
          ) : (
            <>
              {/* Column Headers */}
              <div className="grid grid-cols-6 gap-4 items-center px-6 py-3 bg-neutral-700/20 border-b border-neutral-700/50">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Status</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Message</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Started At</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Ended At</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Duration</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 text-right">Execution ID</span>
              </div>

              <div className="divide-y divide-neutral-700/50">
                {executions.map((execution) => (
                  <div
                    key={execution._id}
                    className="grid grid-cols-6 gap-4 items-center px-6 py-4 hover:bg-neutral-700/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <span className="text-sm font-medium text-neutral-200">
                        {execution.status}
                      </span>
                    </div>
                    <span className="text-sm text-neutral-400 truncate" title={execution.message || ""}>
                      {execution.message || "-"}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {formatDate(execution.startTime)}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {execution.endTime ? formatDate(execution.endTime) : "-"}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {calculateDuration(execution.startTime, execution.endTime)}
                    </span>
                    <div className="flex justify-end">
                      <span className="font-mono text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors truncate">
                        {execution._id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Executions;
