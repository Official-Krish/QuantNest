import type { AIAgentPipelineMetadata } from "@quantnest-trading/types";
import { AIAgentPipelineMetadataSchema } from "@quantnest-trading/types";
import { executeZerodhaNode } from "../../executors/zerodha";
import { executeGrowwNode } from "../../executors/groww";
import { ExecuteLighter } from "../../executors/lighter";
import {
  createConnection,
  executeSwap,
  privateKeyToKeypair,
} from "@quantnest-trading/onchain";
import { acquireLock } from "@quantnest-trading/redis/lock";
import { resolveExecutorNodeSecrets } from "../../services/reusableSecrets";
import { env } from "../../config/env";
import { runAgentPipeline } from "../ai/agents/orchestrator";
import type { PipelineExecuteTrade } from "../ai/agents/orchestrator";
import {
  checkRateLimit,
  trackAICost,
  getMonthlyUsage,
} from "../ai/rate-limiter";
import { storeMemoryDocuments } from "../ai/memory";
import type { IActionHandler } from "./base.handler";
import type { ActionHandlerParams } from "./shared";
import {
  executeActionWithRetry,
  pushStep,
  handleBrokerApprovalGate,
  handleApprovalGate,
} from "./shared";
import {
  assertOrderAllowed,
  recordDailyExposure,
} from "../../services/riskGuard";
import type { ExecutionContext } from "../execute.context";

const TRADE_IDEM_KEY_TTL_MS = 60_000;

function getTradeIdempotencyKey(
  context: ExecutionContext,
  nodeId: string,
): string {
  return `idempotency:trade:${context.workflowId}:${nodeId}`;
}

async function checkTradeIdempotency(
  context: ExecutionContext,
  nodeId: string,
): Promise<boolean> {
  const key = getTradeIdempotencyKey(context, nodeId);
  const value = `${context.workflowId}:${nodeId}:${Date.now()}`;
  return acquireLock(key, value, TRADE_IDEM_KEY_TTL_MS);
}

