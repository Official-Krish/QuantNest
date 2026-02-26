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
          Parent Page ID (Optional)
        </p>
        <p className="text-xs text-neutral-400">
          Recommended for internal integrations. If empty, API uses workspace parent.
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

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          This action creates a Notion page with: win rate, mistakes, and AI improvement suggestions.
          It runs only when a Zerodha action exists in the workflow.
        </p>
      </div>
    </div>
  );
};
