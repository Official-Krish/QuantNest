import { KiteConnect } from "kiteconnect";
import { Connection, Keypair } from "@solana/web3.js";

interface VerifyRequest {
  broker: string;
  credentials: Record<string, string>;
}

interface VerifyResult {
  valid: boolean;
  message?: string;
}

async function verifyZerodha(
  creds: Record<string, string>,
): Promise<VerifyResult> {
  const apiKey = creds.apiKey;
  const accessToken = creds.accessToken;
  if (!apiKey || !accessToken) {
    return { valid: false, message: "Missing apiKey or accessToken" };
  }
  try {
    const kc = new KiteConnect({ api_key: apiKey });
    (kc as any).setAccessToken(accessToken);
    await kc.getPositions();
    return { valid: true };
  } catch (err: any) {
    return {
      valid: false,
      message: err.message ?? "Zerodha verification failed",
    };
  }
}

async function verifyGroww(
  creds: Record<string, string>,
): Promise<VerifyResult> {
  const clientId = creds.clientId;
  const clientSecret = creds.clientSecret;
  if (!clientId || !clientSecret) {
    return { valid: false, message: "Missing clientId or clientSecret" };
  }
  try {
    const res = await fetch("https://api.groww.in/v1/api/auth/login/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { valid: true };
    const body = await res.json().catch(() => ({}));
    return {
      valid: false,
      message: (body as any).message ?? `Groww returned ${res.status}`,
    };
  } catch (err: any) {
    return {
      valid: false,
      message: err.message ?? "Groww verification failed",
    };
  }
}

async function verifyJupiter(
  creds: Record<string, string>,
): Promise<VerifyResult> {
  const rpcUrl = creds.rpcUrl;
  const walletPrivateKey = creds.walletPrivateKey;
  if (!rpcUrl || !walletPrivateKey) {
    return { valid: false, message: "Missing rpcUrl or walletPrivateKey" };
  }
  try {
    const connection = new Connection(rpcUrl, { commitment: "confirmed" });
    const secretKey = Uint8Array.from(walletPrivateKey.split(",").map(Number));
    const keypair = Keypair.fromSecretKey(secretKey);
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance === undefined) {
      return { valid: false, message: "Could not fetch wallet balance" };
    }
    return { valid: true, message: `Wallet balance: ${balance / 1e9} SOL` };
  } catch (err: any) {
    return {
      valid: false,
      message: err.message ?? "Jupiter verification failed",
    };
  }
}

async function verifyLighter(
  creds: Record<string, string>,
): Promise<VerifyResult> {
  const apiKey = creds.apiKey;
  const secretKey = creds.secretKey;
  if (!apiKey || !secretKey) {
    return { valid: false, message: "Missing apiKey or secretKey" };
  }
  try {
    const res = await fetch("https://api.lighter.trade/v1/account", {
      headers: {
        "X-API-Key": apiKey,
        "X-Secret-Key": secretKey,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { valid: true };
    return { valid: false, message: `Lighter returned ${res.status}` };
  } catch (err: any) {
    return {
      valid: false,
      message: err.message ?? "Lighter verification failed",
    };
  }
}

const verifiers: Record<
  string,
  (creds: Record<string, string>) => Promise<VerifyResult>
> = {
  zerodha: verifyZerodha,
  groww: verifyGroww,
  jupiter: verifyJupiter,
  lighter: verifyLighter,
};

export async function handleVerify(
  payload: VerifyRequest,
): Promise<VerifyResult> {
  const verifier = verifiers[payload.broker];
  if (!verifier) {
    return { valid: false, message: `Unknown broker: ${payload.broker}` };
  }
  return verifier(payload.credentials);
}
