import { NODE_REGISTRY } from "@quantnest-trading/node-registry";
import type { ExecutorTriggerProcessorId } from "@quantnest-trading/node-registry";
import { indicatorEngine } from "../services/indicator.engine";
import { DYNAMIC_STATE_REFRESH_INTERVAL_MS } from "../config/constants";
import { backfillWorkflowTriggerState, registerConditionalExpressions } from "./poller.utils";
import {
  processBreakoutRetestWorkflows,
  processConditionalWorkflows,
  processMarketSessionWorkflows,
  processPortfolioPnlDrawdownWorkflows,
  processPriceWorkflows,
  processTimerWorkflows,
} from "./trigger-processors";

const triggerProcessorMap: Record<ExecutorTriggerProcessorId, (now: Date) => Promise<void>> = {
  timer: processTimerWorkflows,
  "price-trigger": processPriceWorkflows,
  "breakout-retest-trigger": processBreakoutRetestWorkflows,
  "conditional-trigger": processConditionalWorkflows,
  "market-session": processMarketSessionWorkflows,
  "portfolio-pnl-drawdown-trigger": processPortfolioPnlDrawdownWorkflows,
};

const registryTriggerProcessors = NODE_REGISTRY
  .filter((entry) => entry.kind === "trigger" && entry.executorTriggerProcessorId)
  .map((entry) => entry.executorTriggerProcessorId!) satisfies ExecutorTriggerProcessorId[];

let lastDynamicStateRefreshAt = 0;

async function refreshDynamicExecutorState(now: Date) {
  const nowMs = now.getTime();
  if (nowMs - lastDynamicStateRefreshAt < DYNAMIC_STATE_REFRESH_INTERVAL_MS) {
    return;
  }

  lastDynamicStateRefreshAt = nowMs;

  await backfillWorkflowTriggerState(now);
  await Promise.all([registerConditionalExpressions(), indicatorEngine.refreshSubscribedSymbols()]);
}

export async function pollOnce() {
  const now = new Date();

  await refreshDynamicExecutorState(now);

  for (const processorId of registryTriggerProcessors) {
    await triggerProcessorMap[processorId](now);
  }
}
