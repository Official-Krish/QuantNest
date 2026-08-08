import type { NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";
import type { ExecutionStep } from "@quantnest-trading/types";
import { shouldSkipActionByCondition } from "../execute.context";
import { generateInternalToken } from "../../utils/internal-auth";

const BACKEND_URL =
  process.env.QUANTNEST_BACKEND_URL || "http://localhost:3000";

export async function dispatchActionToOpenClaw(params: {
  node: NodeType;
  nodes: NodeType[];
  context: ExecutionContext;
  nextCondition?: boolean;
  steps: ExecutionStep[];
}): Promise<boolean> {
  const { node, nodes, context, nextCondition, steps } = params;

  if (
    shouldSkipActionByCondition(nextCondition, node.data?.metadata?.condition)
  ) {
    return false;
  }

  const actionType = node.type || "unknown";
  const metadata = node.data?.metadata || {};
  const triggerType =
    nodes.find(
      (n) => n?.data?.kind === "trigger" || n?.data?.kind === "TRIGGER",
    )?.type || "unknown";

  const systemMessage = `You are OpenClaw, a local AI action executor. Execute the given action and return a JSON response with the EXACT shape:
{
  "status": "success" | "failure",
  "message": "Human-readable result message"
}

Do NOT include any text before or after the JSON.`;

  const userMessage = `Execute this action node:

Action type: ${actionType}
Node ID: ${node.nodeId || node.id}
Trigger type: ${triggerType}
Execution mode: ${context.executionMode || "live"}

Action metadata:
${JSON.stringify(metadata, null, 2)}

Context:
${JSON.stringify(
  {
    eventType: context.eventType,
    symbol: context.details?.symbol,
    targetPrice: context.details?.targetPrice,
    condition: context.details?.condition,
    aiContext: context.details?.aiContext,
  },
  null,
  2,
)}`;

  const messages = [
    { role: "system" as const, content: systemMessage },
    { role: "user" as const, content: userMessage },
  ];
  const prompt = `${systemMessage}\n\n${userMessage}`;

  let response: Response;
  try {
    const token = generateInternalToken(context.userId);
    response = await fetch(`${BACKEND_URL}/api/v1/internal/agent-execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: context.userId,
        prompt,
        timeout: 30_000,
        model: context.openclawModel || "openclaw/default",
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: `Agent dispatch failed: ${message}`,
      terminalFailure: true,
    });
    return true;
  }

  if (!response.ok) {
    let text = "";
    try {
      text = await response.text();
    } catch {
      text = response.statusText;
    }
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: `Agent API error (${response.status}): ${text}`,
      terminalFailure: false,
    });
    return true;
  }

  let data: { status?: string; message?: string; data?: unknown };
  try {
    data = (await response.json()) as {
      status?: string;
      message?: string;
      data?: unknown;
    };
  } catch {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: "Agent returned invalid JSON",
      terminalFailure: false,
    });
    return true;
  }

  if (data.status === "error" || data.status === "failure") {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: data.message || "Action failed on agent",
      terminalFailure: false,
    });
    return true;
  }

  const content =
    data.message ||
    (data.data
      ? typeof data.data === "string"
        ? data.data
        : JSON.stringify(data.data)
      : "");

  if (!content) {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Success",
      message: "Action executed via agent",
      attempt: 1,
      maxAttempts: 1,
      terminalFailure: true,
    });
    return true;
  }

  let result: { status?: string; message?: string };
  try {
    result = JSON.parse(content) as { status?: string; message?: string };
  } catch {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Success",
      message: content,
      terminalFailure: true,
    });
    return true;
  }

  if (result.status === "failure") {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: result.message || "Action failed on OpenClaw",
      terminalFailure: false,
    });
    return true;
  }

  steps.push({
    step: steps.length + 1,
    nodeId: node.nodeId || node.id,
    nodeType: actionType,
    status: "Success",
    message: result.message || "Action executed via OpenClaw",
    attempt: 1,
    maxAttempts: 1,
    terminalFailure: true,
  });
  return true;
}
