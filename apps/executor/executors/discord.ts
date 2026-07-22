import axios from "axios";
import { appendAiInsight, getNotificationContent } from "./notificationContent";
import type { EventType, NotificationDetails } from "../types";
import { generateTradeReasoning } from "../ai-models";
import { NotificationFailedError } from "../services/errors";

export const sendDiscordNotification = async (
  webhookUrl: string,
  name: string,
  eventType: EventType,
  details: NotificationDetails,
) => {
  const aiInsight = await generateTradeReasoning(eventType, details, {
    provider: "gemini",
    model: "gemini-2.5-flash",
  });
  const enrichedDetails: NotificationDetails = {
    ...details,
    ...(aiInsight ? { aiInsight } : {}),
  };
  const { subject, message } = getNotificationContent(
    name,
    eventType,
    enrichedDetails,
  );
  const finalMessage = appendAiInsight(message, enrichedDetails);

  const payload = {
    content: `**${subject}**\n\n${finalMessage}`,
    username: "QuantNest Trading Bot",
    avatar_url:
      "https://lh3.googleusercontent.com/-vU4ptXJemX0/AAAAAAAAAAI/AAAAAAAAAAA/ALKGfknUC98EoJllhyE3SFYkLuCTuPUwQA/s48-c/photo.jpg",
  };

  try {
    const response = await axios.post(webhookUrl, payload);
    console.log(`Discord notification sent for ${eventType}:`, response.status);
  } catch (error) {
    throw new NotificationFailedError(
      "discord",
      `${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
