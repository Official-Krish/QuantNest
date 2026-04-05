import axios from "axios";

export async function getTelegramChats(botToken: string) {
  const telegramRes = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, {
    timeout: 10000,
  });

  if (!telegramRes.data?.ok) {
    throw new Error("Unable to fetch Telegram chats from this bot token");
  }

  const chatsById = new Map<
    string,
    {
      id: string;
      title: string;
      username?: string;
      type: "private" | "group" | "supergroup" | "channel" | "unknown";
      lastMessageAt?: string;
    }
  >();

  for (const update of telegramRes.data?.result || []) {
    const chat =
      update?.message?.chat ||
      update?.edited_message?.chat ||
      update?.callback_query?.message?.chat ||
      update?.channel_post?.chat ||
      update?.my_chat_member?.chat;

    if (!chat?.id) continue;

    const type = ["private", "group", "supergroup", "channel"].includes(chat.type)
      ? chat.type
      : "unknown";
    const title =
      chat.title ||
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      chat.username ||
      String(chat.id);
    const lastMessageAt = update?.message?.date
      ? new Date(update.message.date * 1000).toISOString()
      : update?.edited_message?.date
        ? new Date(update.edited_message.date * 1000).toISOString()
        : update?.channel_post?.date
          ? new Date(update.channel_post.date * 1000).toISOString()
          : undefined;

    chatsById.set(String(chat.id), {
      id: String(chat.id),
      title,
      username: chat.username,
      type,
      lastMessageAt,
    });
  }

  return Array.from(chatsById.values()).sort((a, b) =>
    (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""),
  );
}
