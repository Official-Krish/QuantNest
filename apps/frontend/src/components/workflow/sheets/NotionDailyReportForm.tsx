import { Input } from "@/components/ui/input";

interface NotionDailyReportFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const NotionDailyReportForm = ({
  metadata,
  setMetadata,
}: NotionDailyReportFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Notion API Key
        </p>
        <p className="text-xs text-neutral-400">
          Internal integration token from Notion. Stored in workflow metadata.
        </p>
        <Input
          type="password"
          value={metadata.notionApiKey || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              notionApiKey: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="ntn_..."
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Parent Page ID
        </p>
        <p className="text-xs text-neutral-400">
          Recommended for internal integrations.
        </p>
        <Input
          type="text"
          value={metadata.parentPageId || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              parentPageId: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
      </div>

      <label className="flex items-start gap-2 rounded-lg border border-neutral-700/60 bg-neutral-900/40 p-3">
        <input
          type="checkbox"
          checked={Boolean(metadata.aiConsent)}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              aiConsent: e.target.checked,
            }))
          }
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[#7ecb89]"
        />
        <span className="text-xs leading-relaxed text-neutral-300">
          I consent to QuantNest fetching Zerodha order/trade/position/holding data and sending
          relevant historical trade context to AI for analysis and Notion report generation.
        </span>
      </label>

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          This action creates a structured Notion report from Zerodha account data and AI analysis.
          It runs only when a Zerodha action exists in the workflow and consent is enabled.
        </p>
      </div>
    </div>
  );
};
