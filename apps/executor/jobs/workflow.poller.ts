import { NODE_REGISTRY } from "@quantnest-trading/node-registry";
import type { ExecutorTriggerProcessorId } from "@quantnest-trading/node-registry";
import { indicatorEngine } from "../services/indicator.engine";
import { backfillWorkflowTriggerState, registerConditionalExpressions } from "./poller.utils";
import {
  processBreakoutRetestWorkflows,
  processConditionalWorkflows,
  processMarketSessionWorkflows,
  processPriceWorkflows,
  processTimerWorkflows,
} from "./trigger-processors";

const triggerProcessorMap: Record<ExecutorTriggerProcessorId, (now: Date) => Promise<void>> = {
  timer: processTimerWorkflows,
  "price-trigger": processPriceWorkflows,
  "breakout-retest-trigger": processBreakoutRetestWorkflows,
  "conditional-trigger": processConditionalWorkflows,
  "market-session": processMarketSessionWorkflows,
};

const registryTriggerProcessors = NODE_REGISTRY
  .filter((entry) => entry.kind === "trigger" && entry.executorTriggerProcessorId)
  .map((entry) => entry.executorTriggerProcessorId!) satisfies ExecutorTriggerProcessorId[];

export async function pollOnce() {
  const now = new Date();

  await backfillWorkflowTriggerState(now);
  await registerConditionalExpressions();
  await indicatorEngine.refreshSubscribedSymbols();
  for (const processorId of registryTriggerProcessors) {
    await triggerProcessorMap[processorId](now);
  }
}
