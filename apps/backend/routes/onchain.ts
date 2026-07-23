import { Router } from "express";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { authMiddleware } from "../middleware";
import { getReusableSecretForEdit } from "../services/reusableSecrets";
import bs58 from "bs58";

const onchainRouter = Router();

const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

function createConnection(network?: string) {
  const rpc =
    network === "devnet" ? "https://api.devnet.solana.com" : SOLANA_RPC_URL;
  return new Connection(rpc, "confirmed");
}

onchainRouter.get("/solana/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address);
    } catch {
      res.status(400).json({ error: "Invalid Solana address" });
      return;
    }

    const network = (req.query.network as string) || "mainnet-beta";
    const connection = createConnection(network);
    const balanceLamports = await connection.getBalance(pubkey);
    const balance = balanceLamports / 1_000_000_000;

    res.json({
      address,
      balance,
      balanceLamports,
      network,
    });
  } catch (error) {
    console.error("SOL balance check failed:", error);
    res.status(502).json({ error: "Failed to fetch Solana balance" });
  }
});

onchainRouter.get(
  "/solana/wallet/:secretId",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId!;
      const secretId = String(req.params.secretId || "");
      const secret = await getReusableSecretForEdit(userId, secretId);
      if (!secret || secret.service !== "solana") {
        res.status(404).json({ error: "Solana secret not found" });
        return;
      }

      const privateKeyBase58 = secret.payload.privateKey as string;
      if (!privateKeyBase58) {
        res.status(400).json({ error: "Secret has no privateKey field" });
        return;
      }

      const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
      const address = keypair.publicKey.toBase58();

      const network = (req.query.network as string) || "mainnet-beta";
      const connection = createConnection(network);
      const balanceLamports = await connection.getBalance(keypair.publicKey);
      const balance = balanceLamports / 1_000_000_000;

      res.json({
        address,
        balance,
        balanceLamports,
        network,
      });
    } catch (error) {
      console.error("Solana wallet status failed:", error);
      res.status(502).json({ error: "Failed to fetch Solana wallet status" });
    }
  },
);

export default onchainRouter;
