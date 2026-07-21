import { BaseWorkflowProcessor } from "./base.processor";
import { breakoutRetestHandler } from "../handlers/triggers/breakout-retest";

export class BreakoutRetestProcessor extends BaseWorkflowProcessor {
  readonly triggerType = "breakout-retest-trigger";
  protected readonly handler = breakoutRetestHandler;
  protected readonly query = { triggerType: "breakout-retest-trigger" };
}