export const aiAgentPipelineHandler: IActionHandler = {
  handlerId: "ai-agent-pipeline",

  async execute(params: ActionHandlerParams): Promise<void> {
    const { node, context, steps } = params;
    const metadata = node.data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) return;

    const userId = context.userId ?? "anonymous";
    const maxCost = Number((metadata as any)?.maxCostPerExecution ?? 0);
    const monthlyBudget = Number((metadata as any)?.monthlyBudget ?? 0);

    const { allowed, retryAfterMs } = checkRateLimit(
      userId,
      context.workflowId,
    );
    if (!allowed) {
      pushStep(steps, {
        nodeId: node.nodeId,
        nodeType: "AI Agent Pipeline",
        status: "Failed",
        message: `Rate limited. Retry in ${Math.ceil(retryAfterMs / 1000)}s`,
        terminalFailure: false,
      });
      return;
    }

    if (monthlyBudget > 0) {
      const usage = getMonthlyUsage(userId);
      if (usage >= monthlyBudget) {
        pushStep(steps, {
          nodeId: node.nodeId,
          nodeType: "AI Agent Pipeline",
          status: "Failed",
          message: "Monthly AI budget exceeded",
          terminalFailure: false,
        });
        return;
      }
    }

    await executeActionWithRetry({
      node,
      context,
      steps,
      nodeTypeLabel: "AI Agent Pipeline",
      retryPolicy: (metadata as any)?.retryPolicy,
      operation: async () => {
        const providerName = (metadata as any)?.provider || "gemini";
        const resolvedApiKey =
          providerName === "openclaw"
            ? (metadata as any)?.openclawToken || ""
            : process.env.GOOGLE_API_KEY || "";
        if (!resolvedApiKey && providerName !== "openclaw") {
          throw new Error("GOOGLE_API_KEY is not configured");
        }

        const parsed = AIAgentPipelineMetadataSchema.parse(metadata);

        const executeTrade: PipelineExecuteTrade = async ({
          metadata: tradeMeta,
          context: tradeContext,
        }) => {
          if (tradeContext.executionMode === "dry-run") {
            return {
              status: "simulated",
              broker: tradeMeta.broker,
              symbol: tradeMeta.symbol,
              qty: tradeMeta.qty,
              side: tradeMeta.side,
              message: `Simulated ${tradeMeta.side} ${tradeMeta.qty} ${tradeMeta.symbol} on ${tradeMeta.broker} (dry-run).`,
            };
          }

          const brokerMetadata: Record<string, unknown> = {
            symbol: tradeMeta.symbol,
            qty: tradeMeta.qty,
            side: tradeMeta.side,
            type: tradeMeta.side,
            apiKey: tradeMeta.apiKey,
            accessToken: tradeMeta.accessToken,
            fromToken: tradeMeta.fromToken,
            toToken: tradeMeta.toToken,
            amount: tradeMeta.qty,
            slippageBps: tradeMeta.slippageBps,
            accountIndex: tradeMeta.accountIndex,
            apiKeyIndex: tradeMeta.apiKeyIndex,
          };

          if (tradeMeta.brokerSecretId) {
            brokerMetadata.secretId = tradeMeta.brokerSecretId;
            const resolved = await resolveExecutorNodeSecrets({
              userId: tradeContext.userId,
              service: brokerServiceFor(tradeMeta.broker),
              metadata: brokerMetadata,
            });
            Object.assign(brokerMetadata, resolved);
          }

          const riskEvaluation = await assertOrderAllowed({
            broker: brokerNameFor(tradeMeta.broker),
            metadata: brokerMetadata,
            nodeRiskLimits: tradeMeta.riskLimits,
            workflowRiskLimits: tradeContext.workflowRiskLimits,
            userId: tradeContext.userId,
            workflowId: tradeContext.workflowId,
          });

          const approvalPrompt =
            tradeMeta.approvalPrompt ||
            `Approve ${tradeMeta.side} ${tradeMeta.qty} ${tradeMeta.symbol} on ${tradeMeta.broker} (notional ~${riskEvaluation.notional})?`;

          const requiresApproval =
            tradeMeta.executionMode === "require-approval" ||
            riskEvaluation.approvalRequired;

          if (requiresApproval) {
            await handleBrokerApprovalGate({
              prompt: approvalPrompt,
              nodeId: node.nodeId,
              nodeType: "AI Agent Pipeline",
              context: tradeContext,
              result: { ...brokerMetadata, notional: riskEvaluation.notional },
              steps,
            });
            return {
              status: "blocked",
              broker: tradeMeta.broker,
              symbol: tradeMeta.symbol,
              qty: tradeMeta.qty,
              side: tradeMeta.side,
              notional: riskEvaluation.notional,
              message: `Awaiting human approval: ${approvalPrompt}`,
            };
          }

          const idempotent = await checkTradeIdempotency(
            tradeContext,
            node.nodeId,
          );
          if (!idempotent) {
            return {
              status: "skipped",
              broker: tradeMeta.broker,
              symbol: tradeMeta.symbol,
              qty: tradeMeta.qty,
              side: tradeMeta.side,
              notional: riskEvaluation.notional,
              message: "Duplicate execution blocked by idempotency lock.",
            };
          }

          const notional = riskEvaluation.notional;
          let executed = false;

          if (tradeMeta.broker === "zerodha") {
            const result = await executeZerodhaNode(
              tradeMeta.symbol,
              tradeMeta.qty,
              tradeMeta.side,
              String(brokerMetadata.apiKey || ""),
              String(brokerMetadata.accessToken || ""),
              "NSE",
            );
            executed = result === "SUCCESS";
          } else if (tradeMeta.broker === "groww") {
            const result = await executeGrowwNode(
              tradeMeta.symbol,
              tradeMeta.qty,
              tradeMeta.side,
              "NSE",
              String(brokerMetadata.accessToken || ""),
            );
            executed = result === "SUCCESS";
          } else if (tradeMeta.broker === "lighter") {
            const asset = (tradeMeta.symbol as "BTC" | "ETH" | "SOL") || "BTC";
            const lighterSide = tradeMeta.side === "buy" ? "long" : "short";
            const result = await ExecuteLighter(
              asset,
              tradeMeta.qty,
              lighterSide,
              String(brokerMetadata.apiKey || ""),
              Number(tradeMeta.accountIndex ?? 0),
              Number(tradeMeta.apiKeyIndex ?? 0),
            );
            executed = result === "SUCCESS";
          } else if (tradeMeta.broker === "solana-swap") {
            const keypair = privateKeyToKeypair(
              String(brokerMetadata.privateKey || ""),
            );
            const connection = createConnection({
              rpcUrl: env.SOLANA.RPC_URL,
              rpcWsUrl: env.SOLANA.RPC_WS_URL || undefined,
            });
            await executeSwap(connection, keypair, {
              inputMint: tradeMeta.fromToken!,
              outputMint: tradeMeta.toToken!,
              amount: String(Math.round(tradeMeta.qty * 1_000_000_000)),
              slippageBps: tradeMeta.slippageBps || 100,
            });
            executed = true;
          }

          if (!executed) {
            return {
              status: "failed",
              broker: tradeMeta.broker,
              symbol: tradeMeta.symbol,
              qty: tradeMeta.qty,
              side: tradeMeta.side,
              notional,
              message: "Broker rejected the order.",
            };
          }

          await recordDailyExposure(userId, notional);

          tradeContext.eventType = tradeMeta.side;
          tradeContext.details = {
            ...tradeContext.details,
            symbol: tradeMeta.symbol,
            quantity: tradeMeta.qty,
            exchange: tradeMeta.broker,
          };

          try {
            await storeMemoryDocuments({
              userId,
              workflowId: tradeContext.workflowId ?? "",
              nodeId: node.nodeId,
              source: "trade",
              content: JSON.stringify({
                broker: tradeMeta.broker,
                type: tradeMeta.side,
                symbol: tradeMeta.symbol,
                qty: tradeMeta.qty,
                notional,
                status: "executed",
              }),
              metadata: { kind: "pipeline", broker: tradeMeta.broker },
            });
          } catch (error) {
            console.error("Error storing trade memory:", error);
          }

          return {
            status: "executed",
            broker: tradeMeta.broker,
            symbol: tradeMeta.symbol,
            qty: tradeMeta.qty,
            side: tradeMeta.side,
            notional,
            message: `${String(tradeMeta.side).toUpperCase()} ${tradeMeta.qty} ${tradeMeta.symbol} executed on ${tradeMeta.broker}.`,
          };
        };

        const result = await runAgentPipeline({
          metadata: parsed as unknown as Record<string, unknown>,
          nodeId: node.id ?? node.nodeId,
          nodes: params.nodes,
          edges: params.edges,
          context,
          resolvedApiKey,
          executeTrade,
        });

        if (maxCost > 0 || monthlyBudget > 0) {
          const estimatedCost = (result as any)?._cost ?? 0.05;
          const { withinBudget } = trackAICost(
            userId,
            estimatedCost,
            monthlyBudget,
          );
          if (!withinBudget) {
            throw new Error("Monthly AI budget exceeded after this execution");
          }
        }

        const nodeId = node.nodeId;
        context.details = {
          ...context.details,
          [`${nodeId}_ai_pipeline`]: result,
          ai: {
            ...(context.details?.ai || {}),
            pipeline: result,
          },
        };

        await handleApprovalGate({
          metadata,
          nodeId,
          nodeType: "AI Agent Pipeline",
          context,
          steps,
          result: result as unknown as Record<string, unknown>,
        });

        return `AI Agent Pipeline: strategy=${result.strategy.approved ? "approved" : "rejected"}, risk=${result.risk.approved ? "approved" : "rejected"}, execution=${result.execution.status}`;
      },
      onFinalFailure: async (error) => {
        console.error("AI Agent Pipeline execution error:", error);
      },
    });
  },
};

function brokerNameFor(
  broker: AIAgentPipelineMetadata["broker"],
): "zerodha" | "groww" | "lighter" | "solana" {
  if (broker === "solana-swap") return "solana";
  return broker;
}

function brokerServiceFor(
  broker: AIAgentPipelineMetadata["broker"],
): "zerodha" | "groww" | "lighter" | "solana" {
  return brokerNameFor(broker);
}
