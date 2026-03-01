import { checkTokenStatus, getMarketStatus, getZerodhaToken } from "@quantnest-trading/executor-utils";
import type { ExecutionStep } from "@quantnest-trading/types";
import { ExecuteLighter } from "../executors/lighter";
import { createNotionDailyReport, isNotionReportWindowOpen, wasNotionReportCreatedToday } from "../executors/notion";
import { sendDiscordNotification } from "../executors/discord";
import { sendEmail } from "../executors/gmail";
import { executeGrowwNode } from "../executors/groww";
import { sendWhatsAppMessage } from "../executors/whatsapp";
import { executeZerodhaNode } from "../executors/zerodha";
import type { EdgeType, NodeType } from "../types";
import { isMarketOpen } from "../utils/market.utils";
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
            return;

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
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Discord Action",
                    status: "Failed",
                    message: "Failed to send Discord notification",
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
                pushStep(steps, {
                    nodeId: node.nodeId,
                    nodeType: "Notion Daily Report",
                    status: "Failed",
                    message: error?.message || "Failed to create Notion report",
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
