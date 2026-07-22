import axios from "axios";
import { BrokerTimeoutError, OrderRejectedError } from "../services/errors";

export async function executeGrowwNode(
  symbol: string,
  quantity: number,
  type: string,
  exchange: string,
  accessToken: string,
): Promise<string> {
  const orderPayload = {
    trading_symbol: symbol,
    quantity: quantity,
    validity: "DAY",
    exchange: exchange,
    segment: "CASH",
    product: "CNC",
    order_type: "SL",
    transaction_type: type,
  };

  let res;
  try {
    res = await axios.post(
      "https://api.groww.in/v1/order/create",
      orderPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-API-VERSION": "1.0",
        },
      },
    );
  } catch (error) {
    throw new BrokerTimeoutError(
      "groww",
      `API request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (res.status === 200) {
    return "SUCCESS";
  }
  throw new OrderRejectedError(
    "groww",
    `Order rejected with status ${res.status}`,
  );
}
