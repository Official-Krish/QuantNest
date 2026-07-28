import { useState } from "react";
import { CheckCircle2, XCircle, Clock3, ShieldAlert } from "lucide-react";
import type { ApprovalRequestSummary } from "@/http";

interface ApprovalCardProps {
  approval: ApprovalRequestSummary;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const statusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; style: string }
> = {
  pending: {
    icon: <Clock3 className="h-3.5 w-3.5" />,
    label: "Pending",
    style: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  approved: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Approved",
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  rejected: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Rejected",
    style: "border-red-500/30 bg-red-500/10 text-red-300",
  },
  expired: {
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    label: "Expired",
    style: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  },
};

export const ApprovalCard = ({
  approval,
  onApprove,
  onReject,
}: ApprovalCardProps) => {
  const [acting, setActing] = useState(false);
  const status = statusConfig[approval.status] ?? statusConfig.expired;

  const handleApprove = async () => {
    setActing(true);
    try {
      await onApprove(approval.id);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await onReject(approval.id);
    } finally {
      setActing(false);
    }
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b10] px-5 py-4 transition-all duration-200 hover:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.style}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          <p className="text-sm font-medium text-white">
            <span className="text-zinc-500">Workflow name: </span>
            {approval.workflowName || approval.workflowId}
          </p>

          {approval.prompt && (
            <div className="rounded-lg border border-white/6 bg-[#080a0c] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Approval prompt
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                {typeof approval.prompt === "string"
                  ? approval.prompt
                  : JSON.stringify(approval.prompt)}
              </p>
            </div>
          )}

          {approval.proposedAction && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                Proposed action
              </p>
              <pre className="mt-1 max-h-32 overflow-auto text-[11px] text-amber-100/80">
                {typeof approval.proposedAction === "string"
                  ? approval.proposedAction
                  : JSON.stringify(approval.proposedAction, null, 2)}
              </pre>
            </div>
          )}
          {approval.proposedAction === null && (
            <div className="rounded-lg border border-white/6 bg-[#080a0c] px-3 py-2">
              <p className="text-xs text-zinc-500">No action data available</p>
            </div>
          )}

          <p className="text-[11px] text-zinc-600">
            Created {new Date(approval.createdAt).toLocaleString()}
          </p>
        </div>

        {approval.status === "pending" && (
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={acting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={acting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
