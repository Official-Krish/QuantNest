import type { ExecutionStep, RetryPolicyMetadata } from "@quantnest-trading/types";
import { createUserNotification } from "@quantnest-trading/executor-utils";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";
import { shouldSkipActionByCondition } from "../execute.context";

export class ActionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionConfigurationError";
  }
}

export type ResolvedRetryPolicy = {
  enabled: boolean;
  maxAttempts: number;
  backoffType: "fixed" | "exponential";
  delaySeconds: number;
  onFinalFailure: "fail-workflow" | "continue";
};

export function resolveRetryPolicy(rawPolicy: unknown): ResolvedRetryPolicy {
  const policy = (rawPolicy || {}) as RetryPolicyMetadata;
  return {
    enabled: Boolean(policy.enabled),
    maxAttempts: Math.max(1, Math.floor(Number(policy.maxAttempts || 1)) || 1),
    backoffType: String(policy.backoffType || "fixed").toLowerCase() === "exponential" ? "exponential" : "fixed",
    delaySeconds: Math.max(0, Number(policy.delaySeconds || 0) || 0),
    onFinalFailure: String(policy.onFinalFailure || "fail-workflow").toLowerCase() === "continue"
      ? "continue"
      : "fail-workflow",
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error || "Unknown error");
}

export function isRetryableActionError(error: unknown): boolean {
  if (!error) {
    return true;
  }

  if (error instanceof ActionConfigurationError) {
    return false;
  }

  const message = getErrorMessage(error).toLowerCase();
  const name = error instanceof Error ? error.name.toLowerCase() : "";

  if (name === "validationerror") {
    return false;
  }

  if ((error as any)?.retryable === false) {
    return false;
  }

  return !(
    message.includes("required") ||
    message.includes("missing") ||
    message.includes("not configured") ||
    message.includes("configuration") ||
    message.includes("invalid") ||
    message.includes("must be") ||
    message.includes("format") ||
    message.includes("secret") ||
    message.includes("token") ||
    message.includes("api key") ||
    message.includes("connection string") ||
    message.includes("table name") ||
    message.includes("sheet url") ||
    message.includes("parent page") ||
    message.includes("workflow id") ||
    message.includes("user id")
  );
}

function getBackoffDelaySeconds(policy: ResolvedRetryPolicy, attempt: number): number {
  if (!policy.enabled || attempt >= policy.maxAttempts) {
    return 0;
  }

  if (policy.backoffType === "exponential") {
    return Math.max(0, policy.delaySeconds * Math.pow(2, attempt - 1));
  }

  return Math.max(0, policy.delaySeconds);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeActionWithRetry(params: {
  node: NodeType;
  context: ExecutionContext;
  steps: ExecutionStep[];
  nodeTypeLabel: string;
  retryPolicy?: RetryPolicyMetadata;
  operation: (attempt: { attempt: number; maxAttempts: number }) => Promise<string>;
  onFinalFailure?: (error: unknown, attempt: { attempt: number; maxAttempts: number; terminalFailure: boolean }) => Promise<void> | void;
}) {
  const resolvedPolicy = resolveRetryPolicy(params.retryPolicy);
  const maxAttempts = resolvedPolicy.enabled ? resolvedPolicy.maxAttempts : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const successMessage = await params.operation({ attempt, maxAttempts });
      pushStep(params.steps, {
        nodeId: params.node.nodeId,
        nodeType: params.nodeTypeLabel,
        status: "Success",
        message: successMessage,
        attempt,
        maxAttempts,
        retryPolicy: resolvedPolicy,
        backoffType: resolvedPolicy.backoffType,
        terminalFailure: true,
      });
      return;
    } catch (error: any) {
      const message = getErrorMessage(error);
      const canRetry = resolvedPolicy.enabled && attempt < maxAttempts && isRetryableActionError(error);

      if (canRetry) {
        const backoffSeconds = getBackoffDelaySeconds(resolvedPolicy, attempt);
        pushStep(params.steps, {
          nodeId: params.node.nodeId,
          nodeType: params.nodeTypeLabel,
          status: "Failed",
          message: `Attempt ${attempt}/${maxAttempts} failed: ${message}. Retrying in ${backoffSeconds}s.`,
          attempt,
          maxAttempts,
          retryPolicy: resolvedPolicy,
          backoffType: resolvedPolicy.backoffType,
          backoffSeconds,
          terminalFailure: false,
        });

        if (backoffSeconds > 0) {
          await sleep(backoffSeconds * 1000);
        }
        continue;
      }

      const terminalFailure = resolvedPolicy.onFinalFailure !== "continue";
      await params.onFinalFailure?.(error, { attempt, maxAttempts, terminalFailure });
      pushStep(params.steps, {
        nodeId: params.node.nodeId,
        nodeType: params.nodeTypeLabel,
        status: "Failed",
        message: resolvedPolicy.enabled && maxAttempts > 1
          ? `Final failure after ${attempt}/${maxAttempts} attempts: ${message}${terminalFailure ? "" : " (continuing per retry policy)"}`
          : message,
        attempt,
        maxAttempts,
        retryPolicy: resolvedPolicy,
        backoffType: resolvedPolicy.backoffType,
        terminalFailure,
      });
      return;
    }
  }
}

