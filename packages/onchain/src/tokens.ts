import type { TokenInfo } from "./types";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const JITOSOL_MINT = "J1toso1uCk3QLmjYXpTp3RnUeN4mAN4p8BbYfN1EFTP";
export const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

export const COMMON_TOKENS: TokenInfo[] = [
  { symbol: "SOL", name: "Solana", mint: SOL_MINT, decimals: 9 },
  { symbol: "USDC", name: "USD Coin", mint: USDC_MINT, decimals: 6 },
  { symbol: "USDT", name: "Tether USD", mint: USDT_MINT, decimals: 6 },
  {
    symbol: "JitoSOL",
    name: "Jito Staked SOL",
    mint: JITOSOL_MINT,
    decimals: 9,
  },
  { symbol: "BONK", name: "Bonk", mint: BONK_MINT, decimals: 5 },
];

export function getTokenByMint(mint: string): TokenInfo | undefined {
  return COMMON_TOKENS.find((t) => t.mint.toLowerCase() === mint.toLowerCase());
}

export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return COMMON_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}
