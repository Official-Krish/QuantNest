import {
  createConnection,
  executeSwap,
  privateKeyToKeypair,
} from "@quantnest-trading/onchain";
import {
  decryptReusableSecretPayload,
  UserReusableSecretModel,
} from "@quantnest-trading/db/client";
import type { SolanaSwapMetadata } from "@quantnest-trading/types";
import { ErrorCode } from "../../services/errors/codes";
import type { IActionHandler } from "./base.handler";
import { executeActionWithRetry } from "./shared";
import { env } from "../../config/env";
import { AppError } from "../../services/errors/base.error";

const SOURCE = "solana";

export class SolanaSwapHandler implements IActionHandler {
  readonly handlerId = "solana-swap" as const;

  async execute(params: any): Promise<void> {
    const { node, context, resolvedMetadata, steps } = params;

    const metadata = resolvedMetadata as unknown as SolanaSwapMetadata;

    return executeActionWithRetry({
      node,
      context,
      steps,
      source: SOURCE,
      nodeTypeLabel: "Solana Swap",
      retryPolicy: metadata.retryPolicy,
      operation: async () => {
        if (context.executionMode === "dry-run") {
          return { message: "Solana swap simulated successfully" };
        }

        const secretId = metadata.secretId || node.data?.metadata?.secretId;
        if (!secretId) {
          throw new AppError(
            ErrorCode.SECRET_NOT_FOUND,
            "No wallet secret configured for Solana swap",
            false,
            SOURCE,
          );
        }

        const secret = await UserReusableSecretModel.findOne({
          _id: secretId,
          userId: context.userId,
          service: "solana",
        });
        if (!secret?.encryptedPayload) {
          throw new AppError(
            ErrorCode.SECRET_NOT_FOUND,
            "Solana wallet key not found",
            false,
            SOURCE,
          );
        }

        const payload = decryptReusableSecretPayload(secret.encryptedPayload);
        const privateKeyBase58 = payload.privateKey as string;
        if (!privateKeyBase58) {
          throw new AppError(
            ErrorCode.SECRET_NOT_FOUND,
            "Solana wallet private key is missing",
            false,
            SOURCE,
          );
        }

        const keypair = privateKeyToKeypair(privateKeyBase58);
        const connection = createConnection({
          rpcUrl: env.SOLANA.RPC_URL,
          rpcWsUrl: env.SOLANA.RPC_WS_URL || undefined,
        });

        const result = await executeSwap(connection, keypair, {
          inputMint: metadata.fromToken,
          outputMint: metadata.toToken,
          amount: String(Math.round(metadata.amount * 1_000_000_000)),
          slippageBps: metadata.slippageBps || 100,
        });

        context.details = {
          ...context.details,
          txSignature: result.txSignature,
          outAmount: result.outAmount,
          priceImpactPct: result.priceImpactPct,
        };

        return { message: `Swapped successfully: tx ${result.txSignature}` };
      },
      onFinalFailure: async (error: unknown) => {
        console.error(`[solana-swap] Final failure: ${error}`);
      },
    });
  }
}

export const solanaSwapHandler: IActionHandler = new SolanaSwapHandler();
