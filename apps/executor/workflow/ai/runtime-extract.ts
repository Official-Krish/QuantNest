import type { AIExtractResult } from "@quantnest-trading/types";
import {
  AIExtractMetadataSchema,
  AIExtractResultSchema,
} from "@quantnest-trading/types";
import { getAIProvider } from "./provider-factory";
import type { ChatMessage } from "./provider";
import { collectUpstreamContext } from "./context-collector";
import { buildReasoningInstruction } from "./reasoning";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";

export type AIRuntimeExtractParams = {
  metadata: Record<string, unknown>;
  nodeId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  resolvedApiKey: string;
};

export async function runtimeExtract(
  params: AIRuntimeExtractParams,
): Promise<AIExtractResult> {
  const {
    metadata: rawMetadata,
    nodeId,
    nodes,
    edges,
    context,
    resolvedApiKey,
  } = params;

  const metadata = AIExtractMetadataSchema.parse(rawMetadata);

  const { prompt: contextPrompt } = collectUpstreamContext({
    nodeId,
    nodes,
    edges,
    context,
  });

  const fieldsStr = metadata.fields
    .map((f) => `- "${f}": <extracted value or null>`)
    .join("\n");

  const schemaInstruction = `Extract the following fields from the context:
${fieldsStr}

Output valid JSON with exactly these keys. Set a field to null if it cannot be determined.`;

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
        "Here is the workflow context to extract data from:",
        contextPrompt,
        "",
        "Extract the requested fields from this context.",
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

  const fields = metadata.fields;
  const result = AIExtractResultSchema.parse(raw);
  const filtered: Record<string, unknown> = {};
  for (const field of fields) {
    filtered[field] = result[field] ?? null;
  }
  if (metadata.reasoningEnabled && result.reasoningSteps) {
    filtered.reasoningSteps = result.reasoningSteps;
  }
  return filtered;
}
