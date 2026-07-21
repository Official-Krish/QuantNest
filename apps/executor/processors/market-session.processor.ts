import { BaseWorkflowProcessor } from "./base.processor";
import { marketSessionHandler } from "../handlers/triggers/market-session";

export class MarketSessionProcessor extends BaseWorkflowProcessor {
  readonly triggerType = "market-session";
  protected readonly handler = marketSessionHandler;
  protected readonly query = { triggerType: "market-session" };
}
