import type { ExecutionResponseType, ExecutionStep } from "@n8n-trading/types";
import { sendDiscordNotification } from "./executors/discord";
import { sendEmail } from "./executors/gmail";
import { executeGrowwNode } from "./executors/groww";
import { executeZerodhaNode } from "./executors/zerodha";
import type { EdgeType, NodeType } from "./types";
import { isMarketOpen } from "./utils/market.utils";
import { checkTokenStatus, getMarketStatus, getZerodhaToken } from "@n8n-trading/executor-utils";
import { ExecuteLighter } from "./executors/lighter";

interface ExecutionContext {
    eventType?: "buy" | "sell" | "price_trigger" | "trade_failed" | "Long" | "Short";
    userId?: string;
    workflowId?: string;
    details?: {
        symbol?: string;
        quantity?: number;
        exchange?: string;
        targetPrice?: number;
        condition?: "above" | "below";
        tradeType?: "buy" | "sell";
        failureReason?: string;
    };
}

function shouldSkipActionByCondition(
    workflowCondition: boolean | undefined,
    nodeCondition: unknown
): boolean {
    if (typeof workflowCondition !== "boolean") {
        return false;
    }
    if (typeof nodeCondition !== "boolean") {
        return false;
    }
    return workflowCondition !== nodeCondition;
}

export async function executeWorkflow(nodes: NodeType[], edges: EdgeType[], userId?: string, workflowId?: string, condition?: boolean): Promise<ExecutionResponseType> {
    const trigger = nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");

    const context: ExecutionContext = { userId, workflowId };

    if (!trigger) {
        return {
            status: "Failed",
            steps: [{
                step: 1,
                nodeId: "unknown",
                nodeType: "trigger",
                status: "Failed",
                message: "No trigger node found"
            }]
        };
    }
    
    if (trigger.type === "price-trigger") {
        context.eventType = "price_trigger";
        context.details = {
            symbol: trigger.data?.metadata?.asset,
            targetPrice: trigger.data?.metadata?.targetPrice,
            condition: trigger.data?.metadata?.condition,
        };
    }
    
    return await executeRecursive(trigger?.id, nodes, edges, context, condition);
}

