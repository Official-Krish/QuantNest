import { checkTokenStatus, createUserNotification, getMarketStatus, getZerodhaToken, pauseWorkflow } from "@quantnest-trading/executor-utils";
import type { ExecutionStep } from "@quantnest-trading/types";
import { createGoogleDriveDailyTradesCsv } from "../executors/googleDrive";
import { ExecuteLighter } from "../executors/lighter";
import { createNotionDailyReport, isNotionReportWindowOpen, wasNotionReportCreatedToday } from "../executors/notion";
import { wasDailyActionCreatedToday } from "../executors/reporting/helpers";
import { sendDiscordNotification } from "../executors/discord";
import { sendEmail } from "../executors/gmail";
import { sendSlackDirectMessage } from "../executors/slack";
import { executeGrowwNode } from "../executors/groww";
import { sendWhatsAppMessage } from "../executors/whatsapp";
import { executeZerodhaNode } from "../executors/zerodha";
import type { EdgeType, NodeType } from "../types";
import { isMarketOpen } from "@quantnest-trading/market";
import type { ExecutionContext } from "./execute.context";
import { shouldSkipActionByCondition } from "./execute.context";

function pushStep(
    steps: ExecutionStep[],
    step: Omit<ExecutionStep, "step">
): void {
    steps.push({
        step: steps.length + 1,
        ...step,
    });
}

