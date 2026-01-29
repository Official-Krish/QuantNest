import axios from "axios";
import { getNotificationContent } from './notificationContent';
import type { EventType, NotificationDetails } from "../types";

export const sendDiscordNotification = async (
  webhookUrl: string, 
  name: string, 
  eventType: EventType,
  details: NotificationDetails
) => {
    try {
        const { subject, message } = getNotificationContent(name, eventType, details);

        const payload = {
        content: `**${subject}**\n\n${message}`, 
        username: "N8n Trading Bot", 
        avatar_url: "https://lh3.googleusercontent.com/-vU4ptXJemX0/AAAAAAAAAAI/AAAAAAAAAAA/ALKGfknUC98EoJllhyE3SFYkLuCTuPUwQA/s48-c/photo.jpg",
        };

        const response = await axios.post(webhookUrl, payload);
        console.log(`Discord notification sent for ${eventType}:`, response.status);
    } catch (error) {
        console.error("Error sending Discord notification:", error);
    }
};