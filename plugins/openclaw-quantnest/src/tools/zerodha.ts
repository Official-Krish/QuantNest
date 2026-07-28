import { Type } from "typebox";
import { KiteConnect } from "kiteconnect";

function getClient(config: Record<string, unknown>) {
  const brokers = (config as any)?.brokers as
    | Record<string, Record<string, string>>
    | undefined;
  const creds = brokers?.zerodha;
  if (!creds?.apiKey || !creds?.accessToken) {
    throw new Error(
      "Zerodha credentials not configured. Verify credentials first.",
    );
  }
  const kc = new KiteConnect({ api_key: creds.apiKey });
  (kc as any).setAccessToken(creds.accessToken);
  return kc;
}

export const getPositions = {
  name: "quantnest_zerodha_get_positions",
  label: "Zerodha Get Positions",
  description: "Get current positions and holdings from Zerodha",
  parameters: Type.Object({}),
  outputSchema: Type.Array(
    Type.Object({
      tradingSymbol: Type.String(),
      exchange: Type.String(),
      quantity: Type.Number(),
      averagePrice: Type.Number(),
      lastPrice: Type.Number(),
      pnl: Type.Number(),
    }),
  ),
  async execute(_params: unknown, config: Record<string, unknown>) {
    const kc = getClient(config);
    const positions = await kc.getPositions();
    const net = (positions as any)?.net ?? [];
    return net.map((p: any) => ({
      tradingSymbol: p.tradingsymbol,
      exchange: p.exchange,
      quantity: Number(p.quantity),
      averagePrice: Number(p.average_price),
      lastPrice: Number(p.last_price),
      pnl: Number(p.pnl),
    }));
  },
};

export const placeOrder = {
  name: "quantnest_zerodha_place_order",
  label: "Zerodha Place Order",
  description: "Place an order on Zerodha",
  parameters: Type.Object({
    tradingSymbol: Type.String({ description: "Trading symbol (e.g. INFY)" }),
    exchange: Type.String({ description: "Exchange (e.g. NSE)" }),
    transactionType: Type.String({ description: "BUY or SELL" }),
    quantity: Type.Number({ description: "Quantity to trade" }),
    product: Type.Optional(
      Type.String({ description: "Product (MIS, CNC, NRML)" }),
    ),
    orderType: Type.Optional(
      Type.String({ description: "Order type (MARKET, LIMIT, SL, SL-M)" }),
    ),
    price: Type.Optional(
      Type.Number({ description: "Price for LIMIT orders" }),
    ),
  }),
  outputSchema: Type.Object({
    orderId: Type.String(),
    tradingSymbol: Type.String(),
  }),
  async execute(
    params: Record<string, unknown>,
    config: Record<string, unknown>,
  ) {
    const kc = getClient(config);
    const p = params as any;
    const orderParams: any = {
      tradingsymbol: p.tradingSymbol,
      exchange: p.exchange,
      transaction_type: p.transactionType,
      quantity: p.quantity,
      product: p.product ?? "MIS",
      order_type: p.orderType ?? "MARKET",
    };
    if (p.price) orderParams.price = p.price;
    const result = await kc.placeOrder("regular", orderParams);
    return {
      orderId: String(result),
      tradingSymbol: p.tradingSymbol,
    };
  },
};
