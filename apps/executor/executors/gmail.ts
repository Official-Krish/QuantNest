require("dotenv").config();
import { Resend } from 'resend';
import { getNotificationContent } from './notificationContent';
import type { EventType, NotificationDetails } from '../types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
    recipientEmail: string, 
    name: string, 
    eventType: EventType,
    details: NotificationDetails
) {
    const { subject, message } = getNotificationContent(name, eventType, details);

    try {
        await resend.emails.send({
            from: 'N8n Trading <support@n8ntrading.com>',
            to: recipientEmail,
            subject: subject,
            html: message.replace(/\n/g, '<br>')
        });
        console.log(`Email sent to ${recipientEmail} for ${eventType}`);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}