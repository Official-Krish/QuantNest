import { Input } from "@/components/ui/input";

interface GmailFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const GmailForm = ({ metadata, setMetadata }: GmailFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      {/* Recipient Name */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Recipient Name
        </p>
        <p className="text-xs text-neutral-400">
          Name of the person receiving the notification.
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

      {/* Recipient Email */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Recipient Email
        </p>
        <p className="text-xs text-neutral-400">
          Email address to send notifications to.
        </p>
        <Input
          type="email"
          value={metadata.recipientEmail || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              recipientEmail: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="user@example.com"
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          💡 <span className="font-medium text-neutral-300">Auto-notification:</span> Emails are sent automatically based on workflow events (trade executions, price triggers, failures).
        </p>
      </div>
    </div>
  );
};
