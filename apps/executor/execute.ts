import { sendDiscordNotification } from "./executors/discord";
import { sendEmail } from "./executors/gmail";
import { executeGrowwNode } from "./executors/groww";
import { executeZerodhaNode } from "./executors/zerodha";
import type { EdgeType, ExecutionResponseType, NodeType } from "./types";

interface ExecutionContext {
    eventType?: "buy" | "sell" | "price_trigger" | "trade_failed";
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

export async function executeWorkflow(nodes: NodeType[], edges: EdgeType[]): Promise<ExecutionResponseType> {
    const trigger = nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");
    if (!trigger) return { status: "Failed", message: "No trigger node found" };
    
    const context: ExecutionContext = {};
    
    if (trigger.type === "price-trigger") {
        context.eventType = "price_trigger";
        context.details = {
            symbol: trigger.data?.metadata?.asset,
            targetPrice: trigger.data?.metadata?.targetPrice,
            condition: trigger.data?.metadata?.condition,
        };
    }
    
    return await executeRecursive(trigger?.id, nodes, edges, context);
}

export async function executeRecursive(
    sourceId: string, 
    nodes: NodeType[], 
    edges: EdgeType[],
    context: ExecutionContext = {}
): Promise<ExecutionResponseType> {
    const nodesToExecute = edges.filter(({source, target}) => source === sourceId).map(({target}) => target);
    if (!nodesToExecute) return { status: "Success", message: "No downstream nodes to execute" }; ;

    await Promise.all(nodesToExecute.map(async (id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return { status: "Failed", message: `Node with id ${id} not found` };
        switch (node.type) {
            case "zerodha": 
                try {
                    const Zres = await executeZerodhaNode(
                       node.data?.metadata?.symbol, 
                       node.data?.metadata?.qty, 
                       node.data?.metadata?.type, 
                       node.data?.metadata?.apiKey,
                       node.data?.metadata?.accessToken,
                       node.data?.metadata?.exchange || "NSE"
                    );
                    
                    if (Zres === "SUCCESS") {
                        context.eventType = node.data?.metadata?.type; 
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                        };
                        return { status: "Success", message: `${node.data?.metadata?.type.toUpperCase()} order executed for ${node.data?.metadata?.symbol}` };
                    } else {
                        context.eventType = "trade_failed";
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            tradeType: node.data?.metadata?.type,
                            failureReason: "Trade execution failed. Please check your broker account and credentials.",
                        };
                        return { status: "Failed", message: `Trade execution failed for ${node.data?.metadata?.symbol}` };
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
                    return { status: "Failed", message: error.message || "Zerodha execution failed" };
                }
                
            case "groww":
                try {
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
                        return { status: "Success", message: `${node.data?.metadata?.type.toUpperCase()} order executed for ${node.data?.metadata?.symbol}` }
                    } else {
                        context.eventType = "trade_failed";
                        context.details = {
                            symbol: node.data?.metadata?.symbol,
                            quantity: node.data?.metadata?.qty,
                            exchange: node.data?.metadata?.exchange || "NSE",
                            tradeType: node.data?.metadata?.type,
                            failureReason: "Trade execution failed. Please check your broker account and credentials.",
                        };
                        return { status: "Failed", message: `Trade execution failed for ${node.data?.metadata?.symbol}` }
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
                    return { status: "Failed", message: error.message || "Groww execution failed" };
                }

            case "gmail": 
                if (context.eventType && context.details) {
                    await sendEmail(
                        node.data?.metadata?.recipientEmail || "",
                        node.data?.metadata?.recipientName || "User",
                        context.eventType,
                        context.details
                    );
                    return { status: "Success", message: `Email notification sent to ${node.data?.metadata?.recipientEmail}` };
                }
                return { status: "Failed", message: "Failed to send Email - Missing Context" };

            case "discord": 
                if (context.eventType && context.details) {
                    await sendDiscordNotification(
                        node.data?.metadata?.webhookUrl || "",
                        node.data?.metadata?.recipientName || "User",
                        context.eventType,
                        context.details
                    );
                    return { status: "Success", message: "Discord notification sent" };
                }
                return { status: "Failed", message: "Failed to send Discord notification - Missing Context" };
        }
    }));

    await Promise.all(nodesToExecute.map(id => executeRecursive(id, nodes, edges, context)));

    return { status: "Success", message: "Execution completed successfully" };
}