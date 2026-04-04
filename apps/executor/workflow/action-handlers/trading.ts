import {
  checkTokenStatus,
  createUserNotification,
  getMarketStatus,
  getZerodhaToken,
  pauseWorkflow,
} from "@quantnest-trading/executor-utils";
import { isMarketOpen } from "@quantnest-trading/market";
import { ExecuteLighter } from "../../executors/lighter";
import { executeGrowwNode } from "../../executors/groww";
import { executeZerodhaNode } from "../../executors/zerodha";
import { shouldSkipActionByCondition } from "../execute.context";
import { pushStep, type ActionHandler } from "./shared";

export const zerodhaActionHandler: ActionHandler = async ({
  node,
  context,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
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
      (resolvedMetadata as any)?.exchange || "NSE",
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

export const growwActionHandler: ActionHandler = async ({
  node,
  context,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
  try {
    if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
      return;
    }
    const result = await executeGrowwNode(
      (resolvedMetadata as any)?.symbol,
      (resolvedMetadata as any)?.qty,
      (resolvedMetadata as any)?.type,
      (resolvedMetadata as any)?.exchange || "NSE",
      (resolvedMetadata as any)?.accessToken,
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

export const lighterActionHandler: ActionHandler = async ({
  node,
  nextCondition,
  steps,
  resolvedMetadata,
}) => {
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
      (resolvedMetadata as any)?.apiKeyIndex,
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
