import { useEffect, useMemo, useState } from "react";
import { apiGetGoogleSheetsServiceAccount, apiVerifyGoogleSheets } from "@/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface GoogleSheetsReportFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const GoogleSheetsReportForm = ({
  metadata,
  setMetadata,
}: GoogleSheetsReportFormProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasSheetId = Boolean(String(metadata.sheetId || "").trim());

  const shareEmail = useMemo(() => {
    const fromMetadata = String(metadata.serviceAccountEmail || "").trim();
    if (fromMetadata) return fromMetadata;
    return "";
  }, [metadata.serviceAccountEmail]);

  useEffect(() => {
    if (shareEmail) return;

    const loadServiceAccount = async () => {
      try {
        const response = await apiGetGoogleSheetsServiceAccount();
        setMetadata((current: any) => ({
          ...current,
          serviceAccountEmail: response.serviceAccountEmail,
        }));
      } catch {
        // Keep form functional even if this metadata endpoint is temporarily unavailable.
      }
    };

    void loadServiceAccount();
  }, [setMetadata, shareEmail]);

  const handleVerify = async () => {
    setVerifySuccess(null);
    setIsVerifying(true);
    try {
      const response = await apiVerifyGoogleSheets({
        sheetUrl: String(metadata.sheetUrl || "").trim(),
      });

      setMetadata((current: any) => ({
        ...current,
        sheetId: response.sheet.sheetId,
        sheetName: response.sheet.sheetName,
        serviceAccountEmail: response.sheet.serviceAccountEmail,
      }));

      setVerifySuccess(`Verified: ${response.sheet.spreadsheetTitle} (${response.sheet.sheetName})`);
      toast.success("Google Sheet verified", {
        description: `${response.sheet.spreadsheetTitle} (${response.sheet.sheetName})`,
      });
    } catch (error: any) {
      const rawMessage = String(error?.response?.data?.message || error?.message || "").trim();
      const backendEmail = String(error?.response?.data?.serviceAccountEmail || "").trim();
      if (backendEmail) {
        setMetadata((current: any) => ({
          ...current,
          serviceAccountEmail: backendEmail,
        }));
      }

      const friendlyMessage = (() => {
        const lower = rawMessage.toLowerCase();

        if (lower.includes("invalid google sheet url") || lower.includes("invalid url")) {
          return "Please paste a valid Google Sheet link.";
        }

        if (
          lower.includes("add our service account") ||
          lower.includes("share settings") ||
          lower.includes("access denied") ||
          lower.includes("forbidden") ||
          lower.includes("403") ||
          lower.includes("404") ||
          lower.includes("caller does not have permission") ||
          lower.includes("insufficient permission") ||
          lower.includes("permission denied")
        ) {
          return "Please add our service account email in Google Sheet Share settings (Editor access), then try again.";
        }

        if (
          lower.includes("service account") ||
          lower.includes("misconfigured") ||
          lower.includes("bad_base64_decode") ||
          lower.includes("pem") ||
          lower.includes("decoder")
        ) {
          return "Google Sheets setup is temporarily unavailable. Please try again in a few minutes.";
        }

        return "Could not verify this sheet right now. Please try again.";
      })();

      toast.error("Google Sheet verification failed", {
        description: friendlyMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyServiceAccount = async () => {
    if (!shareEmail) return;

    try {
      await navigator.clipboard.writeText(shareEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy service account email", {
        description: "Please copy it manually.",
      });
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Sheet URL
        </p>
        <Input
          type="text"
          value={metadata.sheetUrl || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              sheetUrl: e.target.value,
              sheetId: undefined,
              sheetName: undefined,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
      </div>

      <Button
        type="button"
        className="w-full cursor-pointer bg-neutral-100 text-xs font-medium text-neutral-900 hover:bg-neutral-200"
        disabled={isVerifying}
        onClick={handleVerify}
      >
        {isVerifying ? "Verifying access..." : "Verify Sheet Access"}
      </Button>

      {verifySuccess ? (
        <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {verifySuccess}
        </div>
      ) : null}

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          Create a Google Sheet, click Share, and add this service account email as Editor before verification.
          {shareEmail ? "" : " Service account email will appear once backend configuration is loaded."}
        </p>
        {shareEmail ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-neutral-700/70 bg-black/30 px-2 py-2">
            <p className="truncate text-xs text-neutral-200">{shareEmail}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 border-neutral-700 bg-neutral-900 px-2 text-[11px] text-neutral-100 cursor-pointer"
              onClick={handleCopyServiceAccount}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : null}
        {hasSheetId ? (
          <p className="mt-1 text-xs text-neutral-500">Spreadsheet ID: {metadata.sheetId}</p>
        ) : null}
      </div>
    </div>
  );
};
