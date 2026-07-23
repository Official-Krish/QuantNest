import {
  createConnection,
  getBalance,
  getTokenBalance,
} from "@quantnest-trading/onchain";
import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import type { NodeType, WorkflowType } from "../../types";
import { env } from "../../config/env";
import type { IWorkflowHandler } from "../../processors/types";

export async function handleSolanaBalanceTrigger(
  workflow: WorkflowType,
  trigger: NodeType,
): Promise<{ shouldExecute: boolean; snapshot: TriggerEvaluationSnapshot }> {
  const { walletAddress, tokenMint, condition, threshold, network } =
    trigger.data?.metadata || {};

  const snapshot: TriggerEvaluationSnapshot = {
    triggerType: "solana-balance",
    symbol: tokenMint || "SOL",
    marketType: "Crypto",
    condition,
    targetPrice: typeof threshold === "number" ? threshold : undefined,
    currentPrice: null,
  };

  if (!walletAddress) {
    return { shouldExecute: false, snapshot };
  }

  try {
    const connection = createConnection({
      rpcUrl: env.SOLANA.RPC_URL,
      rpcWsUrl: env.SOLANA.RPC_WS_URL || undefined,
    });

    const balanceSnapshot = tokenMint
      ? await getTokenBalance(connection, walletAddress, tokenMint, {
          network: network || "mainnet-beta",
        })
      : await getBalance(connection, walletAddress, {
          network: network || "mainnet-beta",
        });

    snapshot.currentPrice = balanceSnapshot.balance;

    if (condition === "above") {
      return { shouldExecute: balanceSnapshot.balance > threshold, snapshot };
    }
    if (condition === "below") {
      return { shouldExecute: balanceSnapshot.balance < threshold, snapshot };
    }

    return { shouldExecute: false, snapshot };
  } catch (error) {
    console.error(
      `[solana-balance] RPC error for workflow ${workflow._id}:`,
      error,
    );
    return { shouldExecute: false, snapshot };
  }
}

export const solanaBalanceHandler: IWorkflowHandler = {
  async evaluate(workflow: WorkflowType, trigger: NodeType) {
    return handleSolanaBalanceTrigger(workflow, trigger);
  },
};
