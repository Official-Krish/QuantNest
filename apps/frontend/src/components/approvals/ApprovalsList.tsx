import { RefreshCw, ShieldAlert } from "lucide-react";
import type { ApprovalRequestSummary } from "@/http";
import { ApprovalCard } from "./ApprovalCard";
import { LoadingState } from "@/components/LoadingState";

interface ApprovalsListProps {
  loading: boolean;
  approvals: ApprovalRequestSummary[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export const ApprovalsList = ({
  loading,
  approvals,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onApprove,
  onReject,
}: ApprovalsListProps) => {
  const statusFilters = ["all", "pending", "approved", "rejected", "expired"];

  return (
    <section className="rounded-2xl border border-white/6 bg-[#0d0f13]">
      <div className="flex flex-col gap-4 border-b border-white/6 px-5 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
              Approval Requests
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Review and approve or reject AI-generated actions before they
              execute.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        <div className="inline-flex flex-nowrap gap-1.5 overflow-x-auto">
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusFilterChange(status)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize transition-all ${
                statusFilter === status
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/[0.07] bg-transparent text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading approvals…" height="md" />
      ) : approvals.length === 0 ? (
        <div className="flex min-h-80 items-center justify-center px-6 py-10">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/8">
              <ShieldAlert className="h-5 w-5 text-[#f17463]" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              No approvals found
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              When an AI node requires approval, pending requests will appear
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4 md:px-5">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </section>
  );
};
