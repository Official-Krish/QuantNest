import { NonceManagerType } from "@quantnest-trading/lighter-sdk-ts/nonce_manager";
import { SignerClient } from "@quantnest-trading/lighter-sdk-ts/signer";
import { resolveExecutorNodeSecrets } from "../../services/reusableSecrets";
import type { NodeType } from "../../types";
import type { ZerodhaTradeCsvRow, ZerodhaTradeSummary } from "./zerodhaReportData";

const LIGHTER_BASE_URL = "https://mainnet.zklighter.elliot.ai/";
const MARKET_ID_TO_SYMBOL: Record<number, string> = {
  0: "ETH",
  1: "BTC",
  2: "SOL",
};

type LighterMetadata = {
  apiKey?: string;
  accountIndex?: number | string;
  apiKeyIndex?: number | string;
  secretId?: string;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toTimestampMs(timestamp: unknown): number {
  const value = toNumber(timestamp);
  if (!value) return 0;
  return value > 1_000_000_000_000 ? value : value * 1000;
}

function detectTradeSide(trade: any, accountIndex: number): "BUY" | "SELL" | "UNKNOWN" {
  if (toNumber(trade?.askAccountId) === accountIndex) return "SELL";
  if (toNumber(trade?.bidAccountId) === accountIndex) return "BUY";
  return "UNKNOWN";
}

function aggregateBySymbol(
  trades: any[],
  accountIndex: number,
): Array<{ symbol: string; side: string; quantity: number; avgPrice: number }> {
  const map = new Map<string, { symbol: string; side: string; quantity: number; totalValue: number }>();

  for (const trade of trades) {
    const side = detectTradeSide(trade, accountIndex);
    if (side === "UNKNOWN") continue;

    const symbol = MARKET_ID_TO_SYMBOL[toNumber(trade.marketId)] || `MKT-${toNumber(trade.marketId)}`;
    const key = `${symbol}:${side}`;
    const quantity = toNumber(trade.size);
    const price = toNumber(trade.price);

    const existing = map.get(key) || {
      symbol,
      side,
      quantity: 0,
      totalValue: 0,
    };

    existing.quantity += quantity;
    existing.totalValue += quantity * price;
    map.set(key, existing);
  }

  return [...map.values()]
    .map((entry) => ({
      symbol: entry.symbol,
      side: entry.side,
      quantity: Number(entry.quantity.toFixed(6)),
      avgPrice: entry.quantity > 0 ? Number((entry.totalValue / entry.quantity).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}

async function getLighterClient(input: {
  userId: string;
  nodes: NodeType[];
}) {
  const lighterNode = input.nodes.find(
    (node) =>
      String(node.data?.kind || "").toLowerCase() === "action" &&
      String(node.type || "").toLowerCase() === "lighter",
  );

  if (!lighterNode) {
    throw new Error("Lighter reporting requires at least one Lighter action node.");
  }

  const resolvedMetadata = await resolveExecutorNodeSecrets<LighterMetadata>({
    userId: input.userId,
    service: "lighter",
    metadata: (lighterNode.data?.metadata || {}) as LighterMetadata,
  });

  const apiKey = String(resolvedMetadata.apiKey || "").trim();
  const accountIndex = toNumber(resolvedMetadata.accountIndex);
  const apiKeyIndex = toNumber(resolvedMetadata.apiKeyIndex);

  if (!apiKey) {
    throw new Error("Missing Lighter API key on Lighter action node.");
  }

  const client = await SignerClient.create({
    url: LIGHTER_BASE_URL,
    privateKey: apiKey,
    accountIndex,
    apiKeyIndex,
    nonceManagementType: NonceManagerType.OPTIMISTIC,
  });

  return {
    client,
    accountIndex,
  };
}

export async function getLighterTradeSummary(input: {
  workflowId: string;
  userId: string;
  nodes: NodeType[];
}): Promise<ZerodhaTradeSummary> {
  const { client, accountIndex } = await getLighterClient(input);

  const profile = await client.getProfile(accountIndex);
  const positions = profile?.positions || [];

  const marketIds = Array.from(
    new Set(
      positions
        .map((position: any) => toNumber(position?.marketId))
        .filter((marketId) => marketId >= 0),
    ),
  );

  const orders = await client.getOrders({
    marketIds: marketIds.length ? marketIds : [0, 1, 2],
    includeInactive: true,
    inactiveLimit: 300,
  }, accountIndex);

  const tradesResponse = await client.getTrades({
    sortBy: "timestamp",
    sortDir: "desc",
    limit: 500,
    accountIndex,
  });

  const relevantTrades = (tradesResponse.trades || []).filter((trade: any) => {
    return toNumber(trade.askAccountId) === accountIndex || toNumber(trade.bidAccountId) === accountIndex;
  });

  const sortedTrades = [...relevantTrades].sort(
    (a: any, b: any) => toTimestampMs(b.timestamp) - toTimestampMs(a.timestamp),
  );

  const now = Date.now();
  const last30DaysCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const last30DayTrades = sortedTrades.filter((trade: any) => toTimestampMs(trade.timestamp) >= last30DaysCutoff);

  const completedOrders = orders.filter((order: any) => String(order.status || "").toLowerCase() === "filled");
  const rejectedOrders = orders.filter((order: any) => String(order.status || "").toLowerCase().startsWith("canceled"));
  const totalOrders = orders.length;
  const completionRate = totalOrders ? Number(((completedOrders.length / totalOrders) * 100).toFixed(1)) : 0;
  const rejectionRate = totalOrders ? Number(((rejectedOrders.length / totalOrders) * 100).toFixed(1)) : 0;

  const realizedPnl = Number(
    positions.reduce((sum: number, position: any) => sum + toNumber(position.realizedPnl), 0).toFixed(2),
  );
  const unrealizedPnl = Number(
    positions.reduce((sum: number, position: any) => sum + toNumber(position.unrealizedPnl), 0).toFixed(2),
  );

  const topSymbols = aggregateBySymbol(last30DayTrades.length ? last30DayTrades : sortedTrades, accountIndex);

  const sampleFailures = rejectedOrders
    .map((order: any) => String(order.status || "Canceled order"))
    .filter(Boolean)
    .slice(0, 5);

  return {
    totalOrders,
    completedOrders: completedOrders.length,
    rejectedOrders: rejectedOrders.length,
    totalTrades: sortedTrades.length,
    last30DayTradeCount: last30DayTrades.length,
    dayPositionCount: positions.length,
    netPositionCount: positions.filter((position: any) => Math.abs(toNumber(position.position)) > 0).length,
    completionRate,
    rejectionRate,
    realizedPnl,
    unrealizedPnl,
    holdingsPnl: 0,
    topSymbols,
    historicalContext: [],
    sampleFailures,
  };
}

export async function getLighterTradesForCsv(input: {
  workflowId: string;
  userId: string;
  nodes: NodeType[];
}): Promise<ZerodhaTradeCsvRow[]> {
  const { client, accountIndex } = await getLighterClient(input);

  const tradesResponse = await client.getTrades({
    sortBy: "timestamp",
    sortDir: "desc",
    limit: 500,
    accountIndex,
  });

  const trades = (tradesResponse.trades || []).filter((trade: any) => {
    return toNumber(trade.askAccountId) === accountIndex || toNumber(trade.bidAccountId) === accountIndex;
  });

  return trades
    .sort((a: any, b: any) => toTimestampMs(b.timestamp) - toTimestampMs(a.timestamp))
    .map((trade: any) => {
      const side = detectTradeSide(trade, accountIndex);
      const quantity = toNumber(trade.size);
      const averagePrice = toNumber(trade.price);
      const symbol = MARKET_ID_TO_SYMBOL[toNumber(trade.marketId)] || `MKT-${toNumber(trade.marketId)}`;
      const orderId = side === "SELL" ? String(trade.askId || "") : String(trade.bidId || "");

      return {
        tradeId: String(trade.tradeId || ""),
        orderId,
        symbol,
        exchange: "LIGHTER",
        side,
        quantity,
        averagePrice,
        value: Number((toNumber(trade.usdAmount) || quantity * averagePrice).toFixed(2)),
        fillTime: new Date(toTimestampMs(trade.timestamp)).toISOString(),
      };
    });
}
