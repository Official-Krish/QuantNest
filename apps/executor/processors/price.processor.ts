import { BaseWorkflowProcessor } from "./base.processor";
import { priceHandler } from "../handlers/triggers/price";

export class PriceTriggerProcessor extends BaseWorkflowProcessor {
  readonly triggerType = "price-trigger";
  protected readonly handler = priceHandler;
  protected readonly query = { triggerType: "price-trigger" };
}
