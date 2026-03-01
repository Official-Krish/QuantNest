import { Input } from "@/components/ui/input";

interface WhatsappFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const WhatsappForm = ({ metadata, setMetadata }: WhatsappFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Recipient Name
        </p>
        <p className="text-xs text-neutral-400">
          Name to include in the WhatsApp notification message.
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

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Recipient Phone
        </p>
        <p className="text-xs text-neutral-400">
          WhatsApp number in international format (e.g. +91 98XXXXXXXX).
        </p>
        <Input
          type="string"
          value={metadata.recipientPhone || ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d+]/g, "");
            const formatted = digits.startsWith("+") ? digits : "+" + digits.replace(/\D/g, "");
            setMetadata((current: any) => ({
              ...current,
              recipientPhone: formatted,
            }));
          }}
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="91 98XXXXXXXX"
        />
      </div>

      <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3 space-y-2">
        <p className="text-xs text-neutral-400">
          💡 <span className="font-medium text-neutral-300">Auto-notification:</span> WhatsApp messages are sent on workflow events.
        </p>
      </div>
    </div>
  );
};
