import { checkTokenStatus, createUserNotification, getMarketStatus, getZerodhaToken, pauseWorkflow } from "@quantnest-trading/executor-utils";
import type { ExecutionStep } from "@quantnest-trading/types";
import { getNodeRegistryEntry } from "@quantnest-trading/node-registry";
import type { ExecutorActionHandlerId } from "@quantnest-trading/node-registry";
import { createGoogleDriveDailyTradesCsv } from "../executors/googleDrive";
import { createGoogleSheetsExecutionReport } from "../executors/googleSheets";
import { ExecuteLighter } from "../executors/lighter";
import { createNotionDailyReport, isNotionReportWindowOpen, wasNotionReportCreatedToday } from "../executors/notion";
import { wasDailyActionCreatedToday } from "../executors/reporting/helpers";
import { sendDiscordNotification } from "../executors/discord";
import { sendEmail } from "../executors/gmail";
import { sendSlackDirectMessage } from "../executors/slack";
import { sendTelegramMessage } from "../executors/telegram";
import { executeGrowwNode } from "../executors/groww";
import { sendWhatsAppMessage } from "../executors/whatsapp";
import { executeZerodhaNode } from "../executors/zerodha";
import type { EdgeType, NodeType } from "../types";
import { isMarketOpen } from "@quantnest-trading/market";
import type { ExecutionContext } from "./execute.context";
import { shouldSkipActionByCondition } from "./execute.context";
import { resolveExecutorNodeSecrets } from "../services/reusableSecrets";

function pushStep(
    steps: ExecutionStep[],
    step: Omit<ExecutionStep, "step">
): void {
    steps.push({
        step: steps.length + 1,
        ...step,
    });
}

type ExecuteActionNodeParams = {
    node: NodeType;
    nodes: NodeType[];
    edges: EdgeType[];
    context: ExecutionContext;
    nextCondition?: boolean;
    steps: ExecutionStep[];
};

type ActionHandlerParams = ExecuteActionNodeParams & {
    resolvedMetadata: Record<string, unknown>;
    type: string;
};

type ActionHandler = (params: ActionHandlerParams) => Promise<void>;

function getNotificationDetailsFallback(
    resolvedMetadata: Record<string, unknown>,
    context: ExecutionContext,
) {
    return {
        symbol: (resolvedMetadata as any)?.symbol || context.details?.symbol,
        exchange: (resolvedMetadata as any)?.exchange || "NSE",
        targetPrice: (resolvedMetadata as any)?.targetPrice,
        aiContext: context.details?.aiContext,
    };
}

async function executeNotificationAction(params: ActionHandlerParams & {
    nodeTypeLabel: string;
    successMessage: string;
    failureType: string;
    failureTitle: string;
    failureMessage: string;
    send: (metadata: Record<string, unknown>, eventType: string, details: any) => Promise<void>;
}) {
    const {
        node,
        context,
        nextCondition,
        steps,
        resolvedMetadata,
        nodeTypeLabel,
        successMessage,
        failureType,
        failureTitle,
        failureMessage,
        send,
    } = params;

    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }

        const eventType = context.eventType || "notification";
        const details = context.eventType && context.details
            ? context.details
            : getNotificationDetailsFallback(resolvedMetadata, context);

        await send(resolvedMetadata, eventType, details);

        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: nodeTypeLabel,
            status: "Success",
            message: successMessage,
        });
    } catch (error: any) {
        console.error(`${nodeTypeLabel} execution error:`, error);
        if (context.userId) {
            await createUserNotification({
                userId: context.userId,
                workflowId: context.workflowId,
                type: failureType,
                severity: "error",
                title: failureTitle,
                message: failureMessage || error?.message,
                metadata: { nodeId: node.nodeId },
                dedupeKey: `${failureType}:${context.workflowId}:${node.nodeId}`,
                dedupeWindowHours: 2,
            });
        }
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: nodeTypeLabel,
            status: "Failed",
            message: error?.message || failureMessage,
        });
    }
}

const noopActionHandler: ActionHandler = async () => {};

const delayActionHandler: ActionHandler = async ({ node, nextCondition, steps, resolvedMetadata }) => {
    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }
        const durationSeconds = Number((resolvedMetadata as any)?.durationSeconds || 0);
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
    } catch (error: any) {
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Delay Action",
            status: "Failed",
            message: error?.message || "Delay step failed",
        });
    }
};

