import { Input } from "@/components/ui/input";
import { ReusableSecretPicker } from "./ReusableSecretPicker";

interface TelegramFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const TelegramForm = ({ metadata, setMetadata }: TelegramFormProps) => {
  const hasSecret = Boolean(String(metadata.secretId || "").trim());

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <ReusableSecretPicker
        service="telegram"
        secretId={metadata.secretId}
        helperText="Reuse a saved Telegram bot + chat destination, or leave empty to enter a one-time value."
        onSelectSecret={(secretId) =>
          setMetadata((current: any) => ({
            ...current,
            secretId,
            telegramBotToken: "",
            telegramChatId: "",
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
          Name to personalize the Telegram message.
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
              Telegram bot token used to deliver workflow messages.
            </p>
            <Input
              type="password"
              value={metadata.telegramBotToken || ""}
              onChange={(e) =>
                setMetadata((current: any) => ({
                  ...current,
                  secretId: undefined,
                  telegramBotToken: e.target.value.trim(),
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="123456789:AA..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Chat ID
            </p>
            <p className="text-xs text-neutral-400">
              Telegram chat or user ID that should receive workflow alerts.
            </p>
            <Input
              type="text"
              value={metadata.telegramChatId || ""}
              onChange={(e) =>
                setMetadata((current: any) => ({
                  ...current,
                  secretId: undefined,
                  telegramChatId: e.target.value.trim(),
                }))
              }
              className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
              placeholder="123456789"
            />
          </div>
        </>
      )}

      <div className="space-y-2 rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-3">
        <p className="text-xs text-neutral-400">
          This version sends outbound bot messages. Later we can reuse the same bot to listen for commands like “stop this workflow”.
        </p>
      </div>
    </div>
  );
};
