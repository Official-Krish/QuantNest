import type { ExecutorActionHandlerId } from "@quantnest-trading/node-registry";
import { getMarketStatus } from "@quantnest-trading/executor-utils";
import { isMarketOpen } from "@quantnest-trading/market";
import { acquireLock } from "@quantnest-trading/redis/lock";
import { shouldSkipActionByCondition } from "../execute.context";
import { ActionConfigurationError, executeActionWithRetry } from "./shared";
import type { ActionHandlerParams } from "./shared";

const TRADE_IDEM_KEY_TTL_MS = 60_000;

export interface IActionHandler {
  readonly handlerId: ExecutorActionHandlerId | ExecutorActionHandlerId[];
  execute(params: ActionHandlerParams): Promise<void>;
}

function getTradeIdempotencyKey(context: any, node: any): string {
  return `idempotency:trade:${context.workflowId}:${node.nodeId}`;
}

async function checkTradeIdempotency(
  context: any,
  node: any,
): Promise<boolean> {
  const key = getTradeIdempotencyKey(context, node);
  const value = `${context.workflowId}:${node.nodeId}:${Date.now()}`;
  return acquireLock(key, value, TRADE_IDEM_KEY_TTL_MS);
}

export abstract class BrokerHandler implements IActionHandler {
  abstract readonly handlerId: ExecutorActionHandlerId;
  abstract get brokerName(): string;

  async execute(params: ActionHandlerParams): Promise<void> {
    return this.executeWithBrokerPattern(params);
  }

  protected async executeWithBrokerPattern(
    params: ActionHandlerParams,
  ): Promise<void> {
    const { node, context, nextCondition, resolvedMetadata, steps } = params;

    if (
      shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)
    ) {
      return;
    }

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: `${this.brokerName} Action`,
      retryPolicy: (resolvedMetadata as any)?.retryPolicy,
      operation: async () => {
        if (context.executionMode === "dry-run") {
          return this.simulateTrade(resolvedMetadata, context);
        }

        if (this.isMarketRequired()) {
          if (!isMarketOpen()) {
            const marketStatus = getMarketStatus();
            throw new ActionConfigurationError(
              `Cannot execute trade: ${marketStatus.message}. ${marketStatus.nextOpenTime ? `Next opening: ${marketStatus.nextOpenTime}` : ""}`,
            );
          }
        }

        await this.validateTokens?.(context, resolvedMetadata);

        const idempotent = await checkTradeIdempotency(context, node);
        if (!idempotent) {
          return this.skipDuplicateTrade(resolvedMetadata, context);
        }

        const result = await this.executeTrade(resolvedMetadata, context);
        return result;
      },
      onFinalFailure: async (error) => {
        this.handleTradeFailure(error, resolvedMetadata, context);
      },
    });
  }

  protected abstract executeTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): Promise<string>;

  protected isMarketRequired(): boolean {
    return false;
  }

  protected validateTokens?(
    context: any,
    resolvedMetadata: Record<string, unknown>,
  ): Promise<void>;

  protected simulateTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): { message: string; simulatedPayload: Record<string, unknown> } {
    context.eventType = (resolvedMetadata as any)?.type;
    context.details = {
      symbol: (resolvedMetadata as any)?.symbol,
      quantity:
        (resolvedMetadata as any)?.qty || (resolvedMetadata as any)?.amount,
      exchange: (resolvedMetadata as any)?.exchange || "NSE",
      aiContext: context.details?.aiContext,
    };
    return {
      message: `[Dry Run] Would place ${String((resolvedMetadata as any)?.type || "").toUpperCase()} order for ${(resolvedMetadata as any)?.symbol}`,
      simulatedPayload: {
        broker: this.brokerName.toLowerCase(),
        symbol: (resolvedMetadata as any)?.symbol,
        qty:
          (resolvedMetadata as any)?.qty || (resolvedMetadata as any)?.amount,
        side: (resolvedMetadata as any)?.type,
        exchange: (resolvedMetadata as any)?.exchange || "NSE",
        accountIndex: (resolvedMetadata as any)?.accountIndex,
        apiKeyIndex: (resolvedMetadata as any)?.apiKeyIndex,
      },
    };
  }

  protected skipDuplicateTrade(
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): string {
    context.eventType = "trade_skipped";
    context.details = {
      symbol: (resolvedMetadata as any)?.symbol,
      quantity:
        (resolvedMetadata as any)?.qty || (resolvedMetadata as any)?.amount,
      exchange: (resolvedMetadata as any)?.exchange || "NSE",
      reason: "Duplicate trade prevented by idempotency check",
      aiContext: context.details?.aiContext,
    };
    return "Trade skipped: already executed in this window";
  }

  protected handleTradeFailure(
    error: unknown,
    resolvedMetadata: Record<string, unknown>,
    context: any,
  ): void {
    console.error(`${this.brokerName} execution error:`, error);
    context.eventType = "trade_failed";
    context.details = {
      symbol: (resolvedMetadata as any)?.symbol,
      quantity:
        (resolvedMetadata as any)?.qty || (resolvedMetadata as any)?.amount,
      exchange: (resolvedMetadata as any)?.exchange || "NSE",
      tradeType: (resolvedMetadata as any)?.type,
      failureReason:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during trade execution.",
      aiContext: context.details?.aiContext,
    };
  }
}

export class ActionHandlerFactory {
  private handlers = new Map<ExecutorActionHandlerId, IActionHandler>();

  register(handler: IActionHandler): void {
    const ids = Array.isArray(handler.handlerId)
      ? handler.handlerId
      : [handler.handlerId];
    for (const id of ids) {
      this.handlers.set(id, handler);
    }
  }

  get(handlerId: ExecutorActionHandlerId): IActionHandler | undefined {
    return this.handlers.get(handlerId);
  }

  getAll(): IActionHandler[] {
    return Array.from(new Set(this.handlers.values()));
  }
}
