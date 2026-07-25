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
import { collectMemoryContext, writeMemory } from "./memory";
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

  const memoryContext = await collectMemoryContext(
    context.userId ?? "",
    context.workflowId ?? "",
    nodeId,
    { memoryEnabled: metadata.memoryEnabled, memoryTtl: metadata.memoryTtl },
  );

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

  const provider = getAIProvider("gemini");
  const tools = metadata.enableTools ? getToolDefinitions() : undefined;
  const raw = await provider.execute(
    {
      apiKey: resolvedApiKey,
      model: metadata.model,
      temperature: metadata.temperature,
      maxTokens: metadata.maxTokens,
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
  }

  return result;
}
