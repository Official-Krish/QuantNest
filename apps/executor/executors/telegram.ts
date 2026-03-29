import { Telegram } from "telegraf";
import { appendAiInsight, getNotificationContent } from "./notificationContent";
import type { EventType, NotificationDetails } from "../types";
import { generateTradeReasoning } from "../ai-models";

export async function sendTelegramMessage(
  telegramBotToken: string,
  telegramChatId: string,
  name: string,
  eventType: EventType,
  details: NotificationDetails,
) {
  try {
    const telegram = new Telegram(telegramBotToken);

    const aiInsight = await generateTradeReasoning(eventType, details, {
      provider: "gemini",
      model: "gemini-2.5-flash",
    });
    const enrichedDetails: NotificationDetails = {
      ...details,
      ...(aiInsight ? { aiInsight } : {}),
    };

    const { subject, message } = getNotificationContent(name, eventType, enrichedDetails);
    const finalMessage = appendAiInsight(message, enrichedDetails);
    await telegram.sendMessage(telegramChatId, `${subject}\n\n${finalMessage}`);
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
}
