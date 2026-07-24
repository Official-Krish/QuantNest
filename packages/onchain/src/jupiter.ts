import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import type { QuoteRequest, QuoteResponse, SwapResult } from "./types";

const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap";

export async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const params = new URLSearchParams({
    inputMint: request.inputMint,
    outputMint: request.outputMint,
    amount: request.amount,
    slippageBps: String(request.slippageBps),
  });

  const response = await fetch(`${JUPITER_QUOTE_URL}?${params}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jupiter quote failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<QuoteResponse>;
}

export interface SwapInstruction {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number;
}

export async function getSwapTransaction(
  instruction: SwapInstruction,
): Promise<VersionedTransaction> {
  const swapResponse = await fetch(JUPITER_SWAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: instruction.quoteResponse,
      userPublicKey: instruction.userPublicKey,
      wrapAndUnwrapSol: instruction.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: instruction.dynamicComputeUnitLimit ?? true,
      prioritizationFeeLamports: instruction.prioritizationFeeLamports,
    }),
  });

  if (!swapResponse.ok) {
    const body = await swapResponse.text();
    throw new Error(`Jupiter swap tx failed (${swapResponse.status}): ${body}`);
  }

  const { swapTransaction } = (await swapResponse.json()) as {
    swapTransaction: string;
  };

  const txBuffer = Buffer.from(swapTransaction, "base64");
  return VersionedTransaction.deserialize(txBuffer);
}

export async function executeSwap(
  connection: Connection,
  keypair: Keypair,
  request: QuoteRequest,
): Promise<SwapResult> {
  const quote = await getQuote(request);

  const swapTx = await getSwapTransaction({
    quoteResponse: quote,
    userPublicKey: keypair.publicKey.toBase58(),
  });

  swapTx.sign([keypair]);

  const signature = await connection.sendTransaction(swapTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const { value } = await connection.confirmTransaction(signature, "confirmed");

  if (value.err) {
    throw new Error(`Swap failed: ${JSON.stringify(value.err)}`);
  }

  return {
    txSignature: signature,
    outAmount: quote.outAmount,
    priceImpactPct: quote.priceImpactPct,
  };
}
