import type { NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";
import type { ExecutionStep } from "@quantnest-trading/types";
import { shouldSkipActionByCondition } from "../execute.context";

interface OpenAIChoice {
  message: { content: string | null };
  finish_reason: string;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  error?: { message: string };
}

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

  const baseUrl = (context.openclawUrl || "http://127.0.0.1:18789").replace(
    /\/+$/,
    "",
  );
  const url = `${baseUrl}/v1/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (context.openclawToken) {
    headers["Authorization"] = `Bearer ${context.openclawToken}`;
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

  const body: Record<string, unknown> = {
    model: "openclaw/default",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: `OpenClaw dispatch failed: ${message}`,
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
      message: `OpenClaw API error (${response.status}): ${text}`,
      terminalFailure: false,
    });
    return true;
  }

  let data: OpenAIResponse;
  try {
    data = (await response.json()) as OpenAIResponse;
  } catch {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: "OpenClaw returned invalid JSON",
      terminalFailure: false,
    });
    return true;
  }

  if (data.error) {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: `OpenClaw error: ${data.error.message}`,
      terminalFailure: false,
    });
    return true;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    steps.push({
      step: steps.length + 1,
      nodeId: node.nodeId || node.id,
      nodeType: actionType,
      status: "Failed",
      message: "OpenClaw returned empty content",
      terminalFailure: false,
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
