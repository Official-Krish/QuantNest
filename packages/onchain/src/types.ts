export interface SolanaConfig {
  rpcUrl: string;
  rpcWsUrl?: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI?: string;
}

export interface QuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
}

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  routePlan: Array<{ swapInfo: unknown }>;
  platformFee: { amount: string; feeBps: number } | null;
}

export interface SwapResult {
  txSignature: string;
  outAmount: string;
  priceImpactPct: string;
}

export interface BalanceSnapshot {
  walletAddress: string;
  tokenMint: string;
  tokenSymbol: string;
  balance: number;
  decimals: number;
  network: "mainnet-beta" | "devnet";
}
