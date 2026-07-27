import type { AIClassifyResult } from "@quantnest-trading/types";
import {
  AIClassifyMetadataSchema,
  AIClassifyResultSchema,
} from "@quantnest-trading/types";
import { getAIProvider } from "./provider-factory";
import type { ChatMessage } from "./provider";
import { collectUpstreamContext } from "./context-collector";
import { buildReasoningInstruction } from "./reasoning";
import { collectMemoryContext, writeMemory } from "./memory";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";

export type AIRuntimeClassifyParams = {
  metadata: Record<string, unknown>;
  nodeId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  resolvedApiKey: string;
};

export async function runtimeClassify(
  params: AIRuntimeClassifyParams,
): Promise<AIClassifyResult> {
  const {
    metadata: rawMetadata,
    nodeId,
    nodes,
    edges,
    context,
    resolvedApiKey,
  } = params;

  const metadata = AIClassifyMetadataSchema.parse(rawMetadata);

  const { prompt: contextPrompt } = collectUpstreamContext({
    nodeId,
    nodes,
    edges,
    context,
  });

  const labelsStr = metadata.labels
    .map((l, i) => `${i + 1}. "${l}"`)
    .join("\n");

  const schemaInstruction = `Classify the input into exactly one of these labels:
${labelsStr}

Output valid JSON with these fields:
- "label": string (must be one of the labels listed above)
- "confidence": number (0-1)`;

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
        "Here is the workflow context to classify:",
        contextPrompt,
        memoryContext,
        "",
        "Based on this context, select the most appropriate label.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const providerName = metadata.provider || "gemini";
  const provider = getAIProvider(providerName);
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
  );

  const result = AIClassifyResultSchema.parse(raw);

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
