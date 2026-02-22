import type { ExecutionResponseType, ExecutionStep } from "@n8n-trading/types";
import { sendDiscordNotification } from "./executors/discord";
import { sendEmail } from "./executors/gmail";
import { executeGrowwNode } from "./executors/groww";
import { executeZerodhaNode } from "./executors/zerodha";
import type { EdgeType, NodeType } from "./types";
import { isMarketOpen } from "./utils/market.utils";
import { checkTokenStatus, getMarketStatus, getZerodhaToken } from "@n8n-trading/executor-utils";
import { ExecuteLighter } from "./executors/lighter";
import { evaluateConditionalMetadata } from "./handlers/trigger.handler";

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
        aiContext?: {
            triggerType?: string;
            marketType?: "Indian" | "Crypto";
            symbol?: string;
            connectedSymbols?: string[];
            targetPrice?: number;
            condition?: "above" | "below";
            timerIntervalSeconds?: number;
            evaluatedCondition?: boolean;
            expression?: any;
        };
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

    const connectedSymbols = [
        ...new Set(
            nodes
                .filter((node) => (node?.data?.kind || "").toLowerCase() === "action")
                .map((node) => node?.data?.metadata?.symbol)
                .filter((symbol): symbol is string => typeof symbol === "string" && symbol.length > 0),
        ),
    ];
    const inferredSymbol = trigger.data?.metadata?.asset || connectedSymbols[0];
    const inferredMarketType =
        trigger.data?.metadata?.marketType === "Crypto" || trigger.data?.metadata?.marketType === "web3"
            ? "Crypto"
            : "Indian";

    context.details = {
        ...(context.details || {}),
        symbol: context.details?.symbol || inferredSymbol,
        aiContext: {
            triggerType: trigger.type || "trigger",
            marketType: inferredMarketType,
            symbol: inferredSymbol,
            connectedSymbols,
            targetPrice: trigger.data?.metadata?.targetPrice,
            condition: trigger.data?.metadata?.condition,
            timerIntervalSeconds: trigger.type === "timer" ? trigger.data?.metadata?.time : undefined,
            expression: trigger.data?.metadata?.expression,
            evaluatedCondition: condition,
        },
    };
    
    if (trigger.type === "price-trigger") {
        context.eventType = "price_trigger";
        context.details = {
            symbol: trigger.data?.metadata?.asset,
            targetPrice: trigger.data?.metadata?.targetPrice,
            condition: trigger.data?.metadata?.condition,
            aiContext: {
                triggerType: "price-trigger",
                marketType: trigger.data?.metadata?.marketType === "Crypto" ? "Crypto" : "Indian",
                symbol: trigger.data?.metadata?.asset,
                connectedSymbols,
                targetPrice: trigger.data?.metadata?.targetPrice,
                condition: trigger.data?.metadata?.condition,
            },
        };
    }

    if (trigger.type === "conditional-trigger" && trigger.data?.metadata) {
        context.details = {
            ...(context.details || {}),
            aiContext: {
                triggerType: "conditional-trigger",
                marketType: trigger.data?.metadata?.marketType === "Crypto" ? "Crypto" : "Indian",
                symbol: trigger.data?.metadata?.asset,
                connectedSymbols,
                targetPrice: trigger.data?.metadata?.targetPrice,
                condition: trigger.data?.metadata?.condition,
                expression: trigger.data?.metadata?.expression,
                evaluatedCondition: condition,
            },
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
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const outgoingEdges = edges.filter(({ source }) => source === sourceId);
    if (!outgoingEdges.length) {
        return {
            status: "Success",
            steps: []
        };
    }

    let nextCondition = condition;
    let targetEdges = outgoingEdges;

    if (sourceNode?.type === "conditional-trigger") {
        const isRootTriggerNode = String(sourceNode.data?.kind || "").toLowerCase() === "trigger";
        const evaluatedCondition =
            typeof condition === "boolean" && isRootTriggerNode
                ? condition
                : await evaluateConditionalMetadata(sourceNode.data?.metadata);

        nextCondition = evaluatedCondition;
        context.details = {
            ...(context.details || {}),
            aiContext: {
                triggerType: "conditional-trigger",
                marketType: sourceNode.data?.metadata?.marketType === "Crypto" ? "Crypto" : "Indian",
                symbol: sourceNode.data?.metadata?.asset || context.details?.symbol,
                connectedSymbols: context.details?.aiContext?.connectedSymbols,
                targetPrice: sourceNode.data?.metadata?.targetPrice,
                condition: sourceNode.data?.metadata?.condition,
                timerIntervalSeconds: context.details?.aiContext?.timerIntervalSeconds,
                expression: sourceNode.data?.metadata?.expression,
                evaluatedCondition,
            },
        };

        targetEdges = outgoingEdges.filter((edge) => {
            if (edge.sourceHandle === "true" || edge.sourceHandle === "false") {
                return edge.sourceHandle === String(evaluatedCondition);
            }

            const targetNode = nodes.find((node) => node.id === edge.target);
            const targetCondition = targetNode?.data?.metadata?.condition;
            if (typeof targetCondition === "boolean") {
                return targetCondition === evaluatedCondition;
            }

            return true;
        });
    }

    const nodesToExecute = targetEdges.map(({ target }) => target);
    if (!nodesToExecute.length) {
        return {
            status: "Success",
            steps: []
        };
    }
    const steps: ExecutionStep[] = [];

    await Promise.all(nodesToExecute.map(async (id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return { status: "Failed", message: `Node with id ${id} not found` };
        switch (node.type) {
            case "conditional-trigger":
                return;
            case "zerodha": 
                try {
                    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
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
                            aiContext: context.details?.aiContext,
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
                            aiContext: context.details?.aiContext,
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
                        aiContext: context.details?.aiContext,
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
                    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
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
                            aiContext: context.details?.aiContext,
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
                            aiContext: context.details?.aiContext,
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
                        aiContext: context.details?.aiContext,
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
                                symbol: node.data?.metadata?.symbol || context.details?.symbol,
                                exchange: node.data?.metadata?.exchange || "NSE",
                                targetPrice: node.data?.metadata?.targetPrice,
                                aiContext: context.details?.aiContext,
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
                                symbol: node.data?.metadata?.symbol || context.details?.symbol,
                                exchange: node.data?.metadata?.exchange || "NSE",
                                targetPrice: node.data?.metadata?.targetPrice,
                                aiContext: context.details?.aiContext,
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

    const childResults = await Promise.all(
        nodesToExecute.map((id) => executeRecursive(id, nodes, edges, context, nextCondition))
    );

    const childSteps = childResults.flatMap((result) => result.steps);
    const allSteps = [...steps, ...childSteps];

    if (allSteps.some((step) => step.status === "Failed")) {
        return { status: "Failed", steps: allSteps };
    }
    return { status: "Success", steps: allSteps };
}
