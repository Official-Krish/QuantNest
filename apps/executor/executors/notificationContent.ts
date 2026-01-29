import type { EventType, NotificationContent, NotificationDetails } from "../types";

export function getNotificationContent(
    name: string,
    eventType: EventType,
    details: NotificationDetails
): NotificationContent {
    let subject = '';
    let message = '';

    switch (eventType) {
        case "buy":
            subject = 'Trade Executed: Buy Order Completed';
            message = `Dear ${name},

Your buy order has been successfully executed on N8n Trading.

Trade Details:
• Symbol: ${details.symbol}
• Quantity: ${details.quantity} units
• Exchange: ${details.exchange || 'NSE'}
• Executed At: ${new Date().toLocaleString()}

Your position has been updated accordingly. You can view your portfolio in the dashboard.

If you have any questions or concerns, please reach out to our support team at support@n8ntrading.com.

Best regards,
N8n Trading Team`;
            break;

        case "sell":
            subject = 'Trade Executed: Sell Order Completed';
            message = `Dear ${name},

Your sell order has been successfully executed on N8n Trading.

Trade Details:
• Symbol: ${details.symbol}
• Quantity: ${details.quantity} units
• Exchange: ${details.exchange || 'NSE'}
• Executed At: ${new Date().toLocaleString()}

Your position has been updated accordingly. You can view your portfolio in the dashboard.

If you have any questions or concerns, please reach out to our support team at support@n8ntrading.com.

Best regards,
N8n Trading Team`;
            break;

        case "price_trigger":
            subject = 'Price Alert: Target Price Reached';
            message = `Dear ${name},

Your price alert has been triggered on N8n Trading.

Price Alert Details:
• Symbol: ${details.symbol}
• Target Price: ₹${details.targetPrice}
• Condition: Price went ${details.condition} target
• Current Time: ${new Date().toLocaleString()}

Your workflow has been executed as configured. Check your dashboard for execution details.

If you have any questions or concerns, please reach out to our support team at support@n8ntrading.com.

Best regards,
N8n Trading Team`;
            break;

        case "trade_failed":
            subject = 'Trade Failed: Action Required';
            message = `Dear ${name},

Unfortunately, your ${details.tradeType || 'trade'} order could not be executed on N8n Trading.

Trade Details:
• Symbol: ${details.symbol}
• Quantity: ${details.quantity} units
• Exchange: ${details.exchange || 'NSE'}
• Trade Type: ${details.tradeType?.toUpperCase()}
• Failed At: ${new Date().toLocaleString()}

Failure Reason:
${details.failureReason || 'Unknown error occurred'}

Common reasons for trade failures:
• Insufficient funds in your trading account
• API key or access token expired/invalid
• Market hours - Trading is closed
• Invalid trading symbol or quantity
• Broker server connectivity issues
• Rate limits exceeded
• Incorrect exchange or trading permissions

Recommended Actions:
1. Check your account balance and ensure sufficient funds
2. Verify your API credentials are valid and not expired
3. Ensure you're trading during market hours
4. Review your broker account permissions
5. Check the symbol and exchange settings

If the issue persists, please contact your broker or reach out to our support team at support@n8ntrading.com.

Best regards,
N8n Trading Team`;
            break;
    }

    return { subject, message };
}
