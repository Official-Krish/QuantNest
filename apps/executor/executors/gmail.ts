require("dotenv").config();
import { Resend } from 'resend';
import { appendAiInsight, getNotificationContent } from './notificationContent';
import type { EventType, NotificationDetails } from '../types';
import { generateTradeReasoning } from '../ai-models';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
    recipientEmail: string, 
    name: string, 
    eventType: EventType,
    details: NotificationDetails
) {
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
    
    try {
        await resend.emails.send({
            from: 'QuantNest Trading <support@quantnesttrading.com>',
            to: recipientEmail,
            subject: subject,
            html: finalMessage.replace(/\n/g, '<br>')
        });
        console.log(`Email sent to ${recipientEmail} for ${eventType}`);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}