const zerodhaActionHandler: ActionHandler = async ({ node, context, nextCondition, steps, resolvedMetadata }) => {
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
            (resolvedMetadata as any)?.qty,
            (resolvedMetadata as any)?.type,
            (resolvedMetadata as any)?.apiKey,
            accessToken,
            (resolvedMetadata as any)?.exchange || "NSE"
        );

        if (result === "SUCCESS") {
            context.eventType = (resolvedMetadata as any)?.type;
            context.details = {
                symbol: (resolvedMetadata as any)?.symbol,
                quantity: (resolvedMetadata as any)?.qty,
                exchange: (resolvedMetadata as any)?.exchange || "NSE",
                aiContext: context.details?.aiContext,
            };
            pushStep(steps, {
                nodeId: node.nodeId,
                nodeType: "Zerodha Action",
                status: "Success",
                message: `${String((resolvedMetadata as any)?.type || "").toUpperCase()} order executed for ${(resolvedMetadata as any)?.symbol}`,
            });
            return;
        }

        context.eventType = "trade_failed";
        context.details = {
            symbol: (resolvedMetadata as any)?.symbol,
            quantity: (resolvedMetadata as any)?.qty,
            exchange: (resolvedMetadata as any)?.exchange || "NSE",
            tradeType: (resolvedMetadata as any)?.type,
            failureReason: "Trade execution failed. Please check your broker account and credentials.",
            aiContext: context.details?.aiContext,
        };
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Zerodha Action",
            status: "Failed",
            message: `Trade execution failed for ${(resolvedMetadata as any)?.symbol}`,
        });
    } catch (error: any) {
        console.error("Zerodha execution error:", error);
        context.eventType = "trade_failed";
        context.details = {
            symbol: (resolvedMetadata as any)?.symbol,
            quantity: (resolvedMetadata as any)?.qty,
            exchange: (resolvedMetadata as any)?.exchange || "NSE",
            tradeType: (resolvedMetadata as any)?.type,
            failureReason: error.message || "Unknown error occurred during trade execution.",
            aiContext: context.details?.aiContext,
        };
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Zerodha Action",
            status: "Failed",
            message: error.message || "Zerodha execution failed",
        });
    }
};

const growwActionHandler: ActionHandler = async ({ node, context, nextCondition, steps, resolvedMetadata }) => {
    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }
        const result = await executeGrowwNode(
            (resolvedMetadata as any)?.symbol,
            (resolvedMetadata as any)?.qty,
            (resolvedMetadata as any)?.type,
            (resolvedMetadata as any)?.exchange || "NSE",
            (resolvedMetadata as any)?.accessToken
        );

        if (result === "SUCCESS") {
            context.eventType = (resolvedMetadata as any)?.type;
            context.details = {
                symbol: (resolvedMetadata as any)?.symbol,
                quantity: (resolvedMetadata as any)?.qty,
                exchange: (resolvedMetadata as any)?.exchange || "NSE",
                aiContext: context.details?.aiContext,
            };
            pushStep(steps, {
                nodeId: node.nodeId,
                nodeType: "Groww Action",
                status: "Success",
                message: `${String((resolvedMetadata as any)?.type || "").toUpperCase()} order executed for ${(resolvedMetadata as any)?.symbol}`,
            });
            return;
        }

        context.eventType = "trade_failed";
        context.details = {
            symbol: (resolvedMetadata as any)?.symbol,
            quantity: (resolvedMetadata as any)?.qty,
            exchange: (resolvedMetadata as any)?.exchange || "NSE",
            tradeType: (resolvedMetadata as any)?.type,
            failureReason: "Trade execution failed. Please check your broker account and credentials.",
            aiContext: context.details?.aiContext,
        };
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Groww Action",
            status: "Failed",
            message: `Trade execution failed for ${(resolvedMetadata as any)?.symbol}`,
        });
    } catch (error: any) {
        console.error("Groww execution error:", error);
        context.eventType = "trade_failed";
        context.details = {
            symbol: (resolvedMetadata as any)?.symbol,
            quantity: (resolvedMetadata as any)?.qty,
            exchange: (resolvedMetadata as any)?.exchange || "NSE",
            tradeType: (resolvedMetadata as any)?.type,
            failureReason: error.message || "Unknown error occurred during trade execution.",
            aiContext: context.details?.aiContext,
        };
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Groww Action",
            status: "Failed",
            message: error.message || "Groww execution failed",
        });
    }
};

const gmailActionHandler: ActionHandler = async (params) =>
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

const discordActionHandler: ActionHandler = async (params) =>
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

const slackActionHandler: ActionHandler = async (params) =>
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

const telegramActionHandler: ActionHandler = async (params) =>
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

const whatsappActionHandler: ActionHandler = async (params) =>
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

const notionActionHandler: ActionHandler = async ({ node, nodes, context, nextCondition, steps, resolvedMetadata }) => {
    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }
        if (!context.workflowId) throw new Error("Workflow ID is required to generate daily report");
        if (!context.userId) throw new Error("User ID is required to generate daily report");
        if (!isNotionReportWindowOpen()) return;
        if (await wasNotionReportCreatedToday(context.workflowId, node.nodeId)) return;

        const reportId = await createNotionDailyReport({
            workflowId: context.workflowId,
            userId: context.userId,
            nodes,
            metadata: {
                notionApiKey: (resolvedMetadata as any)?.notionApiKey,
                parentPageId: (resolvedMetadata as any)?.parentPageId,
                aiConsent: (resolvedMetadata as any)?.aiConsent,
            },
        });

        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Notion Daily Report",
            status: "Success",
            message: `Notion report created (${reportId})`,
        });
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
    }
};

