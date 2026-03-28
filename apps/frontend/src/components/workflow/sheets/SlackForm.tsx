import { Input } from "@/components/ui/input";
import { ReusableSecretPicker } from "./ReusableSecretPicker";

interface SlackFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const SlackForm = ({ metadata, setMetadata }: SlackFormProps) => {
  const hasSecret = Boolean(String(metadata.secretId || "").trim());

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <ReusableSecretPicker
        service="slack"
        secretId={metadata.secretId}
        helperText="Reuse a saved Slack bot token + user destination, or leave empty to enter a one-time value."
        onSelectSecret={(secretId) =>
          setMetadata((current: any) => ({
            ...current,
            secretId,
            slackBotToken: "",
            slackUserId: "",
          }))
        }
        onClearSecret={() =>
          setMetadata((current: any) => ({
            ...current,
            secretId: undefined,
          }))
        }
      />

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Recipient Name
        </p>
        <p className="text-xs text-neutral-400">
          Name to personalize the Slack DM content.
        </p>
        <Input
          type="text"
          value={metadata.recipientName || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              recipientName: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="Enter recipient name"
        />
      </div>

      {!hasSecret && (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Bot Token
            </p>
            <p className="text-xs text-neutral-400">
              Slack bot token used by the official Slack SDK to open a DM and send the message.
            </p>
            <Input
              type="password"
              value={metadata.slackBotToken || ""}
              onChange={(e) =>
                setMetadata((current: any) => ({
                  ...current,
                  secretId: undefined,
                  slackBotToken: e.target.value,
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="xoxb-..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Slack User ID
            </p>
            <p className="text-xs text-neutral-400">
              User ID of the person who should receive the direct message, for example `U012ABCDEF`.
            </p>
            <Input
              type="text"
              value={metadata.slackUserId || ""}
              onChange={(e) =>
                setMetadata((current: any) => ({
                  ...current,
                  secretId: undefined,
                  slackUserId: e.target.value.trim(),
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="U012ABCDEF"
            />
          </div>
        </>
      )}

      <div className="space-y-2 rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          The app must be installed in the target Slack workspace, and the recipient must be reachable by the app.
        </p>
        <p className="text-xs text-neutral-500">
          Recommended scopes: `chat:write` and the scope needed to open DMs in your Slack app configuration.
        </p>
      </div>
    </div>
  );
};
