import axios from "axios";
import { appendAiInsight, getNotificationContent } from "./notificationContent";
import { generateTradeReasoning } from "../ai-models";
import type { EventType, NotificationDetails } from "../types";

export async function sendWhatsAppMessage(
    phoneNumber: string,
    name: string,
    eventType: EventType,
    details: NotificationDetails
): Promise<void> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        throw new Error("WhatsApp credentials are not configured on executor");
    }
    if (!phoneNumber?.trim()) {
        throw new Error("Recipient phone number is required");
    }

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
    const body = `*${subject}*\n\n${finalMessage}`;

    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phoneNumber,
                type: "text",
                text: { body },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                maxBodyLength: Infinity,
            }
        );
    } catch (error: any) {
        const status = error?.response?.status;
        const responseMessage = error?.response?.data?.error?.message;
        throw new Error(
            responseMessage
                ? `WhatsApp send failed: ${responseMessage}`
                : status
                    ? `WhatsApp send failed (${status})`
                    : "WhatsApp send failed"
        );
    }

}