const googleDriveActionHandler: ActionHandler = async ({ node, nodes, context, nextCondition, steps, resolvedMetadata }) => {
    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }
        if (!context.workflowId) throw new Error("Workflow ID is required to export Google Drive CSV");
        if (!context.userId) throw new Error("User ID is required to export Google Drive CSV");
        if (!isNotionReportWindowOpen()) return;
        if (await wasDailyActionCreatedToday(context.workflowId, node.nodeId, "Google Drive Daily CSV")) return;

        const fileId = await createGoogleDriveDailyTradesCsv({
            workflowId: context.workflowId,
            userId: context.userId,
            nodes,
            metadata: {
                googleClientEmail: (resolvedMetadata as any)?.googleClientEmail,
                googlePrivateKey: (resolvedMetadata as any)?.googlePrivateKey,
                googleDriveFolderId: (resolvedMetadata as any)?.googleDriveFolderId,
                filePrefix: (resolvedMetadata as any)?.filePrefix,
                aiConsent: (resolvedMetadata as any)?.aiConsent,
            },
        });

        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Google Drive Daily CSV",
            status: "Success",
            message: `Drive CSV uploaded (${fileId})`,
        });
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
    }
};

const googleSheetsActionHandler: ActionHandler = async ({ node, context, nextCondition, steps, resolvedMetadata }) => {
    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }
        if (!context.workflowId) throw new Error("Workflow ID is required to append Google Sheets report");
        if (!context.userId) throw new Error("User ID is required to append Google Sheets report");

        const updatedRange = await createGoogleSheetsExecutionReport({
            workflowId: context.workflowId,
            userId: context.userId,
            metadata: {
                sheetUrl: (resolvedMetadata as any)?.sheetUrl,
                sheetId: (resolvedMetadata as any)?.sheetId,
                sheetName: (resolvedMetadata as any)?.sheetName,
            },
            context,
        });

        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Google Sheets Report",
            status: "Success",
            message: `Google Sheets row appended (${updatedRange})`,
        });
    } catch (error: any) {
        console.error("Google Sheets report append error:", error);
        if (context.userId) {
            await createUserNotification({
                userId: context.userId,
                workflowId: context.workflowId,
                type: "google_sheets_report_failed",
                severity: "error",
                title: "Google Sheets report failed",
                message: error?.message || "Failed to append workflow report row to Google Sheets.",
                metadata: { nodeId: node.nodeId },
                dedupeKey: `google-sheets-report-failed:${context.workflowId}:${node.nodeId}`,
                dedupeWindowHours: 6,
            });
        }
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Google Sheets Report",
            status: "Failed",
            message: error?.message || "Failed to append Google Sheets row",
        });
    }
};

const lighterActionHandler: ActionHandler = async ({ node, nextCondition, steps, resolvedMetadata }) => {
    try {
        if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
            return;
        }
        await ExecuteLighter(
            (resolvedMetadata as any)?.symbol,
            (resolvedMetadata as any)?.amount,
            (resolvedMetadata as any)?.type,
            (resolvedMetadata as any)?.apiKey,
            (resolvedMetadata as any)?.accountIndex,
            (resolvedMetadata as any)?.apiKeyIndex
        );
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Lighter Action",
            status: "Success",
            message: "Lighter action executed (placeholder)",
        });
    } catch (error) {
        console.error("Lighter execution error:", error);
        pushStep(steps, {
            nodeId: node.nodeId,
            nodeType: "Lighter Action",
            status: "Failed",
            message: "Lighter execution failed",
        });
    }
};

const actionHandlerMap: Record<ExecutorActionHandlerId, ActionHandler> = {
    noop: noopActionHandler,
    delay: delayActionHandler,
    zerodha: zerodhaActionHandler,
    groww: growwActionHandler,
    lighter: lighterActionHandler,
    gmail: gmailActionHandler,
    slack: slackActionHandler,
    telegram: telegramActionHandler,
    discord: discordActionHandler,
    whatsapp: whatsappActionHandler,
    "notion-daily-report": notionActionHandler,
    "google-drive-daily-csv": googleDriveActionHandler,
    "google-sheets-report": googleSheetsActionHandler,
};

export async function executeActionNode(params: {
    node: NodeType;
    nodes: NodeType[];
    edges: EdgeType[];
    context: ExecutionContext;
    nextCondition?: boolean;
    steps: ExecutionStep[];
}): Promise<void> {
    const { node, context } = params;
    const type = String(node.type || "").toLowerCase();
    const registryEntry = getNodeRegistryEntry(type);
    const handlerId = registryEntry?.executorActionHandlerId;
    const reusableSecretService = registryEntry?.reusableSecretService;
    const resolvedMetadata = reusableSecretService
        ? await resolveExecutorNodeSecrets({
            userId: context.userId,
            service: reusableSecretService as Parameters<typeof resolveExecutorNodeSecrets>[0]["service"],
            metadata: node.data?.metadata || {},
        })
        : node.data?.metadata || {};
    if (!handlerId) {
        return;
    }

    const handler = actionHandlerMap[handlerId];
    if (!handler) {
        return;
    }

    await handler({
        ...params,
        resolvedMetadata: resolvedMetadata as Record<string, unknown>,
        type,
    });
}
