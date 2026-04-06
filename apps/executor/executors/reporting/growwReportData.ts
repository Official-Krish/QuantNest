import axios from "axios";
import { resolveExecutorNodeSecrets } from "../../services/reusableSecrets";
import type { NodeType } from "../../types";
import type { ZerodhaTradeCsvRow, ZerodhaTradeSummary } from "./zerodhaReportData";

type GrowwMetadata = {
  accessToken?: string;
};

type AnyRecord = Record<string, unknown>;

const GROWW_BASE_URL = "https://api.groww.in";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toUpper(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function toLower(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function parseTime(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function pickString(record: AnyRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function pickNumber(record: AnyRecord, keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    const parsed = toNumber(value);
    if (parsed !== 0 || value === 0 || value === "0") return parsed;
  }
  return 0;
}

function pickTimestamp(record: AnyRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    const ms = parseTime(value);
    if (ms > 0) return new Date(ms).toISOString();
  }
  return "";
}

function extractArray(payload: unknown): AnyRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is AnyRecord => Boolean(entry) && typeof entry === "object");
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as AnyRecord;
  const arrayKeys = ["data", "orders", "trades", "items", "result"];
  for (const key of arrayKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is AnyRecord => Boolean(entry) && typeof entry === "object");
    }
  }

  for (const key of arrayKeys) {
    const value = record[key];
    if (value && typeof value === "object") {
      const nested = value as AnyRecord;
      for (const nestedKey of arrayKeys) {
        const nestedValue = nested[nestedKey];
        if (Array.isArray(nestedValue)) {
          return nestedValue.filter((entry): entry is AnyRecord => Boolean(entry) && typeof entry === "object");
        }
      }
    }
  }

  return [];
}

async function fetchGrowwList(accessToken: string, paths: string[]): Promise<AnyRecord[]> {
  for (const path of paths) {
    try {
      const response = await axios.get(`${GROWW_BASE_URL}${path}`, {
        timeout: 10_000,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-API-VERSION": "1.0",
        },
      });

      const items = extractArray(response.data);
      if (items.length) {
        return items;
      }
    } catch {
      continue;
    }
  }

  return [];
}

async function getGrowwNodeAndToken(input: {
  userId: string;
  nodes: NodeType[];
}): Promise<{ growwNode: NodeType; accessToken: string }> {
  const growwNode = input.nodes.find(
    (node) =>
      String(node.data?.kind || "").toLowerCase() === "action" &&
      String(node.type || "").toLowerCase() === "groww",
  );

  if (!growwNode) {
    throw new Error("Groww reporting requires at least one Groww action node.");
  }

  const resolvedMetadata = await resolveExecutorNodeSecrets<GrowwMetadata>({
    userId: input.userId,
    service: "groww",
    metadata: (growwNode.data?.metadata || {}) as GrowwMetadata,
  });

  const accessToken = String(resolvedMetadata.accessToken || "").trim();
  if (!accessToken) {
    throw new Error("Missing Groww access token on Groww action node.");
  }

  return { growwNode, accessToken };
}