export async function executeRecursive(
    sourceId: string, 
    nodes: NodeType[], 
    edges: EdgeType[],
    context: ExecutionContext = {},
    condition?: boolean
): Promise<ExecutionResponseType> {
    const nodesToExecute = edges.filter(({source, target}) => source === sourceId).map(({target}) => target);
    if (!nodesToExecute) return {
        status: "Success",
        steps: []
    }
    const steps: ExecutionStep[] = [];

    await Promise.all(nodesToExecute.map(async (id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return { status: "Failed", message: `Node with id ${id} not found` };
        switch (node.type) {
            case "zerodha": 
                try {
                    if (shouldSkipActionByCondition(condition, node.data?.metadata?.condition)) {
                        return;
                    }
                    if (!isMarketOpen()) {
                        const marketStatus = getMarketStatus();
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Zerodha Action",
                            status: "Failed",
                            message: `Cannot execute trade: ${marketStatus.message}. ${marketStatus.nextOpenTime ? `Next opening: ${marketStatus.nextOpenTime}` : ""}`
                        });
                        return;
                    }

                    // Check if user has valid access token for this workflow
                    const tokenStatus = await checkTokenStatus(context.userId || "", context.workflowId || "");
                    if (!tokenStatus.hasValidToken) {
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Zerodha Action",
                            status: "Failed",
                            message: `Workflow paused: ${tokenStatus.message}${tokenStatus.tokenRequestId ? ` (Request ID: ${tokenStatus.tokenRequestId})` : ""}`
                        });
                        return;
                    }

                    const accessToken = await getZerodhaToken(context.userId || "", context.workflowId || "");
                    if (!accessToken) {
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Zerodha Action",
                            status: "Failed",
                            message: "Workflow paused: Access token not available. Please provide your Zerodha access token."
                        });
                        return;
                    }

                    const Zres = await executeZerodhaNode(
                       node.data?.metadata?.symbol, 
                       node.data?.metadata?.qty, 
                       node.data?.metadata?.type, 
                       node.data?.metadata?.apiKey,
                       accessToken,
                       node.data?.metadata?.exchange || "NSE"
                    );
                    
                    if (Zres === "SUCCESS") {
                        context.eventType = node.data?.metadata?.type; 
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                        };
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Zerodha Action",
                            status: "Success",
                            message: `${node.data?.metadata?.type.toUpperCase()} order executed for ${node.data?.metadata?.symbol}`
                        });
                        return;
                    } else {
                        context.eventType = "trade_failed";
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            tradeType: node.data?.metadata?.type,
                            failureReason: "Trade execution failed. Please check your broker account and credentials.",
                        };
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Zerodha Action",
                            status: "Failed",
                            message: `Trade execution failed for ${node.data?.metadata?.symbol}`
                        });
                        return;
                    }
                } catch (error: any) {
                    console.error("Zerodha execution error:", error);
                    context.eventType = "trade_failed";
                    context.details = {
                        symbol: node.data?.metadata?.symbol,
                        quantity: node.data?.metadata?.qty,
                        exchange: node.data?.metadata?.exchange || "NSE",
                        tradeType: node.data?.metadata?.type,
                        failureReason: error.message || "Unknown error occurred during trade execution.",
                    };
                    steps.push({
                        step: steps.length + 1,
                        nodeId: node.nodeId,
                        nodeType: "Zerodha Action",
                        status: "Failed",
                        message: error.message || "Zerodha execution failed"
                    });
                    return;
                }
                
            case "groww":
                try {
                    if (shouldSkipActionByCondition(condition, node.data?.metadata?.condition)) {
                        return;
                    }
                    const Gres = await executeGrowwNode(
                        node.data?.metadata?.symbol, 
                        node.data?.metadata?.qty, 
                        node.data?.metadata?.type, 
                        node.data?.metadata?.exchange || "NSE",
                        node.data?.metadata?.accessToken
                    );
                    
                    if (Gres === "SUCCESS") {
                        context.eventType = node.data?.metadata?.type;
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                        };
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Groww Action",
                            status: "Success",
                            message: `${node.data?.metadata?.type.toUpperCase()} order executed for ${node.data?.metadata?.symbol}`
                        });
                        return;
                    } else {
                        context.eventType = "trade_failed";
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            tradeType: node.data?.metadata?.type,
                            failureReason: "Trade execution failed. Please check your broker account and credentials.",
                        };
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Groww Action",
                            status: "Failed",
                            message: `Trade execution failed for ${node.data?.metadata?.symbol}`
                        });
                        return;
                    }
                } catch (error: any) {
                    console.error("Groww execution error:", error);
                    context.eventType = "trade_failed";
                    context.details = {
                        symbol: node.data?.metadata?.symbol,
                        quantity: node.data?.metadata?.qty,
                        exchange: node.data?.metadata?.exchange || "NSE",
                        tradeType: node.data?.metadata?.type,
                        failureReason: error.message || "Unknown error occurred during trade execution.",
                    };
                    steps.push({
                        step: steps.length + 1,
                        nodeId: node.nodeId,
                        nodeType: "Groww Action",
                        status: "Failed",
                        message: error.message || "Groww execution failed"
                    });
                    return { status: "Failed", message: error.message || "Groww execution failed" };
                }

            case "gmail": 
                try {
                    if (shouldSkipActionByCondition(condition, node.data?.metadata?.condition)) {
                        return;
                    }
                    if (context.eventType && context.details) {
                        await sendEmail(
                            node.data?.metadata?.recipientEmail || "",
                            node.data?.metadata?.recipientName || "User",
                            context.eventType,
                            context.details
                        );
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Gmail Action",
                            status: "Success",
                            message: "Email notification sent"
                        });
                        return;
                    } else {
                        await sendEmail(
                            node.data?.metadata?.recipientEmail || "",
                            node.data?.metadata?.recipientName || "User",
                            "notification",
                            {
                                symbol: node.data?.metadata?.symbol,
                                exchange: node.data?.metadata?.exchange || "NSE",
                                targetPrice: node.data?.metadata?.targetPrice,
                            }
                        )
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Gmail Action",
                            status: "Success",
                            message: "Email notification sent"
                        });
                        return;
                    }
                } catch (error) {
                    console.error("Gmail execution error:", error);
                    steps.push({
                        step: steps.length + 1,
                        nodeId: node.nodeId,
                        nodeType: "Gmail Action",
                        status: "Failed",
                        message: "Failed to send email notification"
                    });
                    return;
                }

            case "discord": 
                try {
                    if (shouldSkipActionByCondition(condition, node.data?.metadata?.condition)) {
                        return;
                    }
                    if (context.eventType && context.details) {
                        await sendDiscordNotification(
                            node.data?.metadata?.webhookUrl || "",
                            node.data?.metadata?.recipientName || "User",
                            context.eventType,
                            context.details
                        );
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Discord Action",
                            status: "Success",
                            message: "Discord notification sent"
                        });
                        return;
                    } else {
                        await sendDiscordNotification(
                            node.data?.metadata?.webhookUrl || "",
                            node.data?.metadata?.recipientName || "User",
                            "notification",
                            {
                                symbol: node.data?.metadata?.symbol,
                                exchange: node.data?.metadata?.exchange || "NSE",
                                targetPrice: node.data?.metadata?.targetPrice,
                            }
                        );
                        steps.push({
                            step: steps.length + 1,
                            nodeId: node.nodeId,
                            nodeType: "Discord Action",
                            status: "Success",
                            message: "Discord notification sent"
                        });
                        return;
                    }   
                } catch (error) {
                    console.error("Discord execution error:", error);
                    steps.push({
                        step: steps.length + 1,
                        nodeId: node.nodeId,
                        nodeType: "Discord Action",
                        status: "Failed",
                        message: "Failed to send Discord notification"
                    });
                    return;
                }
            
            case "lighter": 
                try {
                    if (shouldSkipActionByCondition(condition, node.data?.metadata?.condition)) {
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
                    steps.push({
                        step: steps.length + 1,
                        nodeId: node.nodeId,
                        nodeType: "Lighter Action",
                        status: "Success",
                        message: "Lighter action executed (placeholder)"
                    });
                    return;
                } catch (error) {
                    console.error("Lighter execution error:", error);
                    steps.push({
                        step: steps.length + 1,
                        nodeId: node.nodeId,
                        nodeType: "Lighter Action",
                        status: "Failed",
                        message: "Lighter execution failed"
                    });
                    return;
                }
        }
    }));

    await Promise.all(nodesToExecute.map(id => executeRecursive(id, nodes, edges, context, condition)));

    if (steps.some(step => step.status === "Failed")) {
        return { status: "Failed", steps: steps };
    }
    return { status: "Success", steps: steps };
}
