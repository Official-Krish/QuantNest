import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { apiDeleteWorkflow } from "@/http";

interface DeleteWorkflowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflowId: string;
    workflowName: string;
    onDeleted: () => void;
}

export const DeleteWorkflowDialog = ({ open, onOpenChange, workflowId, workflowName, onDeleted }: DeleteWorkflowDialogProps) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        try {
            setDeleting(true);
            setError(null);
            await apiDeleteWorkflow(workflowId);
            onDeleted();
            onOpenChange(false);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete workflow");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-neutral-900 border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Delete Workflow
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        This action cannot be undone. Are you sure you want to delete this workflow?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                        <p className="text-sm font-medium text-neutral-200">
                            {workflowName}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                            All associated data, including executions and configurations, will be permanently removed.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                        className="text-neutral-400 hover:text-neutral-800 cursor-pointer transform transition-colors duration-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 cursor-pointer"
                    >
                        {deleting ? "Deleting..." : "Delete Workflow"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
