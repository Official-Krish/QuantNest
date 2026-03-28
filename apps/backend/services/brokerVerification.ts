import { KiteConnect } from "kiteconnect";
import { resolveNodeMetadataSecrets } from "./reusableSecrets";

const LIGHTER_PRIVATE_KEY_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;
const BROKER_ERROR_KEYWORDS = ["zerodha", "groww", "lighter"] as const;

export type BrokerType = "zerodha" | "groww" | "lighter";

export async function verifyZerodhaCredentials(
  apiKey: string,
  accessToken: string
): Promise<void> {
  const sanitizedApiKey = apiKey.trim();
  const sanitizedAccessToken = accessToken.trim();

  if (!sanitizedApiKey || !sanitizedAccessToken) {
    throw new Error("Zerodha apiKey and accessToken are required");
  }

  try {
    const kc = new KiteConnect({ api_key: sanitizedApiKey });
    kc.setAccessToken(sanitizedAccessToken);
    await kc.getProfile();
  } catch (error: any) {
    const status = error?.status || error?.statusCode;
    throw new Error(
      status
        ? `Zerodha credential verification failed (${status})`
        : "Zerodha credential verification failed"
    );
  }
}

export async function verifyGrowwCredentials(accessToken: string): Promise<void> {
  const sanitizedAccessToken = accessToken.trim();
  if (!sanitizedAccessToken) {
    throw new Error("Groww accessToken is required");
  }

  const response = await fetch("https://api.groww.in/v1/user/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${sanitizedAccessToken}`,
      "X-API-VERSION": "1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Groww credential verification failed (${response.status})`);
  }
}

export async function verifyLighterCredentials(
  privateKey: string,
  accountIndex: number,
  apiKeyIndex: number
): Promise<void> {
  const sanitizedPrivateKey = privateKey.trim();
  if (!sanitizedPrivateKey) {
    throw new Error("Lighter apiKey is required");
  }
  if (!Number.isInteger(accountIndex) || accountIndex < 0) {
    throw new Error("Lighter accountIndex is invalid");
  }
  if (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0) {
    throw new Error("Lighter apiKeyIndex is invalid");
  }
  if (!LIGHTER_PRIVATE_KEY_REGEX.test(sanitizedPrivateKey)) {
    throw new Error("Lighter apiKey format is invalid");
  }
}

export async function verifyBrokerCredentials(input: {
  brokerType: BrokerType;
  apiKey?: string;
  accessToken?: string;
  accountIndex?: number;
  apiKeyIndex?: number;
}): Promise<void> {
  const {
    brokerType,
    apiKey = "",
    accessToken = "",
    accountIndex = Number.NaN,
    apiKeyIndex = Number.NaN,
  } = input;

  switch (brokerType) {
    case "zerodha":
      await verifyZerodhaCredentials(apiKey, accessToken);
      return;
    case "groww":
      await verifyGrowwCredentials(accessToken);
      return;
    case "lighter":
      await verifyLighterCredentials(apiKey, accountIndex, apiKeyIndex);
      return;
  }
}

export async function verifyBrokerCredentialsForNodes(nodes: Array<any>, userId?: string): Promise<void> {
  for (const node of nodes) {
    const type = String(node.type || "").toLowerCase();
    if (type === "zerodha") {
      const metadata = userId
        ? await resolveNodeMetadataSecrets({ userId, service: "zerodha", metadata: node.data?.metadata || {} })
        : node.data?.metadata || {};
      await verifyZerodhaCredentials(
        String((metadata as any)?.apiKey || ""),
        String((metadata as any)?.accessToken || "")
      );
      continue;
    }
    if (type === "groww") {
      const metadata = userId
        ? await resolveNodeMetadataSecrets({ userId, service: "groww", metadata: node.data?.metadata || {} })
        : node.data?.metadata || {};
      await verifyGrowwCredentials(String((metadata as any)?.accessToken || ""));
      continue;
    }
    if (type === "lighter") {
      const metadata = userId
        ? await resolveNodeMetadataSecrets({ userId, service: "lighter", metadata: node.data?.metadata || {} })
        : node.data?.metadata || {};
      await verifyLighterCredentials(
        String((metadata as any)?.apiKey || ""),
        Number((metadata as any)?.accountIndex),
        Number((metadata as any)?.apiKeyIndex)
      );
    }
  }
}

export function isBrokerVerificationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return BROKER_ERROR_KEYWORDS.some((keyword) => message.includes(keyword));
}
