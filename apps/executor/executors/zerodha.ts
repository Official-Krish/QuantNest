import { KiteConnect } from "kiteconnect";
import { BrokerTimeoutError, BrokerAuthError } from "../services/errors";

export async function executeZerodhaNode(
  asset: string,
  quantity: number,
  orderType: "buy" | "sell",
  apiKey: string,
  accessToken: string,
  exchange: string,
): Promise<string> {
  const kc = new KiteConnect({ api_key: apiKey });
  kc.setAccessToken(accessToken);
  if (!exchange.includes("NSE") && !exchange.includes("BSE")) {
    throw new BrokerAuthError("zerodha", `Invalid exchange: ${exchange}`);
  }
  const exchangeTyped = exchange as "NSE" | "BSE";
  try {
    await kc.placeOrder("regular", {
      exchange: exchangeTyped,
      tradingsymbol: asset,
      transaction_type: orderType.toUpperCase() as "BUY" | "SELL",
      quantity: quantity,
      order_type: "MARKET",
      product: "MIS",
    });
    return "SUCCESS";
  } catch (error) {
    throw new BrokerTimeoutError(
      "zerodha",
      `Failed to place order: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
