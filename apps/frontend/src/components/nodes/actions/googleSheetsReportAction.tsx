import { Handle, Position } from "@xyflow/react";

export const googleSheetsReportAction = ({
  data,
}: {
  data: {
    metadata: {
      sheetUrl?: string;
      sheetId?: string;
      sheetName?: string;
      serviceAccountEmail?: string;
    };
  };
}) => {
  const { sheetUrl, sheetId, sheetName, serviceAccountEmail } = data.metadata || {};
  const accountDisplay = serviceAccountEmail
    ? `Service account: ${serviceAccountEmail}`
    : "Service account configured on backend";

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#78dce8] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#78dce8]">
          Google Sheets
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          REPORT
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        Execution Report Append
      </div>
      <div className="mt-1 text-[11px] text-neutral-400 truncate">
        {sheetName ? `Sheet: ${sheetName}` : sheetUrl ? "Sheet URL configured" : "Missing Sheet URL"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500 truncate">
        {accountDisplay}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500 truncate">
        {sheetId ? `Spreadsheet ID: ${sheetId}` : "Spreadsheet ID pending verification"}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#78dce8]! border border-neutral-900"
      />
    </div>
  );
};
