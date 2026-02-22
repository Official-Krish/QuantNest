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

Your buy order has been successfully executed on QuantNest Trading.

Trade Details:
• Symbol: ${details.symbol}
• Quantity: ${details.quantity} units
• Exchange: ${details.exchange || 'NSE'}
• Executed At: ${new Date().toLocaleString()}

Your position has been updated accordingly. You can view your portfolio in the dashboard.

If you have any questions or concerns, please reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;

        case "sell":
            subject = 'Trade Executed: Sell Order Completed';
            message = `Dear ${name},

Your sell order has been successfully executed on QuantNest Trading.

Trade Details:
• Symbol: ${details.symbol}
• Quantity: ${details.quantity} units
• Exchange: ${details.exchange || 'NSE'}
• Executed At: ${new Date().toLocaleString()}

Your position has been updated accordingly. You can view your portfolio in the dashboard.

If you have any questions or concerns, please reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;

        case "price_trigger":
            subject = 'Price Alert: Target Price Reached';
            message = `Dear ${name},

Your price alert has been triggered on QuantNest Trading.

Price Alert Details:
• Symbol: ${details.symbol}
• Target Price: ₹${details.targetPrice}
• Condition: Price went ${details.condition} target
• Current Time: ${new Date().toLocaleString()}

Your workflow has been executed as configured. Check your dashboard for execution details.

If you have any questions or concerns, please reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;

        case "trade_failed":
            subject = 'Trade Failed: Action Required';
            message = `Dear ${name},

Unfortunately, your ${details.tradeType || 'trade'} order could not be executed on QuantNest Trading.

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

If the issue persists, please contact your broker or reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;

        case "Long":
            subject = 'Position Opened: Long Position Executed';
            message = `Dear ${name},

Your long position has been successfully opened on QuantNest Trading.

Position Details:
• Asset: ${details.symbol}
• Position Type: LONG
• Quantity: ${details.quantity} units
• Entry Price: ${details.price ? `$${details.price}` : 'Market Price'}
• Executed At: ${new Date().toLocaleString()}

A long position means you're betting on the price going up. Your position will profit if the asset price increases.

You can monitor your position and set stop-loss or take-profit levels in your dashboard.

If you have any questions or concerns, please reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;

        case "Short":
            subject = 'Position Opened: Short Position Executed';
            message = `Dear ${name},

Your short position has been successfully opened on QuantNest Trading.

Position Details:
• Asset: ${details.symbol}
• Position Type: SHORT
• Quantity: ${details.quantity} units
• Entry Price: ${details.price ? `$${details.price}` : 'Market Price'}
• Executed At: ${new Date().toLocaleString()}

A short position means you're betting on the price going down. Your position will profit if the asset price decreases.

You can monitor your position and set stop-loss or take-profit levels in your dashboard.

If you have any questions or concerns, please reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;

        case "notification":
            subject = 'Workflow Notification: Action Completed';
            message = `Dear ${name},

Your workflow has completed an action on QuantNest Trading.

Notification Details:
• Workflow: ${details.symbol || 'Trading Workflow'}
• Status: Completed
• Executed At: ${new Date().toLocaleString()}

${details.failureReason || 'Your workflow has been executed successfully as configured.'}

You can view detailed execution logs and results in your dashboard.

If you have any questions or concerns, please reach out to our support team at support@quantnesttrading.com.

Best regards,
QuantNest Trading Team`;
            break;
    }

    return { subject, message };
}

export function appendAiInsight(message: string, details: NotificationDetails): string {
    const insight = details.aiInsight;
    if (!insight) {
        return message;
    }

    const confidenceLine = `Confidence: ${insight.confidenceScore}/10 (${insight.confidence})`;

    return `${message}

AI Trade Insight:
${confidenceLine}
Reasoning: ${insight.reasoning}

Risk Warning:
${insight.riskFactors}`;
}
