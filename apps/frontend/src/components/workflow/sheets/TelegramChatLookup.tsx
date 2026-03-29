import { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { apiGetTelegramChats } from "@/http";
import type { TelegramChatSummary } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TelegramChatLookupProps {
  botToken: string;
  selectedChatId?: string;
  onSelectChat: (chat: TelegramChatSummary) => void;
  compact?: boolean;
}

export function TelegramChatLookup({
  botToken,
  selectedChatId,
  onSelectChat,
  compact = false,
}: TelegramChatLookupProps) {
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<TelegramChatSummary[]>([]);

  const handleLoadChats = async () => {
    if (!botToken.trim()) {
      toast.error("Enter a Telegram bot token first");
      return;
    }

    setLoading(true);
    try {
      const results = await apiGetTelegramChats(botToken.trim());
      setChats(results);
      if (!results.length) {
        toast.message("No Telegram chats found yet", {
          description: "Ask the user to start your bot and send it a message, then try again.",
        });
      }
    } catch (error: any) {
      toast.error("Could not fetch Telegram chats", {
        description: error?.response?.data?.message || error?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleLoadChats()}
          disabled={loading}
          className={compact ? "h-9 rounded-xl border-neutral-800 bg-neutral-950 text-xs text-neutral-200" : "h-10 rounded-xl border-neutral-800 bg-neutral-950 text-xs text-neutral-200"}
        >
          {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="mr-2 h-3.5 w-3.5" />}
          Detect chats
        </Button>
        <p className="text-[11px] text-neutral-500">
          After the user messages the bot, fetch available chat IDs.
        </p>
      </div>

      {chats.length > 0 ? (
        <Select
          value={selectedChatId || ""}
          onValueChange={(value) => {
            const selected = chats.find((chat) => chat.id === value);
            if (selected) {
              onSelectChat(selected);
            }
          }}
        >
          <SelectTrigger className={compact ? "h-9 border-neutral-800 bg-neutral-950 text-xs text-white" : "h-11 border-neutral-800 bg-neutral-950 text-sm text-white"}>
            <SelectValue placeholder="Choose a Telegram chat" />
          </SelectTrigger>
          <SelectContent className="border-neutral-800 bg-neutral-950 text-white">
            {chats.map((chat) => (
              <SelectItem key={chat.id} value={chat.id} className={compact ? "text-xs" : ""}>
                {chat.title} {chat.username ? `(@${chat.username})` : ""} [{chat.id}]
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
