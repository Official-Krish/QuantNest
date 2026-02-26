import { getZerodhaToken } from "@quantnest-trading/executor-utils";
import { KiteConnect } from "kiteconnect";
import type { Order, PortfolioHolding, Position, Trade } from "kiteconnect/types/connect";
import type { NodeType } from "../../types";

export interface ZerodhaTradeSummary {
    totalOrders: number;
    completedOrders: number;
    rejectedOrders: number;
    totalTrades: number;
    last30DayTradeCount: number;
    dayPositionCount: number;
    netPositionCount: number;
    completionRate: number;
    rejectionRate: number;
    realizedPnl: number;
    unrealizedPnl: number;
    holdingsPnl: number;
    topSymbols: Array<{ symbol: string; side: string; quantity: number; avgPrice: number }>;
    historicalContext: Array<{ symbol: string; changePct30d: number | null; lastClose: number | null }>;
    sampleFailures: string[];
}

function parseTime(value: unknown): number {
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function aggregateBySymbol(trades: Trade[]): Array<{ symbol: string; side: string; quantity: number; avgPrice: number }> {
    const map = new Map<string, { symbol: string; side: string; quantity: number; totalValue: number }>();
    for (const trade of trades) {
        const side = String(trade.transaction_type || "").toUpperCase();
        const symbol = `${trade.exchange}:${trade.tradingsymbol}:${side}`;
        const quantity = Number(trade.quantity || trade.filled || 0);
        const price = Number(trade.average_price || 0);
        const existing = map.get(symbol) || { symbol: `${trade.exchange}:${trade.tradingsymbol}`, side, quantity: 0, totalValue: 0 };
        existing.quantity += quantity;
        existing.totalValue += quantity * price;
        map.set(symbol, existing);
    }
    return [...map.values()]
        .map((entry) => ({
            symbol: entry.symbol,
            side: entry.side,
            quantity: entry.quantity,
            avgPrice: entry.quantity > 0 ? Number((entry.totalValue / entry.quantity).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
}

async function fetchHistoricalContext(
    kc: any,
    orders: Order[],
): Promise<Array<{ symbol: string; changePct30d: number | null; lastClose: number | null }>> {
    const seen = new Set<string>();
    const candidates = orders
        .filter((order) => Number(order.instrument_token) > 0)
        .map((order) => ({
            symbol: `${order.exchange}:${order.tradingsymbol}`,
            token: Number(order.instrument_token),
        }))
        .filter((item) => {
            if (seen.has(item.symbol)) return false;
            seen.add(item.symbol);
            return true;
        })
        .slice(0, 5);

    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = new Date();

    const settled = await Promise.allSettled(
        candidates.map(async (candidate) => {
            if (typeof kc.getHistoricalData !== "function") {
                return { symbol: candidate.symbol, changePct30d: null, lastClose: null };
            }
            const candles = await kc.getHistoricalData(candidate.token, "day", from, to);
            if (!candles.length) {
                return { symbol: candidate.symbol, changePct30d: null, lastClose: null };
            }
            const first = candles[0];
            const last = candles[candles.length - 1];
            const firstClose = Number((first as any)?.close || 0);
            const lastClose = Number((last as any)?.close || 0);
            if (!firstClose || !lastClose) {
                return { symbol: candidate.symbol, changePct30d: null, lastClose: null };
            }
            return {
                symbol: candidate.symbol,
                changePct30d: Number((((lastClose - firstClose) / firstClose) * 100).toFixed(2)),
                lastClose: Number(lastClose.toFixed(2)),
            };
        }),
    );

    return settled.reduce<Array<{ symbol: string; changePct30d: number | null; lastClose: number | null }>>((acc, entry) => {
        if (entry.status === "fulfilled") {
            acc.push(entry.value);
        }
        return acc;
    }, []);
}

export async function getZerodhaTradeSummary(input: {
    workflowId: string;
    userId: string;
    nodes: NodeType[];
}): Promise<ZerodhaTradeSummary> {
    const zerodhaNode = input.nodes.find(
        (node) =>
            String(node.data?.kind || "").toLowerCase() === "action" &&
            String(node.type || "").toLowerCase() === "zerodha",
    );
    if (!zerodhaNode) {
        throw new Error("Notion Daily Report is only supported when a Zerodha action node exists");
    }

    const zerodhaApiKey = String(zerodhaNode.data?.metadata?.apiKey || "").trim();
    if (!zerodhaApiKey) {
        throw new Error("Missing Zerodha API key on Zerodha action node");
    }

    const accessToken = await getZerodhaToken(input.userId, input.workflowId);
    if (!accessToken) {
        throw new Error("Missing valid Zerodha access token for workflow");
    }

    const kc: any = new KiteConnect({ api_key: zerodhaApiKey });
    kc.setAccessToken(accessToken);

    const [ordersRes, tradesRes, positionsRes, holdingsRes] = await Promise.allSettled([
        kc.getOrders(),
        kc.getTrades(),
        kc.getPositions(),
        kc.getHoldings(),
    ]);

    const orders: Order[] = ordersRes.status === "fulfilled" ? (ordersRes.value as Order[]) : [];
    const trades: Trade[] = tradesRes.status === "fulfilled" ? (tradesRes.value as Trade[]) : [];
    const positions: { net: Position[]; day: Position[] } = positionsRes.status === "fulfilled"
        ? (positionsRes.value as { net: Position[]; day: Position[] })
        : { net: [], day: [] };
    const holdings: PortfolioHolding[] = holdingsRes.status === "fulfilled" ? (holdingsRes.value as PortfolioHolding[]) : [];

    const sortedTrades = [...trades].sort(
        (a, b) => parseTime(b.fill_timestamp || b.order_timestamp) - parseTime(a.fill_timestamp || a.order_timestamp),
    );
    const recentTrades = sortedTrades.slice(0, 200);
    const last30DaysCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const last30DayTrades = sortedTrades.filter(
        (trade) => parseTime(trade.fill_timestamp || trade.order_timestamp) >= last30DaysCutoff,
    );

    const topSymbols = aggregateBySymbol(last30DayTrades.length ? last30DayTrades : recentTrades);
    const historicalContext = await fetchHistoricalContext(kc, orders);

    const netPositions = positions.net || [];
    const dayPositions = positions.day || [];
    const holdingsList = holdings;
    const realizedPnl = Number(
        netPositions.reduce((sum, position) => sum + Number(position.realised || 0), 0).toFixed(2),
    );
    const unrealizedPnl = Number(
        netPositions.reduce((sum, position) => sum + Number(position.unrealised || 0), 0).toFixed(2),
    );
    const holdingsPnl = Number(
        holdingsList.reduce((sum, holding) => sum + Number(holding.pnl || 0), 0).toFixed(2),
    );

    const completedOrders = orders.filter((order) => String(order.status || "").toUpperCase() === "COMPLETE");
    const rejectedOrders = orders.filter((order) => String(order.status || "").toUpperCase() === "REJECTED");
    const totalOrders = orders.length;
    const completionRate = totalOrders ? Number(((completedOrders.length / totalOrders) * 100).toFixed(1)) : 0;
    const rejectionRate = totalOrders ? Number(((rejectedOrders.length / totalOrders) * 100).toFixed(1)) : 0;

    const sampleFailures = rejectedOrders
        .map((order) => String(order.status_message_raw || order.status_message || "Rejected order"))
        .filter(Boolean)
        .slice(0, 5);

    return {
        totalOrders,
        completedOrders: completedOrders.length,
        rejectedOrders: rejectedOrders.length,
        totalTrades: recentTrades.length,
        last30DayTradeCount: last30DayTrades.length,
        dayPositionCount: dayPositions.length,
        netPositionCount: netPositions.length,
        completionRate,
        rejectionRate,
        realizedPnl,
        unrealizedPnl,
        holdingsPnl,
        topSymbols,
        historicalContext,
        sampleFailures,
    };
}
