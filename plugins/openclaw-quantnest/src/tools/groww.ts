import { Type } from "typebox";

function getCreds(config: Record<string, unknown>) {
  const brokers = (config as any)?.brokers as
    | Record<string, Record<string, string>>
    | undefined;
  const creds = brokers?.groww;
  if (!creds?.clientId || !creds?.clientSecret) {
    throw new Error(
      "Groww credentials not configured. Verify credentials first.",
    );
  }
  return creds;
}

const API_BASE = "https://api.groww.in/v1";

async function apiPost(
  path: string,
  body: unknown,
  creds: Record<string, string>,
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-ID": creds.clientId,
      "X-Client-Secret": creds.clientSecret,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groww API error (${res.status}): ${text}`);
  }
  return res.json();
}

export const getPortfolio = {
  name: "quantnest_groww_get_portfolio",
  label: "Groww Get Portfolio",
  description: "Get portfolio holdings from Groww",
  parameters: Type.Object({}),
  outputSchema: Type.Array(
    Type.Object({
      symbol: Type.String(),
      quantity: Type.Number(),
      averagePrice: Type.Number(),
      currentPrice: Type.Number(),
      pnl: Type.Number(),
    }),
  ),
  async execute(_params: unknown, config: Record<string, unknown>) {
    const creds = getCreds(config);
    const data = (await apiPost("/portfolio", {}, creds)) as any;
    const holdings = data?.holdings ?? data ?? [];
    return Array.isArray(holdings)
      ? holdings.map((h: any) => ({
          symbol: h.symbol ?? h.tradingSymbol,
          quantity: Number(h.quantity),
          averagePrice: Number(h.averagePrice ?? h.avgPrice),
          currentPrice: Number(h.currentPrice ?? h.ltp),
          pnl: Number(h.pnl ?? h.profitAndLoss),
        }))
      : [];
  },
};

export const placeOrder = {
  name: "quantnest_groww_place_order",
  label: "Groww Place Order",
  description: "Place an order on Groww",
  parameters: Type.Object({
    symbol: Type.String({ description: "Trading symbol" }),
    transactionType: Type.String({ description: "BUY or SELL" }),
    quantity: Type.Number({ description: "Quantity" }),
    price: Type.Optional(
      Type.Number({ description: "Price (market order if omitted)" }),
    ),
  }),
  outputSchema: Type.Object({
    orderId: Type.String(),
    symbol: Type.String(),
  }),
  async execute(
    params: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    const creds = getCreds(config);
    const p = params as any;
    const data = (await apiPost(
      "/orders",
      {
        symbol: p.symbol,
        transactionType: p.transactionType,
        quantity: p.quantity,
        price: p.price,
      },
      creds,
    )) as any;
    return {
      orderId: String(data?.orderId ?? data?.id ?? "unknown"),
      symbol: p.symbol,
    };
  },
};
