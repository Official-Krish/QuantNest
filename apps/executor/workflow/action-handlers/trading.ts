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
import { ActionConfigurationError, executeActionWithRetry, type ActionHandler } from "./shared";

export const zerodhaActionHandler: ActionHandler = async ({
  node,
  context,
  nextCondition,
  resolvedMetadata,
  steps,
}) => {
  if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
    return;
  }

  await executeActionWithRetry({
    node,
    context,
    steps,
    nodeTypeLabel: "Zerodha Action",
    retryPolicy: (resolvedMetadata as any)?.retryPolicy,
    operation: async () => {
      if (context.executionMode === "dry-run") {
        context.eventType = (resolvedMetadata as any)?.type;
        context.details = {
          symbol: (resolvedMetadata as any)?.symbol,
          quantity: (resolvedMetadata as any)?.qty,
          exchange: (resolvedMetadata as any)?.exchange || "NSE",
          aiContext: context.details?.aiContext,
        };
        return {
          message: `[Dry Run] Would place ${String((resolvedMetadata as any)?.type || "").toUpperCase()} order for ${(resolvedMetadata as any)?.symbol}`,
          simulatedPayload: {
            broker: "zerodha",
            symbol: (resolvedMetadata as any)?.symbol,
            qty: (resolvedMetadata as any)?.qty,
            side: (resolvedMetadata as any)?.type,
            exchange: (resolvedMetadata as any)?.exchange || "NSE",
          },
        };
      }

      if (!isMarketOpen()) {
        const marketStatus = getMarketStatus();
        throw new ActionConfigurationError(
          `Cannot execute trade: ${marketStatus.message}. ${marketStatus.nextOpenTime ? `Next opening: ${marketStatus.nextOpenTime}` : ""}`,
        );
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
        throw new ActionConfigurationError(
          `Workflow paused: ${tokenStatus.message}${tokenStatus.tokenRequestId ? ` (Request ID: ${tokenStatus.tokenRequestId})` : ""}`,
        );
      }

      const accessToken = await getZerodhaToken(context.userId || "", context.workflowId || "");
      if (!accessToken) {
        throw new ActionConfigurationError("Workflow paused: Access token not available. Please provide your Zerodha access token.");
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
        return `${String((resolvedMetadata as any)?.type || "").toUpperCase()} order executed for ${(resolvedMetadata as any)?.symbol}`;
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
      throw new Error(`Trade execution failed for ${(resolvedMetadata as any)?.symbol}`);
    },
    onFinalFailure: async (error) => {
      console.error("Zerodha execution error:", error);
      context.eventType = "trade_failed";
      context.details = {
        symbol: (resolvedMetadata as any)?.symbol,
        quantity: (resolvedMetadata as any)?.qty,
        exchange: (resolvedMetadata as any)?.exchange || "NSE",
        tradeType: (resolvedMetadata as any)?.type,
        failureReason: error instanceof Error ? error.message : "Unknown error occurred during trade execution.",
        aiContext: context.details?.aiContext,
      };
    },
  });
};

export const growwActionHandler: ActionHandler = async ({
  node,
  context,
  nextCondition,
  resolvedMetadata,
  steps,
}) => {
  if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
    return;
  }

  await executeActionWithRetry({
    node,
    context,
    steps,
    nodeTypeLabel: "Groww Action",
    retryPolicy: (resolvedMetadata as any)?.retryPolicy,
    operation: async () => {
      if (context.executionMode === "dry-run") {
        context.eventType = (resolvedMetadata as any)?.type;
        context.details = {
          symbol: (resolvedMetadata as any)?.symbol,
          quantity: (resolvedMetadata as any)?.qty,
          exchange: (resolvedMetadata as any)?.exchange || "NSE",
          aiContext: context.details?.aiContext,
        };
        return {
          message: `[Dry Run] Would place ${String((resolvedMetadata as any)?.type || "").toUpperCase()} order for ${(resolvedMetadata as any)?.symbol}`,
          simulatedPayload: {
            broker: "groww",
            symbol: (resolvedMetadata as any)?.symbol,
            qty: (resolvedMetadata as any)?.qty,
            side: (resolvedMetadata as any)?.type,
            exchange: (resolvedMetadata as any)?.exchange || "NSE",
          },
        };
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
        return `${String((resolvedMetadata as any)?.type || "").toUpperCase()} order executed for ${(resolvedMetadata as any)?.symbol}`;
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
      throw new Error(`Trade execution failed for ${(resolvedMetadata as any)?.symbol}`);
    },
    onFinalFailure: async (error) => {
      console.error("Groww execution error:", error);
      context.eventType = "trade_failed";
      context.details = {
        symbol: (resolvedMetadata as any)?.symbol,
        quantity: (resolvedMetadata as any)?.qty,
        exchange: (resolvedMetadata as any)?.exchange || "NSE",
        tradeType: (resolvedMetadata as any)?.type,
        failureReason: error instanceof Error ? error.message : "Unknown error occurred during trade execution.",
        aiContext: context.details?.aiContext,
      };
    },
  });
};

export const lighterActionHandler: ActionHandler = async ({
  node,
  nextCondition,
  resolvedMetadata,
  steps,
  context,
}) => {
  if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
    return;
  }

  await executeActionWithRetry({
    node,
    context,
    steps,
    nodeTypeLabel: "Lighter Action",
    retryPolicy: (resolvedMetadata as any)?.retryPolicy,
    operation: async () => {
      if (context.executionMode === "dry-run") {
        context.eventType = (resolvedMetadata as any)?.type;
        context.details = {
          symbol: (resolvedMetadata as any)?.symbol,
          quantity: (resolvedMetadata as any)?.amount,
          exchange: "Lighter",
          aiContext: context.details?.aiContext,
        };
        return {
          message: `[Dry Run] Would place ${String((resolvedMetadata as any)?.type || "").toUpperCase()} position for ${(resolvedMetadata as any)?.symbol}`,
          simulatedPayload: {
            broker: "lighter",
            symbol: (resolvedMetadata as any)?.symbol,
            amount: (resolvedMetadata as any)?.amount,
            side: (resolvedMetadata as any)?.type,
            accountIndex: (resolvedMetadata as any)?.accountIndex,
            apiKeyIndex: (resolvedMetadata as any)?.apiKeyIndex,
          },
        };
      }

      await ExecuteLighter(
        (resolvedMetadata as any)?.symbol,
        (resolvedMetadata as any)?.amount,
        (resolvedMetadata as any)?.type,
        (resolvedMetadata as any)?.apiKey,
        (resolvedMetadata as any)?.accountIndex,
        (resolvedMetadata as any)?.apiKeyIndex,
      );

      return "Lighter action executed (placeholder)";
    },
    onFinalFailure: async (error) => {
      console.error("Lighter execution error:", error);
    },
  });
};
