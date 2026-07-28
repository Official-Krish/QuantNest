import { Type } from "typebox";

function getCreds(config: Record<string, unknown>) {
  const brokers = (config as any)?.brokers as
    | Record<string, Record<string, string>>
    | undefined;
  const creds = brokers?.lighter;
  if (!creds?.apiKey || !creds?.secretKey) {
    throw new Error(
      "Lighter credentials not configured. Verify credentials first.",
    );
  }
  return creds;
}

const API_BASE = "https://api.lighter.trade/v1";

async function apiPost(
  path: string,
  body: unknown,
  creds: Record<string, string>,
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": creds.apiKey,
      "X-Secret-Key": creds.secretKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lighter API error (${res.status}): ${text}`);
  }
  return res.json();
}

export const execute = {
  name: "quantnest_lighter_execute",
  label: "Lighter Execute Strategy",
  description: "Execute a trading strategy on Lighter",
  parameters: Type.Object({
    strategy: Type.String({ description: "Strategy ID or name" }),
    action: Type.String({
      description: "Action to execute (e.g. enter, exit, rebalance)",
    }),
    symbol: Type.Optional(Type.String({ description: "Trading pair symbol" })),
    quantity: Type.Optional(Type.Number({ description: "Quantity to trade" })),
    params: Type.Optional(Type.Object({}, { additionalProperties: true })),
  }),
  outputSchema: Type.Object({
    id: Type.String(),
    status: Type.String(),
    message: Type.String(),
  }),
  async execute(
    params: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    const creds = getCreds(config);
    const p = params as any;
    const result = (await apiPost(
      "/strategies/execute",
      {
        strategy: p.strategy,
        action: p.action,
        symbol: p.symbol,
        quantity: p.quantity,
        params: p.params ?? {},
      },
      creds,
    )) as any;
    return {
      id: String(result?.id ?? result?.executionId ?? "unknown"),
      status: String(result?.status ?? "submitted"),
      message:
        result?.message ?? `Strategy ${p.strategy}: ${p.action} submitted`,
    };
  },
};
