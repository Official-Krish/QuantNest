import { WorkflowModel } from "@quantnest-trading/db/client";
import { findWorkflowTrigger, getTimerIntervalSeconds } from "./poller.utils";
import {
  enqueueTimerJob,
  removeTimerJob,
  getTimerJobIds,
} from "./workflow.queue";
import type { WorkflowType } from "../types";

export async function syncTimerWorkflows() {
  await restoreTimerJobs();
  console.log("[timer] Sync complete");
}

export async function restoreTimerJobs() {
  const mongoWorkflows = await WorkflowModel.find({
    $or: [{ status: "active" }, { status: { $exists: false } }],
    triggerType: "timer",
  })
    .select({ _id: 1, nodes: 1, triggerConfig: 1 })
    .lean();

  const existingJobIds = await getTimerJobIds();

  const mongoIds = new Set(mongoWorkflows.map((w) => w._id.toString()));

  let restored = 0;
  for (const workflow of mongoWorkflows) {
    const wf = workflow as unknown as WorkflowType;
    const trigger = findWorkflowTrigger(wf);
    if (!trigger) continue;

    const intervalSeconds = getTimerIntervalSeconds(wf, trigger);
    if (!intervalSeconds) continue;

    const id = wf._id.toString();
    if (!existingJobIds.has(id)) {
      await enqueueTimerJob(id, intervalSeconds);
      restored++;
    }
  }

  for (const jobId of existingJobIds) {
    if (!mongoIds.has(jobId)) {
      await removeTimerJob(jobId);
    }
  }

  if (restored > 0) {
    console.log(`[timer] Restored ${restored} timer jobs`);
  }
}

export async function syncTimerForWorkflow(workflowId: string) {
  const workflow = await WorkflowModel.findById(workflowId)
    .select({ _id: 1, nodes: 1, triggerConfig: 1, triggerType: 1, status: 1 })
    .lean();

  if (!workflow) {
    await removeTimerJob(workflowId);
    return;
  }

  const isActive =
    workflow.status === "active" || workflow.status === undefined;
  const isTimer = workflow.triggerType === "timer";

  if (!isActive || !isTimer) {
    await removeTimerJob(workflowId);
    return;
  }

  const trigger = findWorkflowTrigger(workflow as unknown as WorkflowType);
  if (!trigger) {
    await removeTimerJob(workflowId);
    return;
  }

  const intervalSeconds = getTimerIntervalSeconds(
    workflow as unknown as WorkflowType,
    trigger,
  );
  if (!intervalSeconds) {
    await removeTimerJob(workflowId);
    return;
  }

  await enqueueTimerJob(workflowId, intervalSeconds);
}