export function pushStep(
  steps: ExecutionStep[],
  step: Omit<ExecutionStep, "step">,
): void {
  steps.push({
    step: steps.length + 1,
    ...step,
  });
}

export type ExecuteActionNodeParams = {
  node: NodeType;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  nextCondition?: boolean;
  steps: ExecutionStep[];
};

export type ActionHandlerParams = ExecuteActionNodeParams & {
  resolvedMetadata: Record<string, unknown>;
  type: string;
};

export type ActionHandler = (params: ActionHandlerParams) => Promise<void>;

export function getNotificationDetailsFallback(
  resolvedMetadata: Record<string, unknown>,
  context: ExecutionContext,
) {
  return {
    symbol: (resolvedMetadata as any)?.symbol || context.details?.symbol,
    exchange: (resolvedMetadata as any)?.exchange || "NSE",
    targetPrice: (resolvedMetadata as any)?.targetPrice,
    aiContext: context.details?.aiContext,
  };
}

export async function executeNotificationAction(
  params: ActionHandlerParams & {
    nodeTypeLabel: string;
    successMessage: string;
    failureType: string;
    failureTitle: string;
    failureMessage: string;
    send: (metadata: Record<string, unknown>, eventType: string, details: any) => Promise<void>;
  },
) {
  const {
    node,
    context,
    nextCondition,
    steps,
    resolvedMetadata,
    nodeTypeLabel,
    successMessage,
    failureType,
    failureTitle,
    failureMessage,
    send,
  } = params;

  if (shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)) {
    return;
  }

  await executeActionWithRetry({
    node,
    context,
    steps,
    nodeTypeLabel,
    retryPolicy: (node.data?.metadata as any)?.retryPolicy,
    operation: async () => {
      const eventType = context.eventType || "notification";
      const details =
        context.eventType && context.details
          ? context.details
          : getNotificationDetailsFallback(resolvedMetadata, context);

      await send(resolvedMetadata, eventType, details);
      return successMessage;
    },
    onFinalFailure: async (error) => {
      console.error(`${nodeTypeLabel} execution error:`, error);
      if (context.userId) {
        await createUserNotification({
          userId: context.userId,
          workflowId: context.workflowId,
          type: failureType,
          severity: "error",
          title: failureTitle,
          message: failureMessage || getErrorMessage(error),
          metadata: { nodeId: node.nodeId },
          dedupeKey: `${failureType}:${context.workflowId}:${node.nodeId}`,
          dedupeWindowHours: 2,
        });
      }
    },
  });
}