export async function executeActionNode(params: {
    node: NodeType;
    nodes: NodeType[];
    edges: EdgeType[];
    context: ExecutionContext;
    nextCondition?: boolean;
    steps: ExecutionStep[];
}): Promise<void> {
    const { node, nodes, context, nextCondition, steps } = params;

    switch (node.type) {
        case "conditional":
        case "conditional-trigger":
        case "if":
            return;

        case "delay":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                const durationSeconds = Number(node.data?.metadata?.durationSeconds || 0);
                if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
                    pushStep(steps, {
                        nodeId: node.nodeId,
                        nodeType: "Delay Action",
                        status: "Failed",
                        message: "Delay duration is missing or invalid",
                    });
                    return;
                }

                await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Delay Action",
                    status: "Success",
                    message: `Waited ${durationSeconds} second${durationSeconds === 1 ? "" : "s"}`,
                });
                return;
            } catch (error: any) {
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Delay Action",
                    status: "Failed",
                    message: error?.message || "Delay step failed",
                });
                return;
            }

        case "zerodha":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (!isMarketOpen()) {
                    const marketStatus = getMarketStatus();
                    pushStep(steps, {
                        nodeId: node.nodeId,
                        nodeType: "Zerodha Action",
                        status: "Failed",
                        message: `Cannot execute trade: ${marketStatus.message}. ${marketStatus.nextOpenTime ? `Next opening: ${marketStatus.nextOpenTime}` : ""}`,
                    });
                    return;
                }

                const tokenStatus = await checkTokenStatus(context.userId || "", context.workflowId || "");
                if (!tokenStatus.hasValidToken) {
                    if (context.userId && context.workflowId) {
                        await pauseWorkflow(context.workflowId);
                        await createUserNotification({
                            userId: context.userId,
                            workflowId: context.workflowId,
                            type: tokenStatus.message.toLowerCase().includes("expired")
                                ? "broker_token_expired"
                                : "broker_credentials_invalid",
                            severity: "error",
                            title: tokenStatus.message.toLowerCase().includes("expired")
                                ? "Zerodha token expired"
                                : "Zerodha credentials unavailable",
                            message: `${tokenStatus.message} Workflow has been paused until the issue is fixed.`,
                            metadata: {
                                broker: "zerodha",
                                tokenRequestId: tokenStatus.tokenRequestId,
                            },
                            dedupeKey: `zerodha-token-status:${context.workflowId}:${tokenStatus.message}`,
                            dedupeWindowHours: 24,
                        });
                    }
                    pushStep(steps, {
                        nodeId: node.nodeId,
                        nodeType: "Zerodha Action",
                        status: "Failed",
                        message: `Workflow paused: ${tokenStatus.message}${tokenStatus.tokenRequestId ? ` (Request ID: ${tokenStatus.tokenRequestId})` : ""}`,
                    });
                    return;
                }

                const accessToken = await getZerodhaToken(context.userId || "", context.workflowId || "");
                if (!accessToken) {
                    pushStep(steps, {
                        nodeId: node.nodeId,
                        nodeType: "Zerodha Action",
                        status: "Failed",
                        message: "Workflow paused: Access token not available. Please provide your Zerodha access token.",
                    });
                    return;
                }

                const result = await executeZerodhaNode(
                    node.data?.metadata?.symbol,
                    node.data?.metadata?.qty,
                    node.data?.metadata?.type,
                    node.data?.metadata?.apiKey,
                    accessToken,
                    node.data?.metadata?.exchange || "NSE"
                );

                if (result === "SUCCESS") {
                    context.eventType = node.data?.metadata?.type;
                    context.details = {
                        symbol: node.data?.metadata?.symbol,
                        quantity: node.data?.metadata?.qty,
                        exchange: node.data?.metadata?.exchange || "NSE",
                        aiContext: context.details?.aiContext,
                    };
                    pushStep(steps, {
                        nodeId: node.nodeId,
                        nodeType: "Zerodha Action",
                        status: "Success",
                        message: `${node.data?.metadata?.type.toUpperCase()} order executed for ${node.data?.metadata?.symbol}`,
                    });
                    return;
                }

                context.eventType = "trade_failed";
                context.details = {
                    symbol: node.data?.metadata?.symbol,
                    quantity: node.data?.metadata?.qty,
                    exchange: node.data?.metadata?.exchange || "NSE",
                    tradeType: node.data?.metadata?.type,
                    failureReason: "Trade execution failed. Please check your broker account and credentials.",
                    aiContext: context.details?.aiContext,
                };
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Zerodha Action",
                    status: "Failed",
                    message: `Trade execution failed for ${node.data?.metadata?.symbol}`,
                });
                return;
            } catch (error: any) {
                console.error("Zerodha execution error:", error);
                context.eventType = "trade_failed";
                context.details = {
                    symbol: node.data?.metadata?.symbol,
                    quantity: node.data?.metadata?.qty,
                    exchange: node.data?.metadata?.exchange || "NSE",
                    tradeType: node.data?.metadata?.type,
                    failureReason: error.message || "Unknown error occurred during trade execution.",
                    aiContext: context.details?.aiContext,
                };
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Zerodha Action",
                    status: "Failed",
                    message: error.message || "Zerodha execution failed",
                });
                return;
            }

        case "groww":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                const result = await executeGrowwNode(
                    node.data?.metadata?.symbol,
                    node.data?.metadata?.qty,
                    node.data?.metadata?.type,
                    node.data?.metadata?.exchange || "NSE",
                    node.data?.metadata?.accessToken
                );

                if (result === "SUCCESS") {
                    context.eventType = node.data?.metadata?.type;
                    context.details = {
                        symbol: node.data?.metadata?.symbol,
                        quantity: node.data?.metadata?.qty,
                        exchange: node.data?.metadata?.exchange || "NSE",
                        aiContext: context.details?.aiContext,
                    };
                    pushStep(steps, {
                        nodeId: node.nodeId,
                        nodeType: "Groww Action",
                        status: "Success",
                        message: `${node.data?.metadata?.type.toUpperCase()} order executed for ${node.data?.metadata?.symbol}`,
                    });
                    return;
                }

                context.eventType = "trade_failed";
                context.details = {
                    symbol: node.data?.metadata?.symbol,
                    quantity: node.data?.metadata?.qty,
                    exchange: node.data?.metadata?.exchange || "NSE",
                    tradeType: node.data?.metadata?.type,
                    failureReason: "Trade execution failed. Please check your broker account and credentials.",
                    aiContext: context.details?.aiContext,
                };
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Groww Action",
                    status: "Failed",
                    message: `Trade execution failed for ${node.data?.metadata?.symbol}`,
                });
                return;
            } catch (error: any) {
                console.error("Groww execution error:", error);
                context.eventType = "trade_failed";
                context.details = {
                    symbol: node.data?.metadata?.symbol,
                    quantity: node.data?.metadata?.qty,
                    exchange: node.data?.metadata?.exchange || "NSE",
                    tradeType: node.data?.metadata?.type,
                    failureReason: error.message || "Unknown error occurred during trade execution.",
                    aiContext: context.details?.aiContext,
                };
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Groww Action",
                    status: "Failed",
                    message: error.message || "Groww execution failed",
                });
                return;
            }

        case "gmail":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (context.eventType && context.details) {
                    await sendEmail(
                        node.data?.metadata?.recipientEmail || "",
                        node.data?.metadata?.recipientName || "User",
                        context.eventType,
                        context.details
                    );
                } else {
                    await sendEmail(
                        node.data?.metadata?.recipientEmail || "",
                        node.data?.metadata?.recipientName || "User",
                        "notification",
                        {
                            symbol: node.data?.metadata?.symbol || context.details?.symbol,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            targetPrice: node.data?.metadata?.targetPrice,
                            aiContext: context.details?.aiContext,
                        }
                    );
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Gmail Action",
                    status: "Success",
                    message: "Email notification sent",
                });
                return;
            } catch (error) {
                console.error("Gmail execution error:", error);
                if (context.userId) {
                    await createUserNotification({
                        userId: context.userId,
                        workflowId: context.workflowId,
                        type: "gmail_delivery_failed",
                        severity: "error",
                        title: "Gmail delivery failed",
                        message: "A Gmail notification action could not be delivered.",
                        metadata: { nodeId: node.nodeId },
                        dedupeKey: `gmail-failed:${context.workflowId}:${node.nodeId}`,
                        dedupeWindowHours: 2,
                    });
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Gmail Action",
                    status: "Failed",
                    message: "Failed to send email notification",
                });
                return;
            }

        case "discord":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (context.eventType && context.details) {
                    await sendDiscordNotification(
                        node.data?.metadata?.webhookUrl || "",
                        node.data?.metadata?.recipientName || "User",
                        context.eventType,
                        context.details
                    );
                } else {
                    await sendDiscordNotification(
                        node.data?.metadata?.webhookUrl || "",
                        node.data?.metadata?.recipientName || "User",
                        "notification",
                        {
                            symbol: node.data?.metadata?.symbol || context.details?.symbol,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            targetPrice: node.data?.metadata?.targetPrice,
                            aiContext: context.details?.aiContext,
                        }
                    );
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Discord Action",
                    status: "Success",
                    message: "Discord notification sent",
                });
                return;
            } catch (error) {
                console.error("Discord execution error:", error);
                if (context.userId) {
                    await createUserNotification({
                        userId: context.userId,
                        workflowId: context.workflowId,
                        type: "discord_webhook_failed",
                        severity: "error",
                        title: "Discord webhook failed",
                        message: "A Discord notification action could not be delivered.",
                        metadata: { nodeId: node.nodeId },
                        dedupeKey: `discord-failed:${context.workflowId}:${node.nodeId}`,
                        dedupeWindowHours: 2,
                    });
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Discord Action",
                    status: "Failed",
                    message: "Failed to send Discord notification",
                });
                return;
            }

        case "slack":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (context.eventType && context.details) {
                    await sendSlackDirectMessage(
                        node.data?.metadata?.slackBotToken || "",
                        node.data?.metadata?.slackUserId || "",
                        node.data?.metadata?.recipientName || "User",
                        context.eventType,
                        context.details
                    );
                } else {
                    await sendSlackDirectMessage(
                        node.data?.metadata?.slackBotToken || "",
                        node.data?.metadata?.slackUserId || "",
                        node.data?.metadata?.recipientName || "User",
                        "notification",
                        {
                            symbol: node.data?.metadata?.symbol || context.details?.symbol,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            targetPrice: node.data?.metadata?.targetPrice,
                            aiContext: context.details?.aiContext,
                        }
                    );
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Slack Action",
                    status: "Success",
                    message: "Slack direct message sent",
                });
                return;
            } catch (error) {
                console.error("Slack execution error:", error);
                if (context.userId) {
                    await createUserNotification({
                        userId: context.userId,
                        workflowId: context.workflowId,
                        type: "slack_delivery_failed",
                        severity: "error",
                        title: "Slack delivery failed",
                        message: "A Slack notification action could not be delivered.",
                        metadata: { nodeId: node.nodeId },
                        dedupeKey: `slack-failed:${context.workflowId}:${node.nodeId}`,
                        dedupeWindowHours: 2,
                    });
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Slack Action",
                    status: "Failed",
                    message: "Failed to send Slack direct message",
                });
                return;
            }

        case "whatsapp":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (context.eventType && context.details) {
                    await sendWhatsAppMessage(
                        node.data?.metadata?.recipientPhone || "",
                        node.data?.metadata?.recipientName || "User",
                        context.eventType,
                        context.details
                    );
                } else {
                    await sendWhatsAppMessage(
                        node.data?.metadata?.recipientPhone || "",
                        node.data?.metadata?.recipientName || "User",
                        "notification",
                        {
                            symbol: node.data?.metadata?.symbol || context.details?.symbol,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            targetPrice: node.data?.metadata?.targetPrice,
                            aiContext: context.details?.aiContext,
                        }
                    );
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "WhatsApp Action",
                    status: "Success",
                    message: "WhatsApp notification sent",
                });
                return;
            } catch (error: any) {
                console.error("WhatsApp execution error:", error);
                if (context.userId) {
                    await createUserNotification({
                        userId: context.userId,
                        workflowId: context.workflowId,
                        type: "whatsapp_send_failed",
                        severity: "error",
                        title: "WhatsApp send failed",
                        message: error?.message || "A WhatsApp notification action could not be delivered.",
                        metadata: { nodeId: node.nodeId },
                        dedupeKey: `whatsapp-failed:${context.workflowId}:${node.nodeId}`,
                        dedupeWindowHours: 2,
                    });
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "WhatsApp Action",
                    status: "Failed",
                    message: error?.message || "Failed to send WhatsApp notification",
                });
                return;
            }

        case "notion-daily-report":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (!context.workflowId) {
                    throw new Error("Workflow ID is required to generate daily report");
                }
                if (!context.userId) {
                    throw new Error("User ID is required to generate daily report");
                }
                if (!isNotionReportWindowOpen()) {
                    return;
                }
                if (await wasNotionReportCreatedToday(context.workflowId, node.nodeId)) {
                    return;
                }

                const reportId = await createNotionDailyReport({
                    workflowId: context.workflowId,
                    userId: context.userId,
                    nodes,
                    metadata: {
                        notionApiKey: node.data?.metadata?.notionApiKey,
                        parentPageId: node.data?.metadata?.parentPageId,
                        aiConsent: node.data?.metadata?.aiConsent,
                    },
                });

                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Notion Daily Report",
                    status: "Success",
                    message: `Notion report created (${reportId})`,
                });
                return;
            } catch (error: any) {
                console.error("Notion report execution error:", error);
                if (context.userId) {
                    await createUserNotification({
                        userId: context.userId,
                        workflowId: context.workflowId,
                        type: "notion_report_failed",
                        severity: "error",
                        title: "Notion report creation failed",
                        message: error?.message || "The Notion reporting action failed.",
                        metadata: { nodeId: node.nodeId },
                        dedupeKey: `notion-report-failed:${context.workflowId}:${node.nodeId}`,
                        dedupeWindowHours: 6,
                    });
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Notion Daily Report",
                    status: "Failed",
                    message: error?.message || "Failed to create Notion report",
                });
                return;
            }

        case "google-drive-daily-csv":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                if (!context.workflowId) {
                    throw new Error("Workflow ID is required to export Google Drive CSV");
                }
                if (!context.userId) {
                    throw new Error("User ID is required to export Google Drive CSV");
                }
                if (!isNotionReportWindowOpen()) {
                    return;
                }
                if (await wasDailyActionCreatedToday(context.workflowId, node.nodeId, "Google Drive Daily CSV")) {
                    return;
                }

                const fileId = await createGoogleDriveDailyTradesCsv({
                    workflowId: context.workflowId,
                    userId: context.userId,
                    nodes,
                    metadata: {
                        googleClientEmail: node.data?.metadata?.googleClientEmail,
                        googlePrivateKey: node.data?.metadata?.googlePrivateKey,
                        googleDriveFolderId: node.data?.metadata?.googleDriveFolderId,
                        filePrefix: node.data?.metadata?.filePrefix,
                        aiConsent: node.data?.metadata?.aiConsent,
                    },
                });

                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Google Drive Daily CSV",
                    status: "Success",
                    message: `Drive CSV uploaded (${fileId})`,
                });
                return;
            } catch (error: any) {
                console.error("Google Drive CSV export error:", error);
                if (context.userId) {
                    await createUserNotification({
                        userId: context.userId,
                        workflowId: context.workflowId,
                        type: "google_drive_upload_failed",
                        severity: "error",
                        title: "Google Drive upload failed",
                        message: error?.message || "The daily CSV export could not be uploaded to Google Drive.",
                        metadata: { nodeId: node.nodeId },
                        dedupeKey: `gdrive-upload-failed:${context.workflowId}:${node.nodeId}`,
                        dedupeWindowHours: 6,
                    });
                }
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Google Drive Daily CSV",
                    status: "Failed",
                    message: error?.message || "Failed to upload daily CSV to Google Drive",
                });
                return;
            }

        case "lighter":
            try {
                if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
                    return;
                }
                await ExecuteLighter(
                    node.data?.metadata?.symbol,
                    node.data?.metadata?.amount,
                    node.data?.metadata?.type,
                    node.data?.metadata?.apiKey,
                    node.data?.metadata?.accountIndex,
                    node.data?.metadata?.apiKeyIndex
                );
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Lighter Action",
                    status: "Success",
                    message: "Lighter action executed (placeholder)",
                });
                return;
            } catch (error) {
                console.error("Lighter execution error:", error);
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Lighter Action",
                    status: "Failed",
                    message: "Lighter execution failed",
                });
                return;
            }
    }
}
