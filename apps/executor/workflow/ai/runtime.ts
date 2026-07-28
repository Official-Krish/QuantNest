import type { AIDecisionResult } from "@quantnest-trading/types";
import {
  AIDecisionMetadataSchema,
  AIDecisionResultSchema,
} from "@quantnest-trading/types";
import { getAIProvider } from "./provider-factory";
import type { ChatMessage } from "./provider";
import { getBundledRoles } from "./roles/bundled";
import { collectUpstreamContext } from "./context-collector";
import { getToolDefinitions } from "./tools/registry";
import { buildReasoningInstruction } from "./reasoning";
import { collectMemoryContext, writeMemory } from "./memory";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";

export type AIRuntimeExecuteParams = {
  metadata: Record<string, unknown>;
  nodeId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  resolvedApiKey: string;
};

export async function runtimeExecute(
  params: AIRuntimeExecuteParams,
): Promise<AIDecisionResult> {
  const {
    metadata: rawMetadata,
    nodeId,
    nodes,
    edges,
    context,
    resolvedApiKey,
  } = params;

  const metadata = AIDecisionMetadataSchema.parse(rawMetadata);

  const { prompt: contextPrompt } = collectUpstreamContext({
    nodeId,
    nodes,
    edges,
    context,
  });

  const roles = getBundledRoles();
  const roleDef = roles.find((r) => r.id === metadata.role);
  const systemPrompt = [roleDef?.prompt ?? "", metadata.systemPrompt]
    .filter(Boolean)
    .join("\n\n");

  const schemaFields = (metadata.outputSchema ?? []).map(
    (f) =>
      `"${f.fieldName}": one of [${f.choices.map((c) => `"${c}"`).join(", ")}]`,
  );

  const schemaInstruction = `Output valid JSON with these fields:
- "decision": string
- "confidence": number (0-1)
- "reason": string${schemaFields.length > 0 ? `\n- ${schemaFields.join("\n- ")}` : ""}`;

  const reasoningInstruction = buildReasoningInstruction(
    metadata.reasoningEnabled,
  );

  const memoryContext = await collectMemoryContext(
    context.userId ?? "",
    context.workflowId ?? "",
    nodeId,
    { memoryEnabled: metadata.memoryEnabled, memoryTtl: metadata.memoryTtl },
  );

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [systemPrompt, reasoningInstruction, schemaInstruction]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      role: "user",
      content: [
        "Here is the workflow context:",
        contextPrompt,
        memoryContext,
        "",
        "Based on this context, make a decision.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const providerName = metadata.provider || "gemini";
  const provider = getAIProvider(providerName);
  const tools = metadata.enableTools ? getToolDefinitions() : undefined;
  const raw = await provider.execute(
    {
      apiKey:
        providerName === "openclaw"
          ? (rawMetadata.openclawToken as string) || ""
          : resolvedApiKey,
      model: providerName === "openclaw" ? "openclaw/default" : metadata.model,
      baseUrl:
        providerName === "openclaw"
          ? (rawMetadata.openclawUrl as string)
          : undefined,
      temperature: metadata.temperature,
      maxTokens: metadata.maxTokens,
      userId: providerName === "openclaw" ? context.userId : undefined,
    },
    messages,
    tools,
  );

  const result = AIDecisionResultSchema.parse(raw);

  if (metadata.memoryEnabled) {
    await writeMemory(
      context.userId ?? "",
      context.workflowId ?? "",
      nodeId,
      result as unknown as Record<string, unknown>,
      metadata.memoryTtl,
    );
  }

  return result;
}