function aggregateBySymbol(records: ZerodhaTradeCsvRow[]): Array<{ symbol: string; side: string; quantity: number; avgPrice: number }> {
  const map = new Map<string, { symbol: string; side: string; quantity: number; totalValue: number }>();

  for (const row of records) {
    const key = `${row.exchange}:${row.symbol}:${row.side}`;
    const existing = map.get(key) || {
      symbol: `${row.exchange}:${row.symbol}`,
      side: row.side,
      quantity: 0,
      totalValue: 0,
    };
    existing.quantity += row.quantity;
    existing.totalValue += row.value;
    map.set(key, existing);
  }

  return [...map.values()]
    .map((entry) => ({
      symbol: entry.symbol,
      side: entry.side,
      quantity: Number(entry.quantity.toFixed(4)),
      avgPrice: entry.quantity > 0 ? Number((entry.totalValue / entry.quantity).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}

function normalizeGrowwTrades(trades: AnyRecord[]): ZerodhaTradeCsvRow[] {
  return trades
    .map((trade) => {
      const symbol = pickString(trade, ["trading_symbol", "tradingsymbol", "symbol", "instrument", "ticker"]);
      const exchange = pickString(trade, ["exchange", "segment", "market", "venue"]) || "NSE";
      const side = toUpper(pickString(trade, ["transaction_type", "side", "type", "order_type"]));
      const quantity = pickNumber(trade, ["quantity", "filled_quantity", "qty", "size"]);
      const averagePrice = pickNumber(trade, ["average_price", "avg_price", "price", "fill_price", "executed_price"]);
      const value = toNumber((quantity * averagePrice).toFixed(2));

      return {
        tradeId: pickString(trade, ["trade_id", "tradeId", "id"]),
        orderId: pickString(trade, ["order_id", "orderId", "order_ref", "parent_order_id"]),
        symbol,
        exchange,
        side: side || "UNKNOWN",
        quantity,
        averagePrice,
        value,
        fillTime: pickTimestamp(trade, ["fill_timestamp", "filled_at", "order_timestamp", "timestamp", "created_at"]),
      };
    })
    .filter((row) => Boolean(row.symbol))
    .sort((a, b) => parseTime(b.fillTime) - parseTime(a.fillTime));
}

export async function getGrowwTradesForCsv(input: {
  workflowId: string;
  userId: string;
  nodes: NodeType[];
}): Promise<ZerodhaTradeCsvRow[]> {
  const { accessToken } = await getGrowwNodeAndToken(input);

  const trades = await fetchGrowwList(accessToken, [
    "/v1/trade/list",
    "/v1/trades",
    "/v1/order/trades",
    "/v1/orders/trades",
  ]);

  return normalizeGrowwTrades(trades);
}

export async function getGrowwTradeSummary(input: {
  workflowId: string;
  userId: string;
  nodes: NodeType[];
}): Promise<ZerodhaTradeSummary> {
  const { accessToken } = await getGrowwNodeAndToken(input);

  const [orders, normalizedTrades] = await Promise.all([
    fetchGrowwList(accessToken, [
      "/v1/order/list",
      "/v1/orders",
      "/v1/order/history",
      "/v1/orders/history",
    ]),
    getGrowwTradesForCsv(input),
  ]);

  const recentTrades = normalizedTrades.slice(0, 200);
  const last30DaysCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30DayTrades = normalizedTrades.filter((trade) => parseTime(trade.fillTime) >= last30DaysCutoff);

  const completedOrders = orders.filter((order) => {
    const status = toLower((order as AnyRecord).status);
    return status.includes("complete") || status.includes("filled") || status.includes("executed");
  });

  const rejectedOrders = orders.filter((order) => {
    const status = toLower((order as AnyRecord).status);
    return status.includes("reject") || status.includes("cancel") || status.includes("fail");
  });

  const totalOrders = orders.length;
  const completionRate = totalOrders ? Number(((completedOrders.length / totalOrders) * 100).toFixed(1)) : 0;
  const rejectionRate = totalOrders ? Number(((rejectedOrders.length / totalOrders) * 100).toFixed(1)) : 0;

  const sampleFailures = rejectedOrders
    .map((order) => pickString(order as AnyRecord, ["status_message", "message", "reason", "error"]))
    .filter(Boolean)
    .slice(0, 5);

  const topSymbols = aggregateBySymbol(last30DayTrades.length ? last30DayTrades : recentTrades);

  return {
    totalOrders,
    completedOrders: completedOrders.length,
    rejectedOrders: rejectedOrders.length,
    totalTrades: recentTrades.length,
    last30DayTradeCount: last30DayTrades.length,
    dayPositionCount: 0,
    netPositionCount: 0,
    completionRate,
    rejectionRate,
    realizedPnl: 0,
    unrealizedPnl: 0,
    holdingsPnl: 0,
    topSymbols,
    historicalContext: [],
    sampleFailures,
  };
}