import type { ExecutorActionHandlerId } from "@quantnest-trading/node-registry";
import type { ActionHandlerParams } from "./shared";

export interface IActionHandler {
  readonly handlerId: ExecutorActionHandlerId | ExecutorActionHandlerId[];
  execute(params: ActionHandlerParams): Promise<void>;
}

export abstract class BrokerHandler implements IActionHandler {
  abstract readonly handlerId: ExecutorActionHandlerId;
  abstract get brokerName(): string;

  abstract execute(params: ActionHandlerParams): Promise<void>;

  protected abstract executeTrade(
    resolvedMetadata: Record<string, unknown>,
  ): Promise<string>;

  protected isMarketRequired(): boolean {
    return false;
  }
}
