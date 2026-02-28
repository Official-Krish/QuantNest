import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Clock, Key } from "lucide-react";
import { apiGetZerodhaTokenStatus, apiCreateZerodhaToken, apiUpdateZerodhaToken } from "@/http";
import { ACCESS_TOKEN_REGEX } from "@/lib/validation";

interface TokenStatus {
    hasValidToken: boolean;
    needsToken: boolean;
    expiresAt?: string;
    message: string;
    tokenRequestId?: string;
}

interface ZerodhaTokenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflowId: string;
    workflowName: string;
}

export const ZerodhaTokenDialog = ({ open, onOpenChange, workflowId, workflowName }: ZerodhaTokenDialogProps) => {
    const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
    const [accessToken, setAccessToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchTokenStatus();
        }
    }, [open, workflowId]);

    const fetchTokenStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiGetZerodhaTokenStatus(workflowId);
            setTokenStatus(response.tokenStatus);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to fetch token status");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToken = async () => {
        if (!accessToken.trim()) {
            setError("Please enter an access token");
            return;
        }
        if (!ACCESS_TOKEN_REGEX.test(accessToken.trim())) {
            setError("Invalid access token format.");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = tokenStatus?.hasValidToken
                ? await apiUpdateZerodhaToken({ workflowId, accessToken })
                : await apiCreateZerodhaToken({ workflowId, accessToken });

            setSuccess(response.message || "Token saved successfully");
            setAccessToken("");
            await fetchTokenStatus();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to save token");
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = () => {
        if (!tokenStatus) return null;
        if (tokenStatus.hasValidToken) return <CheckCircle2 className="h-5 w-5 text-green-400" />;
        if (tokenStatus.needsToken) return <AlertCircle className="h-5 w-5 text-yellow-400" />;
        return <Clock className="h-5 w-5 text-gray-400" />;
    };

    const formatExpiryTime = (expiresAt?: string) => {
        if (!expiresAt) return null;
        const date = new Date(expiresAt);
        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-neutral-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Key className="h-5 w-5" />
                        Zerodha Access Token
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Manage your Zerodha access token for <span className="font-semibold text-neutral-200">{workflowName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Token Status */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
                        </div>
                    ) : tokenStatus ? (
                        <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                            <div className="flex items-start gap-3">
                                {getStatusIcon()}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-200">
                                        {tokenStatus.hasValidToken ? "Token Active" : "Token Required"}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-400">
                                        {tokenStatus.message}
                                    </p>
                                    {tokenStatus.expiresAt && (
                                        <p className="mt-2 text-xs text-neutral-500">
                                            Expires: {formatExpiryTime(tokenStatus.expiresAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Token Input */}
                    <div className="space-y-2">
                        <Label htmlFor="accessToken" className="text-neutral-300">
                            {tokenStatus?.hasValidToken ? "Update Access Token" : "Enter Access Token"}
                        </Label>
                        <Input
                            id="accessToken"
                            type="password"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="Enter your Zerodha access token"
                            className="border-neutral-700 bg-neutral-800 text-neutral-100"
                        />
                        <p className="text-xs text-neutral-500">
                            Your access token expires daily and needs to be updated each trading day.
                        </p>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3">
                            <p className="text-sm text-green-400">{success}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-neutral-400 hover:text-neutral-200"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSaveToken}
                        disabled={saving || !accessToken.trim()}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {saving ? "Saving..." : tokenStatus?.hasValidToken ? "Update Token" : "Save Token"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
