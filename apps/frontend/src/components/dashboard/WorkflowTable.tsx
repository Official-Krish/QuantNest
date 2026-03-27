import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUpdateWorkflowStatus } from "@/http";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronRight, Activity, Key, Trash2, Pause, Play } from "lucide-react";
import type { Workflow } from "@/types/api";
import { ZerodhaTokenDialog } from "./ZerodhaTokenDialog";
import { DeleteWorkflowDialog } from "./DeleteWorkflowDialog";
import { toast } from "sonner";

interface WorkflowTableProps {
    workflows: Workflow[];
    loading: boolean;
    onWorkflowDeleted?: () => void;
    onWorkflowStatusChanged?: () => void;
}

export const WorkflowTable = ({ workflows, loading, onWorkflowDeleted, onWorkflowStatusChanged }: WorkflowTableProps) => {
    const navigate = useNavigate();
    const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [statusLoadingWorkflowId, setStatusLoadingWorkflowId] = useState<string | null>(null);

    const hasZerodhaAction = (workflow: Workflow) => {
        return workflow.nodes?.some((node: any) => 
            node.type?.toLowerCase() === "zerodha"
        ) ?? false;
    };

    const handleStatusToggle = async (workflow: Workflow) => {
        const nextStatus = workflow.status === "paused" ? "active" : "paused";
        setStatusLoadingWorkflowId(workflow._id);
        try {
            const response = await apiUpdateWorkflowStatus(workflow._id, nextStatus);
            toast.success(
                nextStatus === "paused" ? "Workflow paused" : "Workflow resumed",
                { description: response.message }
            );
            onWorkflowStatusChanged?.();
        } catch (error: any) {
            toast.error("Status update failed", {
                description: error?.response?.data?.message ?? "Could not update workflow status.",
            });
        } finally {
            setStatusLoadingWorkflowId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                    <span className="text-sm">Loading your workflows…</span>
                </div>
            </div>
        );
    }

    if (workflows.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-muted-foreground">No workflows yet.</p>
                <Button
                    className="gap-2"
                    onClick={() => navigate("/create/onboarding")}
                >
                    Start your first workflow
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(220px,1.8fr)_80px_120px_140px_120px_minmax(260px,1.5fr)] gap-4 border-b border-neutral-600 bg-table-header px-5 py-3.5">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Workflow Name
                </span>
                <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground md:block">
                    Nodes
                </span>
                <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground md:block">
                    Connections
                </span>
                <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground md:block">
                    Type
                </span>
                <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground md:block">
                    Status
                </span>
                <span className="text-right text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Actions
                </span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border-neutral-600">
                {workflows.map((wf) => (
                    <div
                        key={wf._id}
                        className="grid grid-cols-[minmax(220px,1.8fr)_80px_120px_140px_120px_minmax(260px,1.5fr)] items-center gap-4 px-5 py-4 transition-colors hover:bg-table-row-hover"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-neutral-200">
                                {wf.workflowName || "Untitled Workflow"}
                            </span>
                            <span className="text-[11px] text-muted-foreground/70">
                                {wf.updatedAt ? `Last updated ${new Date(wf.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" })}` : "No updates yet"}
                            </span>
                        </div>
                        <span className="hidden text-sm tabular-nums text-muted-foreground md:block">
                            {wf.nodes?.length ?? 0}
                        </span>
                        <span className="hidden text-sm tabular-nums text-muted-foreground md:block">
                            {wf.edges?.length ?? 0}
                        </span>
                        <div className="hidden md:block">
                            {wf.marketType ? (
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-neutral-600/50 bg-neutral-800/30 text-neutral-300">
                                    {wf.marketType}
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                                    wf.status === "paused"
                                        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                }`}
                            >
                                {wf.status === "paused" ? "Paused" : "Active"}
                            </span>
                        </div>
                        <div className="grid gap-2 justify-items-end">
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                    disabled={statusLoadingWorkflowId === wf._id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleStatusToggle(wf);
                                    }}
                                    title={wf.status === "paused" ? "Resume Workflow" : "Pause Workflow"}
                                >
                                    {wf.status === "paused" ? (
                                        <Play className="h-3.5 w-3.5" />
                                    ) : (
                                        <Pause className="h-3.5 w-3.5" />
                                    )}
                                    {statusLoadingWorkflowId === wf._id
                                        ? "Updating"
                                        : wf.status === "paused"
                                          ? "Resume"
                                          : "Pause"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/workflow/${wf._id}/executions`);
                                    }}
                                >
                                    <Activity className="h-3.5 w-3.5" />
                                    Executions
                                </Button>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                {hasZerodhaAction(wf) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWorkflow(wf);
                                            setTokenDialogOpen(true);
                                        }}
                                        title="Manage Zerodha Token"
                                    >
                                        <Key className="h-3.5 w-3.5" />
                                        Token
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/workflow/${wf._id}`);
                                    }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedWorkflow(wf);
                                        setDeleteDialogOpen(true);
                                    }}
                                    title="Delete Workflow"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dialogs */}
            {selectedWorkflow && (
                <>
                    <ZerodhaTokenDialog
                        open={tokenDialogOpen}
                        onOpenChange={setTokenDialogOpen}
                        workflowId={selectedWorkflow._id}
                        workflowName={selectedWorkflow.workflowName || "Untitled"}
                    />
                    <DeleteWorkflowDialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                        workflowId={selectedWorkflow._id}
                        workflowName={selectedWorkflow.workflowName || "Untitled"}
                        onDeleted={() => {
                            onWorkflowDeleted?.();
                        }}
                    />
                </>
            )}
        </div>
    );
};
