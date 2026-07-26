import { Type } from "typebox";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

function loadConfig(config: Record<string, unknown>) {
  const brokers = (config as any)?.brokers as
    | Record<string, Record<string, string>>
    | undefined;
  const creds = brokers?.jupiter;
  if (!creds?.rpcUrl || !creds?.walletPrivateKey) {
    throw new Error(
      "Jupiter credentials not configured. Verify credentials first.",
    );
  }
  const connection = new Connection(creds.rpcUrl, { commitment: "confirmed" });
  const secretKey = Uint8Array.from(
    creds.walletPrivateKey.split(",").map(Number),
  );
  const keypair = Keypair.fromSecretKey(secretKey);
  return { connection, keypair };
}

interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  routePlan: Array<{ swapInfo: unknown }>;
  platformFee: { amount: string; feeBps: number } | null;
}

const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap";

async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50,
): Promise<QuoteResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: String(slippageBps),
  });
  const res = await fetch(`${JUPITER_QUOTE_URL}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`);
  return res.json() as Promise<QuoteResponse>;
}

async function getSwapTransaction(
  quoteResponse: QuoteResponse,
  userPublicKey: string,
): Promise<VersionedTransaction> {
  const res = await fetch(JUPITER_SWAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Jupiter swap tx failed (${res.status})`);
  const { swapTransaction } = (await res.json()) as { swapTransaction: string };
  return VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, "base64"),
  );
}

export const getQuoteTool = {
  name: "quantnest_jupiter_get_quote",
  label: "Jupiter Get Quote",
  description: "Get a swap quote from Jupiter aggregator",
  parameters: Type.Object({
    inputMint: Type.String({ description: "Input token mint address" }),
    outputMint: Type.String({ description: "Output token mint address" }),
    amount: Type.String({ description: "Amount in smallest units (lamports)" }),
    slippageBps: Type.Optional(
      Type.Number({ description: "Slippage in basis points" }),
    ),
  }),
  outputSchema: Type.Object({
    inputMint: Type.String(),
    outputMint: Type.String(),
    inAmount: Type.String(),
    outAmount: Type.String(),
    priceImpactPct: Type.String(),
  }),
  async execute(
    params: Record<string, unknown>,
    _config: Record<string, unknown>,
  ) {
    const p = params as any;
    const quote = await getQuote(
      p.inputMint,
      p.outputMint,
      p.amount,
      p.slippageBps ?? 50,
    );
    return {
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct,
    };
  },
};

export const swap = {
  name: "quantnest_jupiter_swap",
  label: "Jupiter Swap",
  description: "Execute a swap on Jupiter aggregator",
  parameters: Type.Object({
    inputMint: Type.String({ description: "Input token mint address" }),
    outputMint: Type.String({ description: "Output token mint address" }),
    amount: Type.String({ description: "Amount in smallest units (lamports)" }),
    slippageBps: Type.Optional(
      Type.Number({ description: "Slippage in basis points (default: 50)" }),
    ),
  }),
  outputSchema: Type.Object({
    txSignature: Type.String(),
    outAmount: Type.String(),
    priceImpactPct: Type.String(),
  }),
  async execute(
    params: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    const { connection, keypair } = loadConfig(config);
    const p = params as any;
    const slippageBps = p.slippageBps ?? 50;

    const quote = await getQuote(
      p.inputMint,
      p.outputMint,
      p.amount,
      slippageBps,
    );
    const swapTx = await getSwapTransaction(
      quote,
      keypair.publicKey.toBase58(),
    );
    swapTx.sign([keypair]);

    const signature = await connection.sendTransaction(swapTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    const { value } = await connection.confirmTransaction(
      signature,
      "confirmed",
    );
    if (value.err) {
      throw new Error(`Swap failed: ${JSON.stringify(value.err)}`);
    }

    return {
      txSignature: signature,
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct,
    };
  },
};
