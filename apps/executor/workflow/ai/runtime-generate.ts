import type { AIGenerateResult } from "@quantnest-trading/types";
import {
  AIGenerateMetadataSchema,
  AIGenerateResultSchema,
} from "@quantnest-trading/types";
import { getAIProvider } from "./provider-factory";
import type { ChatMessage } from "./provider";
import { collectUpstreamContext } from "./context-collector";
import { getToolDefinitions } from "./tools/registry";
import { buildReasoningInstruction } from "./reasoning";
import {
  retrieveMemoryContext,
  storeMemoryDocuments,
  writeMemory,
} from "./memory";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";

export type AIRuntimeGenerateParams = {
  metadata: Record<string, unknown>;
  nodeId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  resolvedApiKey: string;
};

export async function runtimeGenerate(
  params: AIRuntimeGenerateParams,
): Promise<AIGenerateResult> {
  const {
    metadata: rawMetadata,
    nodeId,
    nodes,
    edges,
    context,
    resolvedApiKey,
  } = params;

  const metadata = AIGenerateMetadataSchema.parse(rawMetadata);

  const { prompt: contextPrompt } = collectUpstreamContext({
    nodeId,
    nodes,
    edges,
    context,
  });

  const schemaInstruction = `Output valid JSON with these fields:
- "summary": string (a concise summary of the analysis)
- "analysis": string (optional, detailed analysis if relevant)`;

  const reasoningInstruction = buildReasoningInstruction(
    metadata.reasoningEnabled,
  );

  const memoryContext = metadata.memoryEnabled
    ? await retrieveMemoryContext({
        userId: context.userId ?? "",
        workflowId: context.workflowId ?? "",
        query: metadata.systemPrompt?.trim() || `${nodeId} prior executions`,
        k: metadata.contextDepth,
      })
    : "";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [metadata.systemPrompt, reasoningInstruction, schemaInstruction]
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
        "Generate your analysis based on this context.",
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
      model:
        providerName === "openclaw"
          ? (context.openclawModel as string) || "openclaw/default"
          : metadata.model,
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

  const result = AIGenerateResultSchema.parse(raw);

  if (metadata.memoryEnabled) {
    await writeMemory(
      context.userId ?? "",
      context.workflowId ?? "",
      nodeId,
      result as unknown as Record<string, unknown>,
      metadata.memoryTtl,
    );
    await storeMemoryDocuments({
      userId: context.userId ?? "",
      workflowId: context.workflowId ?? "",
      nodeId,
      source: "node",
      content: JSON.stringify(result),
      ttlHours: metadata.memoryTtl,
    });
  }

  return result;
}
