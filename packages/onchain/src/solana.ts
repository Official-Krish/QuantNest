import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { SolanaConfig, BalanceSnapshot } from "./types";
import { SOL_MINT, getTokenByMint } from "./tokens";

export function createConnection(config: SolanaConfig): Connection {
  return new Connection(config.rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: config.rpcWsUrl,
  });
}

export async function getBalance(
  connection: Connection,
  walletAddress: string,
  config: { network: "mainnet-beta" },
): Promise<BalanceSnapshot> {
  const pubkey = new PublicKey(walletAddress);
  const balanceLamports = await connection.getBalance(pubkey);
  const balance = balanceLamports / 1_000_000_000;

  return {
    walletAddress,
    tokenMint: SOL_MINT,
    tokenSymbol: "SOL",
    balance,
    decimals: 9,
    network: config.network,
  };
}

export async function getTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMint: string,
  config: { network: "mainnet-beta" },
): Promise<BalanceSnapshot> {
  const pubkey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(tokenMint);
  const tokenInfo = getTokenByMint(tokenMint);

  const tokenAccount = await getAssociatedTokenAddress(mintPubkey, pubkey);
  const accountInfo = await connection.getTokenAccountBalance(tokenAccount);

  return {
    walletAddress,
    tokenMint,
    tokenSymbol: tokenInfo?.symbol ?? "Unknown",
    balance: accountInfo.value.uiAmount ?? 0,
    decimals: accountInfo.value.decimals,
    network: config.network,
  };
}

export async function sendTransaction(
  connection: Connection,
  transaction: VersionedTransaction,
): Promise<string> {
  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const confirmation = await connection.confirmTransaction(
    signature,
    "confirmed",
  );

  if (confirmation.value.err) {
    throw new Error(
      `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
    );
  }

  return signature;
}
