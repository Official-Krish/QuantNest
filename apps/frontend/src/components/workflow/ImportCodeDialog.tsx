import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGetWorkflowByShareCode } from "@/http";
import type { NodeType, EdgeType } from "@quantnest-trading/types";
import { OrangeButton } from "../ui/button-orange";

interface ImportCodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: (nodes: NodeType[], edges: EdgeType[], executionMode: string, workflowName?: string) => void;
}

export const ImportCodeDialog = ({ open, onOpenChange, onImported }: ImportCodeDialogProps) => {
    const [shareCode, setShareCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [workflowData, setWorkflowData] = useState<any>(null);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        setShareCode(code);
        setError(null);
        setWorkflowData(null);
    };

    const handleLookup = async () => {
        if (!shareCode.trim()) {
            setError("Please enter a share code");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiGetWorkflowByShareCode(shareCode);
            setWorkflowData(response.workflow);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Workflow not found. Please check the share code.");
            setWorkflowData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        if (!workflowData) return;

        try {
            onImported(
                workflowData.nodes || [],
                workflowData.edges || [],
                workflowData.executionMode || "live",
                workflowData.workflowName
            );

            // Reset
            setShareCode("");
            setWorkflowData(null);
            setError(null);
            onOpenChange(false);
        } catch (err: any) {
            setError("Failed to import workflow");
        }
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setShareCode("");
            setWorkflowData(null);
            setError(null);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-112.5 bg-neutral-900 border-neutral-700 border-t-2 border-t-[#f17463]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        Import Workflow
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Paste the share code from someone to import their workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-6">
                    <div className="space-y-2">
                        <label htmlFor="share-code" className="text-sm font-medium text-neutral-200">
                            Share Code
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="share-code"
                                placeholder="Paste code here (e.g., ABC12345)"
                                value={shareCode}
                                onChange={handleCodeChange}
                                disabled={loading || !!workflowData}
                                className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500 font-mono text-lg tracking-widest"
                                maxLength={8}
                            />
                            <OrangeButton
                                onClick={handleLookup}
                                disabled={!shareCode.trim() || loading || !!workflowData}
                                className="cursor-pointer px-4"
                            >
                                {loading ? "Loading..." : "Find"}
                            </OrangeButton>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {workflowData && (
                        <div className="rounded-xl bg-[#0c0c0e] border border-[#1e1e26] p-4 mb-3">
                            <div className="flex items-center gap-1.5 mb-3">
                                <span className="h-1.75 w-1.75 shrink-0 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-500">
                                    Workflow found
                                </span>
                            </div>
                            <p className="text-[15px] font-semibold text-[#f0ede8] mb-3">
                                {workflowData.workflowName || "Untitled"}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: "Nodes", value: workflowData.nodes?.length ?? 0 },
                                    { label: "Edges", value: workflowData.edges?.length ?? 0 },
                                    { label: "Mode", value: workflowData.executionMode || "live" },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-[#111113] border border-[#1e1e22] rounded-lg px-3 py-2.5">
                                        <p className="text-[10px] uppercase tracking-widest text-[#3a3a44] mb-1">{label}</p>
                                        <p className="text-sm font-semibold text-[#c0bdb8]">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => handleClose(false)}
                        disabled={loading}
                        className="text-neutral-400 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <OrangeButton
                        onClick={handleImport}
                        disabled={!workflowData}
                    >
                        Load to Canvas
                    </OrangeButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
