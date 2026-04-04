import type { EdgeType, NodeType, Workflow } from "@quantnest-trading/types";

export interface BrokerVerificationPayload {
  brokerType: "zerodha" | "groww" | "lighter";
  apiKey?: string;
  accessToken?: string;
  accountIndex?: number;
  apiKeyIndex?: number;
  secretId?: string;
}

export function normalizeNodeForCompare(node: NodeType) {
  return {
    nodeId: node.nodeId,
    type: String(node.type || ""),
    data: {
      kind: String(node.data?.kind || ""),
      metadata: node.data?.metadata || {},
    },
  };
}

export function normalizeEdgeForCompare(edge: EdgeType) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
  };
}

export function buildWorkflowSnapshot(params: {
  workflowName: string;
  nodes: NodeType[];
  edges: EdgeType[];
}) {
  return JSON.stringify({
    workflowName: params.workflowName.trim(),
    nodes: params.nodes.map(normalizeNodeForCompare),
    edges: params.edges.map(normalizeEdgeForCompare),
  });
}

function inferNodeTypeFromMetadata(node: any): string {
  const metadata = node.data?.metadata || {};
  const kind = node.data?.kind?.toLowerCase();

  if (metadata.time !== undefined) return "timer";
  if (metadata.breakoutLevel !== undefined && metadata.direction !== undefined) {
    return "breakout-retest-trigger";
  }
  if (
    metadata.asset !== undefined &&
    metadata.targetPrice !== undefined &&
    metadata.condition !== undefined
  ) {
    return kind === "trigger" ? "conditional-trigger" : "price-trigger";
  }
  if (metadata.recipientEmail !== undefined) return "gmail";
  if (metadata.durationSeconds !== undefined) return "delay";
  if (
    metadata.expression !== undefined ||
    (metadata.targetPrice !== undefined &&
      metadata.condition !== undefined &&
      metadata.asset !== undefined)
  ) {
    return kind === "trigger" ? "conditional-trigger" : "if";
  }
  if (metadata.slackUserId !== undefined || metadata.slackBotToken !== undefined) return "slack";
  if (metadata.telegramChatId !== undefined || metadata.telegramBotToken !== undefined) return "telegram";
  if (metadata.webhookUrl !== undefined) return "discord";
  if (metadata.type !== undefined && metadata.qty !== undefined && metadata.symbol !== undefined) {
    return "zerodha";
  }
  if (
    metadata.notionApiKey !== undefined ||
    metadata.parentPageId !== undefined ||
    metadata.aiConsent !== undefined
  ) {
    return "notion-daily-report";
  }
  if (
    metadata.sheetUrl !== undefined ||
    metadata.sheetId !== undefined ||
    metadata.sheetName !== undefined
  ) {
    return "google-sheets-report";
  }
  if (
    metadata.googleClientEmail !== undefined ||
    metadata.googlePrivateKey !== undefined ||
    metadata.googleDriveFolderId !== undefined
  ) {
    return "google-drive-daily-csv";
  }
  if (metadata.recipientPhone !== undefined) return "whatsapp";

  return kind === "action" ? "zerodha" : "timer";
}

function normalizeStoredNodeType(nodeType: string | undefined) {
  const lower = String(nodeType || "").toLowerCase();
  if (lower === "price") return "price-trigger";
  if (lower === "breakout-retest") return "breakout-retest-trigger";
  if (lower === "conditional") return "conditional-trigger";
  return lower;
}

export function normalizeWorkflowForBuilder(workflow: Workflow) {
  const normalizedNodes = workflow.nodes.map((node: any) => {
    const nodeId = node.nodeId || node.id;
    const nodeType = normalizeStoredNodeType(node.type) || inferNodeTypeFromMetadata(node);

    return {
      nodeId,
      type: nodeType,
      data: {
        kind: (node.data?.kind?.toLowerCase() || node.data?.kind || "trigger") as
          | "action"
          | "trigger",
        metadata: node.data?.metadata || {},
      },
      position: node.position || { x: 0, y: 0 },
    } satisfies NodeType;
  });

  const nodeById = new Map<string, NodeType>(
    normalizedNodes.map((node) => [node.nodeId, node] as const),
  );

  const normalizedEdges = (workflow.edges || []).map((edge: any) => {
    if (edge.sourceHandle) {
      return edge;
    }

    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    if (sourceNode?.type !== "conditional-trigger" && sourceNode?.type !== "if") {
      return edge;
    }

    const targetCondition = (targetNode?.data as any)?.metadata?.condition;
    if (typeof targetCondition === "boolean") {
      return {
        ...edge,
        sourceHandle: targetCondition ? "true" : "false",
      };
    }

    return edge;
  });

  return {
    nodes: normalizedNodes as NodeType[],
    edges: normalizedEdges as EdgeType[],
    workflowId: workflow._id,
    workflowName: workflow.workflowName || "",
    marketType: workflow.marketType || "Indian",
  };
}

export function collectBrokerVerificationPayloads(nodes: NodeType[]) {
  const verificationPayloads = new Map<string, BrokerVerificationPayload>();

  for (const node of nodes) {
    if (String(node.data?.kind || "").toLowerCase() !== "action") continue;

    const nodeType = String(node.type || "").toLowerCase();
    const metadata: any = node.data?.metadata || {};

    if (nodeType === "zerodha") {
      const payload = {
        brokerType: "zerodha" as const,
        apiKey: String(metadata.apiKey || "").trim(),
        accessToken: String(metadata.accessToken || "").trim(),
        secretId: String(metadata.secretId || "").trim() || undefined,
      };
      verificationPayloads.set(
        `zerodha:${payload.secretId || `${payload.apiKey}:${payload.accessToken}`}`,
        payload,
      );
      continue;
    }

    if (nodeType === "groww") {
      const payload = {
        brokerType: "groww" as const,
        accessToken: String(metadata.accessToken || "").trim(),
        secretId: String(metadata.secretId || "").trim() || undefined,
      };
      verificationPayloads.set(`groww:${payload.secretId || payload.accessToken}`, payload);
      continue;
    }

    if (nodeType === "lighter") {
      const payload = {
        brokerType: "lighter" as const,
        apiKey: String(metadata.apiKey || "").trim(),
        accountIndex: Number(metadata.accountIndex),
        apiKeyIndex: Number(metadata.apiKeyIndex),
        secretId: String(metadata.secretId || "").trim() || undefined,
      };
      verificationPayloads.set(
        `lighter:${payload.secretId || `${payload.apiKey}:${payload.accountIndex}:${payload.apiKeyIndex}`}`,
        payload,
      );
    }
  }

  return verificationPayloads;
}
