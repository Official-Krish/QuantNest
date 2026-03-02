import { Input } from "@/components/ui/input";

interface GoogleDriveDailyCsvFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const GoogleDriveDailyCsvForm = ({
  metadata,
  setMetadata,
}: GoogleDriveDailyCsvFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Service Account Email
        </p>
        <Input
          type="text"
          value={metadata.googleClientEmail || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              googleClientEmail: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="service-account@project.iam.gserviceaccount.com"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Private Key
        </p>
        <Input
          type="password"
          value={metadata.googlePrivateKey || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              googlePrivateKey: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="-----BEGIN PRIVATE KEY-----..."
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Drive Folder ID (Optional)
        </p>
        <Input
          type="text"
          value={metadata.googleDriveFolderId || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              googleDriveFolderId: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="1AbcDefGhI..."
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          File Prefix (Optional)
        </p>
        <Input
          type="text"
          value={metadata.filePrefix || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              filePrefix: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="quantnest-trades"
        />
      </div>

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          Exports Zerodha trades of the day as CSV and uploads to Google Drive once per day.
          Share target folder with this service account email before enabling.
        </p>
      </div>
    </div>
  );
};
