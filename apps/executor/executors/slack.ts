import { WebClient } from "@slack/web-api";
import { appendAiInsight, getNotificationContent } from "./notificationContent";
import type { EventType, NotificationDetails } from "../types";
import { generateTradeReasoning } from "../ai-models";

export async function sendSlackDirectMessage(
  slackBotToken: string,
  slackUserId: string,
  name: string,
  eventType: EventType,
  details: NotificationDetails,
) {
  const client = new WebClient(slackBotToken);

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

  const conversation = await client.conversations.open({
    users: slackUserId,
  });

  const channelId = conversation.channel?.id;
  if (!channelId) {
    throw new Error("Slack DM channel could not be opened.");
  }

  await client.chat.postMessage({
    channel: channelId,
    text: `${subject}\n\n${finalMessage}`,
  });
}
