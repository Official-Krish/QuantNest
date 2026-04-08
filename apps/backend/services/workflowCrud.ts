import { ExecutionModel, WorkflowModel } from "@quantnest-trading/db/client";
import { createUserNotification, deriveWorkflowTriggerState, saveZerodhaToken } from "@quantnest-trading/executor-utils";
import { isBrokerVerificationError, verifyBrokerCredentialsForNodes } from "./brokerVerification";
import { resolveNodeMetadataSecrets } from "./reusableSecrets";
import { assertWorkflowCreationAllowed } from "./subscription";

type WorkflowNodeInput = Array<any>;
type WorkflowEdgeInput = Array<any>;

export async function createWorkflowForUser(params: {
  userId: string;
  workflowName: string;
  nodes: WorkflowNodeInput;
  edges: WorkflowEdgeInput;
  executionMode?: "live" | "dry-run";
}) {
  await assertWorkflowCreationAllowed(params.userId);

  const executionMode = params.executionMode || "live";
  if (executionMode === "live") {
    await verifyBrokerCredentialsForNodes(params.nodes as any, params.userId);
  }

  const workflow = await WorkflowModel.create({
    workflowName: params.workflowName,
    userId: params.userId,
    nodes: params.nodes,
    edges: params.edges,
    executionMode,
    status: "active",
    ...deriveWorkflowTriggerState(params.nodes as any),
  });

  const zerodhaNode = params.nodes.find((node) => String(node?.type || "").toLowerCase() === "zerodha");
  if (executionMode === "live" && zerodhaNode) {
    const resolvedMetadata = await resolveNodeMetadataSecrets({
      userId: params.userId,
      service: "zerodha",
      metadata: zerodhaNode.data?.metadata || {},
    });
    const accessToken = (resolvedMetadata as any)?.accessToken || "";
    await saveZerodhaToken(params.userId, workflow._id.toString(), accessToken);
  }

  return workflow;
}

export async function updateWorkflowForUser(params: {
  userId?: string;
  workflowId: string;
  nodes: WorkflowNodeInput;
  edges: WorkflowEdgeInput;
  executionMode?: "live" | "dry-run";
}) {
  const existingWorkflow = await WorkflowModel.findOne({
    _id: params.workflowId,
    userId: params.userId,
  }).select({ executionMode: 1 });

  const effectiveExecutionMode = params.executionMode || existingWorkflow?.executionMode || "live";
  if (effectiveExecutionMode === "live") {
    await verifyBrokerCredentialsForNodes(params.nodes as any, params.userId);
  }

  const nextSet: Record<string, unknown> = {
    nodes: params.nodes,
    edges: params.edges,
    updatedAt: new Date(),
    ...deriveWorkflowTriggerState(params.nodes as any),
  };

  if (params.executionMode) {
    nextSet.executionMode = params.executionMode;
  }

  return WorkflowModel.findOneAndUpdate(
    { _id: params.workflowId, userId: params.userId },
    {
      $set: nextSet,
    },
    { new: true },
  );
}

export async function updateWorkflowStatusForUser(params: {
  userId?: string;
  workflowId: string;
  status: "active" | "paused";
}) {
  const existingWorkflow = await WorkflowModel.findOne({
    _id: params.workflowId,
    userId: params.userId,
  });

  if (!existingWorkflow) {
    return null;
  }

  const workflow = await WorkflowModel.findOneAndUpdate(
    { _id: params.workflowId, userId: params.userId },
    {
      $set: {
        status: params.status,
        ...(params.status === "active" ? deriveWorkflowTriggerState(existingWorkflow.nodes as any) : {}),
      },
    },
    { new: true },
  );

  return workflow;
}

export async function updateWorkflowExecutionModeForUser(params: {
  userId?: string;
  workflowId: string;
  executionMode: "live" | "dry-run";
}) {
  return WorkflowModel.findOneAndUpdate(
    { _id: params.workflowId, userId: params.userId },
    {
      $set: {
        executionMode: params.executionMode,
        updatedAt: new Date(),
      },
    },
    { new: true },
  );
}

export async function listWorkflowsForUser(userId?: string) {
  return WorkflowModel.find({ userId });
}

export async function getWorkflowForUser(userId: string | undefined, workflowId: string) {
  return WorkflowModel.findOne({ _id: workflowId, userId });
}

export async function listExecutionsForWorkflow(userId: string | undefined, workflowId: string) {
  return ExecutionModel.find({ workflowId, userId }).sort({ startTime: -1 });
}

export async function deleteWorkflowForUser(userId: string | undefined, workflowId: string) {
  return WorkflowModel.findOneAndDelete({ _id: workflowId, userId });
}

export async function handleWorkflowBrokerVerificationFailure(params: {
  userId?: string;
  workflowId?: string;
  workflowName?: string;
  stage: "create" | "update";
  error: unknown;
}) {
  if (!isBrokerVerificationError(params.error) || !params.userId) {
    return false;
  }

  const message =
    params.error instanceof Error ? params.error.message : "Broker verification failed";

  await createUserNotification({
    userId: params.userId,
    workflowId: params.workflowId,
    type: "broker_verification_failed_on_save",
    severity: "error",
    title:
      params.stage === "create"
        ? "Workflow save blocked by broker verification"
        : "Workflow update blocked by broker verification",
    message,
    workflowName: params.workflowName,
    metadata: { stage: params.stage },
    dedupeKey:
      params.stage === "create"
        ? `workflow-save-broker-failure:create:${params.workflowName}`
        : `workflow-save-broker-failure:update:${params.workflowId}`,
    dedupeWindowHours: 6,
  });

  return true;
}
