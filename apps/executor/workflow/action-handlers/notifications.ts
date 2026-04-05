import { sendDiscordNotification } from "../../executors/discord";
import { sendEmail } from "../../executors/gmail";
import { sendSlackDirectMessage } from "../../executors/slack";
import { sendTelegramMessage } from "../../executors/telegram";
import { sendWhatsAppMessage } from "../../executors/whatsapp";
import { executeNotificationAction, type ActionHandler } from "./shared";

export const gmailActionHandler: ActionHandler = async (params) =>
  executeNotificationAction({
    ...params,
    nodeTypeLabel: "Gmail Action",
    successMessage: "Email notification sent",
    failureType: "gmail_delivery_failed",
    failureTitle: "Gmail delivery failed",
    failureMessage: "Failed to send email notification",
    send: (metadata, eventType, details) =>
      sendEmail(
        String(metadata.recipientEmail || ""),
        String(metadata.recipientName || "User"),
        eventType as any,
        details,
      ),
  });

export const discordActionHandler: ActionHandler = async (params) =>
  executeNotificationAction({
    ...params,
    nodeTypeLabel: "Discord Action",
    successMessage: "Discord notification sent",
    failureType: "discord_webhook_failed",
    failureTitle: "Discord webhook failed",
    failureMessage: "Failed to send Discord notification",
    send: (metadata, eventType, details) =>
      sendDiscordNotification(
        String(metadata.webhookUrl || ""),
        String(metadata.recipientName || "User"),
        eventType as any,
        details,
      ),
  });

export const slackActionHandler: ActionHandler = async (params) =>
  executeNotificationAction({
    ...params,
    nodeTypeLabel: "Slack Action",
    successMessage: "Slack direct message sent",
    failureType: "slack_delivery_failed",
    failureTitle: "Slack delivery failed",
    failureMessage: "Failed to send Slack direct message",
    send: (metadata, eventType, details) =>
      sendSlackDirectMessage(
        String(metadata.slackBotToken || ""),
        String(metadata.slackUserId || ""),
        String(metadata.recipientName || "User"),
        eventType as any,
        details,
      ),
  });

export const telegramActionHandler: ActionHandler = async (params) =>
  executeNotificationAction({
    ...params,
    nodeTypeLabel: "Telegram Action",
    successMessage: "Telegram message sent",
    failureType: "telegram_delivery_failed",
    failureTitle: "Telegram delivery failed",
    failureMessage: "Failed to send Telegram message",
    send: (metadata, eventType, details) =>
      sendTelegramMessage(
        String(metadata.telegramBotToken || ""),
        String(metadata.telegramChatId || ""),
        String(metadata.recipientName || "User"),
        eventType as any,
        details,
      ),
  });

export const whatsappActionHandler: ActionHandler = async (params) =>
  executeNotificationAction({
    ...params,
    nodeTypeLabel: "WhatsApp Action",
    successMessage: "WhatsApp notification sent",
    failureType: "whatsapp_send_failed",
    failureTitle: "WhatsApp send failed",
    failureMessage: "Failed to send WhatsApp notification",
    send: (metadata, eventType, details) =>
      sendWhatsAppMessage(
        String(metadata.recipientPhone || ""),
        String(metadata.recipientName || "User"),
        eventType as any,
        details,
      ),
  });
