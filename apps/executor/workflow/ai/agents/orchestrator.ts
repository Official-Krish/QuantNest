import type {
  AIAgentPipelineMetadata,
  AIAgentPipelineResult,
  AIPipelineExecution,
  AIPipelineStage,
} from "@quantnest-trading/types";
import { AIAgentPipelineResultSchema } from "@quantnest-trading/types";
import { getAIProvider } from "../provider-factory";
import type { ChatMessage } from "../provider";
import { collectUpstreamContext } from "../context-collector";
import { getToolDefinitions } from "../tools/registry";
import { buildReasoningInstruction } from "../reasoning";
import { getBundledRole } from "../roles/bundled";
import { retrieveMemoryContext, storeMemoryDocuments } from "../memory";
import type { EdgeType, NodeType } from "../../../types";
import type { ExecutionContext } from "../../execute.context";

export type PipelineExecuteTrade = (params: {
  metadata: AIAgentPipelineMetadata;
  context: ExecutionContext;
}) => Promise<{
  status: AIPipelineExecution["status"];
  broker?: string;
  symbol?: string;
  qty?: number;
  side?: string;
  notional?: number;
  message: string;
}>;

export type RunAgentPipelineParams = {
  metadata: Record<string, unknown>;
  nodeId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  resolvedApiKey: string;
  executeTrade: PipelineExecuteTrade;
};

type StageResult = AIPipelineStage & Record<string, unknown>;

function formatJsonBlock(label: string, value: unknown): string {
  try {
    return `${label}:\n${JSON.stringify(value, null, 2)}`;
  } catch {
    return `${label}: <unparseable>`;
  }
}

/**
 * Five-agent hand-off: Research -> Strategy -> Risk -> Execution -> Reviewer.
 *
 * Each stage is a single LLM call with its own role persona and a shared
 * blackboard built up from earlier stages. Execution is delegated to the
 * injected `executeTrade` closure (risk guard + approval + broker dispatch
 * live there). Stage failures are captured into the result — they abort
 * execution (no order) instead of throwing.
 */
