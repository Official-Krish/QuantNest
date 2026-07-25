import type { AIClassifyResult } from "@quantnest-trading/types";
import {
  AIClassifyMetadataSchema,
  AIClassifyResultSchema,
} from "@quantnest-trading/types";
import { getAIProvider } from "./provider-factory";
import type { ChatMessage } from "./provider";
import { collectUpstreamContext } from "./context-collector";
import { buildReasoningInstruction } from "./reasoning";
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
        "",
        "Based on this context, select the most appropriate label.",
      ].join("\n"),
    },
  ];

  const provider = getAIProvider("gemini");
  const raw = await provider.execute(
    {
      apiKey: resolvedApiKey,
      model: metadata.model,
      temperature: metadata.temperature,
      maxTokens: metadata.maxTokens,
    },
    messages,
  );

  return AIClassifyResultSchema.parse(raw);
}
