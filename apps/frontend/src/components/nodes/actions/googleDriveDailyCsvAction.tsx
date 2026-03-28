import { Handle, Position } from "@xyflow/react";

export const googleDriveDailyCsvAction = ({
  data,
}: {
  data: {
    metadata: {
      googleClientEmail?: string;
      googleDriveFolderId?: string;
      filePrefix?: string;
      aiConsent?: boolean;
      secretId?: string;
    };
  };
}) => {
  const { googleClientEmail, googleDriveFolderId, filePrefix, aiConsent, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const accountDisplay = hasSecret
    ? "Credentials from stored secret"
    : googleClientEmail ? googleClientEmail : "Missing service account email";

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#8ab4f8] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ab4f8]">
          Google Drive
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          CSV
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        Daily Trades Export
      </div>
      <div className="mt-1 text-[11px] text-neutral-400 truncate">
        {googleDriveFolderId ? "Drive folder configured" : "Uploads to account root"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500 truncate">
        {accountDisplay}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Prefix: {filePrefix || "quantnest-trades"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Window: After 3:30 PM IST, once daily
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        {aiConsent ? "AI insights enabled" : "AI consent required"}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#8ab4f8]! border border-neutral-900"
      />
    </div>
  );
};
