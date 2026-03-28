import { Input } from "@/components/ui/input";
import { ReusableSecretPicker } from "./ReusableSecretPicker";

interface GoogleDriveDailyCsvFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const GoogleDriveDailyCsvForm = ({
  metadata,
  setMetadata,
}: GoogleDriveDailyCsvFormProps) => {
  const hasSecret = Boolean(String(metadata.secretId || "").trim());

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <ReusableSecretPicker
        service="google-drive-daily-csv"
        secretId={metadata.secretId}
        helperText="Reuse a saved Google service account secret or leave empty to enter one-time credentials."
        onSelectSecret={(secretId) =>
          setMetadata((current: any) => ({
            ...current,
            secretId,
            googleClientEmail: "",
            googlePrivateKey: "",
          }))
        }
        onClearSecret={() =>
          setMetadata((current: any) => ({
            ...current,
            secretId: undefined,
          }))
        }
      />

      {!hasSecret && (
        <>
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
                  secretId: undefined,
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
                  secretId: undefined,
                  googlePrivateKey: e.target.value,
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="-----BEGIN PRIVATE KEY-----..."
            />
          </div>
        </>
      )}

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
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[#8ab4f8]"
        />
        <span className="text-xs leading-relaxed text-neutral-300">
          I consent to QuantNest using Zerodha trade data for AI-generated daily insights included in the CSV export.
        </span>
      </label>

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          Runs once per day after 3:30 PM IST, exports Zerodha trades with AI insights, then uploads CSV to Google Drive.
          Share the target folder with this service account email before enabling.
        </p>
      </div>
    </div>
  );
};
