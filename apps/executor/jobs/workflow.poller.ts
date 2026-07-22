import { WorkflowModel } from "@quantnest-trading/db/client";
import type { WorkflowType } from "../types";
import { refreshDynamicStateForWorkflow } from "../handlers/trigger.handler";
import { triggerProcessorFactory } from "../processors/factory";
import { ACTIVE_WORKFLOW_QUERY } from "./poller.utils";

let firstPollDone = false;

export async function pollOnce(): Promise<number> {
  const now = new Date();

  if (!firstPollDone) {
    firstPollDone = true;
    void refreshDynamicStateForAllWorkflows();
  }

  const processors = triggerProcessorFactory.getAll();
  const results = await Promise.all(processors.map((p) => p.process(now)));
  return results.reduce((sum, r) => sum + r.executed, 0);
}

async function refreshDynamicStateForAllWorkflows() {
  try {
    const workflows = await WorkflowModel.find(ACTIVE_WORKFLOW_QUERY)
      .select({ _id: 1, nodes: 1, triggerType: 1, triggerConfig: 1 })
      .lean();

    for (const wf of workflows) {
      try {
        await refreshDynamicStateForWorkflow(wf as unknown as WorkflowType);
      } catch (err) {
        console.error(`State refresh failed for ${wf._id}:`, err);
      }
    }

    console.log(
      `Deferred state refresh completed for ${workflows.length} workflows`,
    );
  } catch (err) {
    console.error("Deferred state refresh failed:", err);
  }
}
