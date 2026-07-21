import { BaseWorkflowProcessor } from "./base.processor";
import { conditionalHandler } from "../handlers/triggers/conditional";

export class ConditionalTriggerProcessor extends BaseWorkflowProcessor {
  readonly triggerType = "conditional-trigger";
  protected readonly handler = conditionalHandler;
  protected readonly query = { triggerType: "conditional-trigger" };
}
