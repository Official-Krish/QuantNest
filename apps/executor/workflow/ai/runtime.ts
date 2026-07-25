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
        "",
        "Based on this context, make a decision.",
      ].join("\n"),
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

  return AIDecisionResultSchema.parse(raw);
}
