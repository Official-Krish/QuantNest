import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiGetApprovals, apiApproveApproval, apiRejectApproval } from "@/http";
import type { ApprovalRequestSummary } from "@/http";
import { ApprovalsList } from "../components/approvals/ApprovalsList";
import { AppBackground } from "@/components/background";

export const Approvals = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<ApprovalRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await apiGetApprovals(params);
      setApprovals(data);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (id: string) => {
    await apiApproveApproval(id);
    await fetchApprovals();
  };

  const handleReject = async (id: string) => {
    await apiRejectApproval(id);
    await fetchApprovals();
  };

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-black px-6 pb-10 pt-20 text-white md:px-10">
      <AppBackground />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/8 p-1.5 text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Approvals</h1>
            <p className="text-xs text-zinc-500">
              Manage AI approval requests across workflows
            </p>
          </div>
        </div>

        <ApprovalsList
          loading={loading}
          approvals={approvals}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRefresh={() => void fetchApprovals()}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
};

export default Approvals;
