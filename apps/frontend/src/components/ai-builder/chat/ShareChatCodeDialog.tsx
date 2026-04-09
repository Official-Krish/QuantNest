import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrangeButton } from "@/components/ui/button-orange";
import { Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ShareChatCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareCode: string | null;
  loading?: boolean;
};

export function ShareChatCodeDialog({
  open,
  onOpenChange,
  shareCode,
  loading = false,
}: ShareChatCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!shareCode) return;

    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    toast.success("Share code copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <DialogTitle className="text-white">Share AI Chat</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Share this code so another user can import this AI conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-[#f17463]" />
            </div>
          ) : shareCode ? (
            <div className="rounded-xl border border-[#1e1e22] bg-[#0c0c0e] p-5">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#e05a45]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e05a45]" />
                Chat share code
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-[26px] font-bold tracking-[0.18em] text-[#f0ede8]">
                  {shareCode}
                </code>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className={cn(
                    "h-9 w-9 rounded-[9px] border transition-colors",
                    copied
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-[#e05a45]/20 bg-[#e05a45]/10 text-[#e05a45] hover:bg-[#e05a45]/18",
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <OrangeButton onClick={() => onOpenChange(false)}>Done</OrangeButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
