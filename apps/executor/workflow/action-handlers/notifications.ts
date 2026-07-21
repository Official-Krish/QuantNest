import { sendDiscordNotification } from "../../executors/discord";
import { sendEmail } from "../../executors/gmail";
import { sendSlackDirectMessage } from "../../executors/slack";
import { sendTelegramMessage } from "../../executors/telegram";
import { sendWhatsAppMessage } from "../../executors/whatsapp";
import { executeNotificationAction } from "./shared";
import type { ExecutorActionHandlerId } from "@quantnest-trading/node-registry";
import type { IActionHandler } from "./base.handler";

abstract class BaseNotificationHandler implements IActionHandler {
  abstract readonly handlerId: ExecutorActionHandlerId;
  abstract readonly nodeTypeLabel: string;
  abstract readonly successMessage: string;
  abstract readonly failureType: string;
  abstract readonly failureTitle: string;
  abstract readonly failureMessage: string;
  abstract readonly source: string;

  abstract send(
    metadata: Record<string, unknown>,
    eventType: string,
    details: any,
  ): Promise<void>;

  async execute(params: any): Promise<void> {
    return executeNotificationAction({
      ...params,
      source: this.source,
      nodeTypeLabel: this.nodeTypeLabel,
      successMessage: this.successMessage,
      failureType: this.failureType,
      failureTitle: this.failureTitle,
      failureMessage: this.failureMessage,
      send: (metadata, eventType, details) =>
        this.send(metadata, eventType, details),
    });
  }
}

class GmailHandler extends BaseNotificationHandler {
  readonly handlerId = "gmail" as const;
  readonly source = "gmail";
  readonly nodeTypeLabel = "Gmail Action";
  readonly successMessage = "Email notification sent";
  readonly failureType = "gmail_delivery_failed";
  readonly failureTitle = "Gmail delivery failed";
  readonly failureMessage = "Failed to send email notification";

  async send(
    metadata: Record<string, unknown>,
    eventType: string,
    details: any,
  ): Promise<void> {
    await sendEmail(
      String(metadata.recipientEmail || ""),
      String(metadata.recipientName || "User"),
      eventType as any,
      details,
    );
  }
}

class DiscordHandler extends BaseNotificationHandler {
  readonly handlerId = "discord" as const;
  readonly source = "discord";
  readonly nodeTypeLabel = "Discord Action";
  readonly successMessage = "Discord notification sent";
  readonly failureType = "discord_webhook_failed";
  readonly failureTitle = "Discord webhook failed";
  readonly failureMessage = "Failed to send Discord notification";

  async send(
    metadata: Record<string, unknown>,
    eventType: string,
    details: any,
  ): Promise<void> {
    await sendDiscordNotification(
      String(metadata.webhookUrl || ""),
      String(metadata.recipientName || "User"),
      eventType as any,
      details,
    );
  }
}

class SlackHandler extends BaseNotificationHandler {
  readonly handlerId = "slack" as const;
  readonly source = "slack";
  readonly nodeTypeLabel = "Slack Action";
  readonly successMessage = "Slack direct message sent";
  readonly failureType = "slack_delivery_failed";
  readonly failureTitle = "Slack delivery failed";
  readonly failureMessage = "Failed to send Slack direct message";

  async send(
    metadata: Record<string, unknown>,
    eventType: string,
    details: any,
  ): Promise<void> {
    await sendSlackDirectMessage(
      String(metadata.slackBotToken || ""),
      String(metadata.slackUserId || ""),
      String(metadata.recipientName || "User"),
      eventType as any,
      details,
    );
  }
}

class TelegramHandler extends BaseNotificationHandler {
  readonly handlerId = "telegram" as const;
  readonly source = "telegram";
  readonly nodeTypeLabel = "Telegram Action";
  readonly successMessage = "Telegram message sent";
  readonly failureType = "telegram_delivery_failed";
  readonly failureTitle = "Telegram delivery failed";
  readonly failureMessage = "Failed to send Telegram message";

  async send(
    metadata: Record<string, unknown>,
    eventType: string,
    details: any,
  ): Promise<void> {
    await sendTelegramMessage(
      String(metadata.telegramBotToken || ""),
      String(metadata.telegramChatId || ""),
      String(metadata.recipientName || "User"),
      eventType as any,
      details,
    );
  }
}

class WhatsAppHandler extends BaseNotificationHandler {
  readonly handlerId = "whatsapp" as const;
  readonly source = "whatsapp";
  readonly nodeTypeLabel = "WhatsApp Action";
  readonly successMessage = "WhatsApp notification sent";
  readonly failureType = "whatsapp_send_failed";
  readonly failureTitle = "WhatsApp send failed";
  readonly failureMessage = "Failed to send WhatsApp notification";

  async send(
    metadata: Record<string, unknown>,
    eventType: string,
    details: any,
  ): Promise<void> {
    await sendWhatsAppMessage(
      String(metadata.recipientPhone || ""),
      String(metadata.recipientName || "User"),
      eventType as any,
      details,
    );
  }
}

export const gmailHandler: IActionHandler = new GmailHandler();
export const discordHandler: IActionHandler = new DiscordHandler();
export const slackHandler: IActionHandler = new SlackHandler();
export const telegramHandler: IActionHandler = new TelegramHandler();
export const whatsappHandler: IActionHandler = new WhatsAppHandler();
