import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrangeButton } from "@/components/ui/button-orange";
import { apiGetAiDraftSharePreview, apiImportAiDraftByShareCode } from "@/http";
import type { AiStrategyDraftSession } from "@/types/api";
import { X } from "lucide-react";

type ImportChatCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (draft: AiStrategyDraftSession) => void;
};

type DraftPreview = {
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  versions: number;
  lastMessage: string;
};

export function ImportChatCodeDialog({ open, onOpenChange, onImported }: ImportChatCodeDialogProps) {
  const [shareCode, setShareCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DraftPreview | null>(null);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShareCode("");
      setLoading(false);
      setImporting(false);
      setError(null);
      setPreview(null);
    }
    onOpenChange(nextOpen);
  };

  const handleLookup = async () => {
    const normalized = shareCode.trim().toUpperCase();
    if (!normalized) {
      setError("Please enter a share code.");
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const data = await apiGetAiDraftSharePreview(normalized);
      setPreview(data);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Chat not found for this code.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const normalized = shareCode.trim().toUpperCase();
    if (!normalized) return;

    setImporting(true);
    setError(null);

    try {
      const draft = await apiImportAiDraftByShareCode(normalized);
      onImported(draft);
      handleClose(false);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to import chat.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-112.5 border-neutral-700 border-t-2 border-t-[#f17463] bg-neutral-900"
      >
        <DialogClose
          className="absolute top-4 right-4 rounded-sm border border-[#f17463]/40 p-1.5 text-[#f8a295] opacity-90 transition hover:bg-[#f17463]/10 hover:opacity-100"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="text-white">Import AI Chat</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Enter a share code to import an AI chat into your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <label htmlFor="chat-share-code" className="text-sm font-medium text-neutral-200">
              Share Code
            </label>
            <div className="flex gap-2">
              <Input
                id="chat-share-code"
                placeholder="Paste code here (e.g., ABC12345)"
                value={shareCode}
                onChange={(event) => {
                  const normalized = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  setShareCode(normalized);
                  setError(null);
                  setPreview(null);
                }}
                maxLength={8}
                disabled={loading || importing || !!preview}
                className="border-neutral-700 bg-neutral-800 font-mono text-lg tracking-widest text-neutral-100 placeholder-neutral-500"
              />
              <OrangeButton
                onClick={handleLookup}
                disabled={!shareCode.trim() || loading || importing || !!preview}
                className="px-4"
              >
                {loading ? "Loading..." : "Find"}
              </OrangeButton>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : null}

          {preview ? (
            <div className="mb-3 rounded-xl border border-[#1e1e26] bg-[#0c0c0e] p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-1.75 w-1.75 shrink-0 rounded-full bg-[#f17463]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#f17463]">
                  Chat found
                </span>
              </div>
              <p className="mb-3 text-[15px] font-semibold text-[#f0ede8]">{preview.title || "Untitled"}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#1e1e22] bg-[#111113] px-3 py-2.5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-[#3a3a44]">Status</p>
                  <p className="text-sm font-semibold text-[#c0bdb8]">{preview.status}</p>
                </div>
                <div className="rounded-lg border border-[#1e1e22] bg-[#111113] px-3 py-2.5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-[#3a3a44]">Versions</p>
                  <p className="text-sm font-semibold text-[#c0bdb8]">{preview.versions}</p>
                </div>
                <div className="rounded-lg border border-[#1e1e22] bg-[#111113] px-3 py-2.5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-[#3a3a44]">Updated</p>
                  <p className="text-sm font-semibold text-[#c0bdb8]">
                    {new Date(preview.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={loading || importing}
            className="cursor-pointer text-neutral-400"
          >
            Cancel
          </Button>
          <OrangeButton
            onClick={() => void handleImport()}
            disabled={!preview || importing || loading}
          >
            {importing ? "Importing..." : "Import Chat"}
          </OrangeButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