export async function runAgentPipeline(
  params: RunAgentPipelineParams,
): Promise<AIAgentPipelineResult> {
  const {
    metadata: rawMetadata,
    nodeId,
    nodes,
    edges,
    context,
    resolvedApiKey,
    executeTrade,
  } = params;

  const metadata = {
    provider: "gemini",
    model: "gemini-2.5-flash",
    temperature: 0.2,
    maxTokens: 1024,
    enableTools: true,
    systemPrompt: "",
    minConfidence: 0,
    executionMode: "require-approval",
    ...rawMetadata,
  } as AIAgentPipelineMetadata;

  const providerName = metadata.provider || "gemini";
  const provider = getAIProvider(providerName);

  const providerConfig = {
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
  };

  const { prompt: contextPrompt } = collectUpstreamContext({
    nodeId,
    nodes,
    edges,
    context,
  });

  const reasoningInstruction = buildReasoningInstruction(
    Boolean(metadata.reasoningEnabled),
  );

  const memoryContext = metadata.memoryEnabled
    ? await retrieveMemoryContext({
        userId: context.userId ?? "",
        workflowId: context.workflowId ?? "",
        query:
          metadata.systemPrompt?.trim() ||
          `${nodeId} agent pipeline prior runs`,
        k: metadata.contextDepth,
      })
    : "";

  const tools = metadata.enableTools ? getToolDefinitions() : undefined;

  async function runStage(options: {
    stage: string;
    roleId: string;
    instruction: string;
    extraContext?: string;
  }): Promise<StageResult> {
    const role = getBundledRole(options.roleId);
    const systemPrompt = [role?.prompt ?? "", metadata.systemPrompt]
      .filter(Boolean)
      .join("\n\n");

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: [
          systemPrompt,
          reasoningInstruction,
          `You are stage "${options.stage}" of a multi-agent trade pipeline.\n${options.instruction}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      {
        role: "user",
        content: [
          "Here is the workflow context:",
          contextPrompt,
          memoryContext,
          options.extraContext,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];

    const raw = await provider.execute(providerConfig, messages, tools);
    return raw as unknown as StageResult;
  }

  const blackboard: Record<string, unknown> = {};

  const research = await runStage({
    stage: "Research",
    roleId: "analyst",
    instruction: `Analyze the market context for symbol ${metadata.symbol}. Output valid JSON with:
- "approved": true if you have enough data to proceed, else false
- "confidence": number 0-1
- "reason": string
- "summary": string
- "signals": array of strings`,
  });
  blackboard.research = research;

  const strategy = await runStage({
    stage: "Strategy",
    roleId: "trader",
    instruction: `A trade is being considered: ${metadata.side} ${metadata.qty} of ${metadata.symbol} on broker ${metadata.broker}. Output valid JSON with:
- "approved": true if the trade should proceed, else false
- "confidence": number 0-1
- "reason": string
- "entry": string (suggested entry note)
- "exit": string (suggested exit note)`,
    extraContext: formatJsonBlock("Research output", research),
  });
  blackboard.strategy = strategy;

  const risk = await runStage({
    stage: "Risk",
    roleId: "risk-manager",
    instruction: `Assess the risk of the proposed trade. Output valid JSON with:
- "approved": true if risk is acceptable, else false
- "confidence": number 0-1
- "reason": string
- "riskScore": number 0-100 (higher = riskier)`,
    extraContext: formatJsonBlock("Strategy output", strategy),
  });
  blackboard.risk = risk;

  let execution: AIPipelineExecution = {
    status: "skipped",
    message: "Trade skipped by risk/strategy stage.",
  };

  const strategyApproved = Boolean(strategy.approved);
  const riskApproved = Boolean(risk.approved);
  const confidence = Number(strategy.confidence ?? 0);
  const minConfidence = Number(metadata.minConfidence ?? 0);
  const confidenceOk = confidence >= minConfidence;

  if (strategyApproved && riskApproved && confidenceOk) {
    try {
      execution = await executeTrade({ metadata, context });
    } catch (error) {
      execution = {
        status: "failed",
        broker: metadata.broker,
        symbol: metadata.symbol,
        qty: metadata.qty,
        side: metadata.side,
        message:
          error instanceof Error ? error.message : "Trade execution failed.",
      };
    }
  } else {
    const blockers: string[] = [];
    if (!strategyApproved) blockers.push("strategy");
    if (!riskApproved) blockers.push("risk");
    if (!confidenceOk) blockers.push("confidence");
    execution = {
      status: "skipped",
      broker: metadata.broker,
      symbol: metadata.symbol,
      qty: metadata.qty,
      side: metadata.side,
      message: `Trade skipped — blocked by ${blockers.join(", ")}.`,
    };
  }
  blackboard.execution = execution;

  const review = await runStage({
    stage: "Reviewer",
    roleId: "analyst",
    instruction: `Review the executed trade outcome and output valid JSON with:
- "approved": true
- "confidence": number 0-1
- "reason": string (constructive critique of the trade)
- "lessons": array of strings`,
    extraContext: formatJsonBlock("Execution output", execution),
  });
  blackboard.review = review;

  if (metadata.memoryEnabled) {
    try {
      await storeMemoryDocuments({
        userId: context.userId ?? "",
        workflowId: context.workflowId ?? "",
        nodeId,
        source: "note",
        content: JSON.stringify({
          stage: "reviewer",
          critique: review.reason,
          lessons: review.lessons,
          execution: execution.status,
        }),
        metadata: { kind: "reviewer", broker: metadata.broker },
        ttlHours: metadata.memoryTtl,
      });
    } catch (error) {
      console.error("Error storing pipeline review memory:", error);
    }
  }

  return AIAgentPipelineResultSchema.parse({
    research,
    strategy,
    risk,
    execution,
    review,
  });
}
