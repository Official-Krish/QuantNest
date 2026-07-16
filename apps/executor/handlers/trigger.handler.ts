import { WorkflowModel } from "@quantnest-trading/db/client";
import { deriveWorkflowTriggerState } from "@quantnest-trading/executor-utils";
import type { WorkflowType } from "../types";

export { handlePriceTrigger } from "./triggers/price";
export { handleBreakoutRetestTrigger } from "./triggers/breakout-retest";
export {
  checkCondition,
  evaluateConditionalMetadata,
  handleConditionalTrigger,
} from "./triggers/conditional";
export { handleMarketSessionTrigger } from "./triggers/market-session";
export { handlePortfolioPnlDrawdownTrigger } from "./triggers/portfolio-pnl-drawdown";

export async function refreshDynamicStateForWorkflow(workflow: WorkflowType) {
  const nextState = deriveWorkflowTriggerState(workflow.nodes, new Date());
  if (!nextState.triggerType || nextState.triggerType !== workflow.triggerType)
    return;

  const update: Record<string, unknown> = {};
  if (nextState.triggerConfig) update.triggerConfig = nextState.triggerConfig;
  if (nextState.nextRunAt) update.nextRunAt = nextState.nextRunAt;
  if (Object.keys(update).length > 0) {
    await WorkflowModel.updateOne({ _id: workflow._id }, { $set: update });
  }
}
