import { Input } from "@/components/ui/input";

interface DiscordFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const DiscordForm = ({ metadata, setMetadata }: DiscordFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Recipient Name */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Recipient Name
        </p>
        <p className="text-xs text-neutral-400">
          Name to display in the notification message.
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

      {/* Webhook URL */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Webhook URL
        </p>
        <p className="text-xs text-neutral-400">
          Discord webhook URL for sending notifications.
        </p>
        <Input
          type="url"
          value={metadata.webhookUrl || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              webhookUrl: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="https://discord.com/api/webhooks/..."
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3 space-y-2">
        <p className="text-xs text-neutral-400">
          💡 <span className="font-medium text-neutral-300">Auto-notification:</span> Discord messages are sent automatically based on workflow events.
        </p>
        <p className="text-xs text-neutral-500">
          To get a webhook URL: Server Settings → Integrations → Webhooks → New Webhook
        </p>
      </div>
    </div>
  );
};
