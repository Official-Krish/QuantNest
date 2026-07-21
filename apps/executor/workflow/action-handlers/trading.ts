import {
  checkTokenStatus,
  createUserNotification,
  getZerodhaToken,
  pauseWorkflow,
} from "@quantnest-trading/executor-utils";
import { ExecuteLighter } from "../../executors/lighter";
import { executeGrowwNode } from "../../executors/groww";
import { executeZerodhaNode } from "../../executors/zerodha";
import { BrokerHandler } from "./base.handler";
import { ActionConfigurationError } from "./shared";
import type { IActionHandler } from "./base.handler";

class ZerodhaHandler extends BrokerHandler {
  readonly handlerId = "zerodha" as const;
  brokerName = "Zerodha";
  private zerodhaAccessToken = "";

  protected override isMarketRequired(): boolean {
    return true;
  }

  protected override async validateTokens(context: any): Promise<void> {
    const tokenStatus = await checkTokenStatus(
      context.userId || "",
      context.workflowId || "",
    );
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

    const accessToken = await getZerodhaToken(
      context.userId || "",
      context.workflowId || "",
    );
    if (!accessToken) {
      throw new ActionConfigurationError(
        "Workflow paused: Access token not available. Please provide your Zerodha access token.",
      );
    }
    this.zerodhaAccessToken = accessToken;
  }

  protected async executeTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): Promise<string> {
    const result = await executeZerodhaNode(
      (resolvedMetadata as any)?.symbol,
      (resolvedMetadata as any)?.qty,
      (resolvedMetadata as any)?.type,
      (resolvedMetadata as any)?.apiKey,
      this.zerodhaAccessToken,
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
      failureReason:
        "Trade execution failed. Please check your broker account and credentials.",
      aiContext: context.details?.aiContext,
    };
    throw new Error(
      `Trade execution failed for ${(resolvedMetadata as any)?.symbol}`,
    );
  }
}

class GrowwHandler extends BrokerHandler {
  readonly handlerId = "groww" as const;
  brokerName = "Groww";

  protected async executeTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): Promise<string> {
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
      failureReason:
        "Trade execution failed. Please check your broker account and credentials.",
      aiContext: context.details?.aiContext,
    };
    throw new Error(
      `Trade execution failed for ${(resolvedMetadata as any)?.symbol}`,
    );
  }
}

class LighterHandler extends BrokerHandler {
  readonly handlerId = "lighter" as const;
  brokerName = "Lighter";

  protected async executeTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): Promise<string> {
    await ExecuteLighter(
      (resolvedMetadata as any)?.symbol,
      (resolvedMetadata as any)?.amount,
      (resolvedMetadata as any)?.type,
      (resolvedMetadata as any)?.apiKey,
      (resolvedMetadata as any)?.accountIndex,
      (resolvedMetadata as any)?.apiKeyIndex,
    );

    return "Lighter action executed (placeholder)";
  }

  protected override simulateTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ) {
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
}

export const zerodhaHandler: IActionHandler = new ZerodhaHandler();
export const growwHandler: IActionHandler = new GrowwHandler();
export const lighterHandler: IActionHandler = new LighterHandler();
