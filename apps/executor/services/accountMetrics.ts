import axios from "axios";
import { KiteConnect } from "kiteconnect";
import { NonceManagerType } from "@quantnest-trading/lighter-sdk-ts/nonce_manager";
import { SignerClient } from "@quantnest-trading/lighter-sdk-ts/signer";
import { resolveExecutorNodeSecrets } from "./reusableSecrets";

export type BrokerAccountMetricsBroker = "zerodha" | "groww" | "lighter";

export interface BrokerAccountMetricsRequest {
  userId?: string;
  workflowId?: string;
  broker: BrokerAccountMetricsBroker;
  metadata: Record<string, unknown>;
}

export interface BrokerAccountMetrics {
  broker: BrokerAccountMetricsBroker;
  accountRef: string;
  currency: "INR" | "USD";
  realizedPnl: number;
  unrealizedPnl: number;
  holdingsPnl: number;
  totalPnl: number;
  accountValue?: number;
  measuredAt: string;
  raw?: Record<string, unknown>;
}

const LIGHTER_BASE_URL = "https://mainnet.zklighter.elliot.ai/";
const GROWW_BASE_URL = "https://api.groww.in";

type AnyRecord = Record<string, unknown>;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}

function pickNumber(record: unknown, keys: string[]): number | undefined {
  if (!record || typeof record !== "object") return undefined;
  const source = record as AnyRecord;
  for (const key of keys) {
    const parts = key.split(".");
    let current: unknown = source;
    for (const part of parts) {
      if (!current || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as AnyRecord)[part];
    }
    if (current === undefined || current === null || current === "") continue;
    const parsed = Number(current);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function extractArray(payload: unknown): AnyRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is AnyRecord => Boolean(entry) && typeof entry === "object");
  }
  if (!payload || typeof payload !== "object") return [];
  const record = payload as AnyRecord;
  for (const key of ["data", "items", "positions", "holdings", "result", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is AnyRecord => Boolean(entry) && typeof entry === "object");
    }
  }
  return [];
}

async function resolveBrokerMetadata<T extends Record<string, unknown>>(request: BrokerAccountMetricsRequest): Promise<T> {
  const secretId = String(request.metadata?.secretId || "").trim();
  if (!secretId || !request.userId) {
    return request.metadata as T;
  }

  return resolveExecutorNodeSecrets<T>({
    userId: request.userId,
    service: request.broker,
    metadata: request.metadata as T,
  });
}

async function getZerodhaMetrics(request: BrokerAccountMetricsRequest): Promise<BrokerAccountMetrics> {
  const metadata = await resolveBrokerMetadata<{ apiKey?: string; accessToken?: string }>(request);
  const apiKey = String(metadata.apiKey || "").trim();
  const accessToken = String(metadata.accessToken || "").trim();
  if (!apiKey || !accessToken) {
    throw new Error("Zerodha account metrics require apiKey and accessToken or a saved Zerodha secret.");
  }

  const kc: any = new KiteConnect({ api_key: apiKey });
  kc.setAccessToken(accessToken);

  const [positionsRes, holdingsRes, marginsRes] = await Promise.allSettled([
    kc.getPositions(),
    kc.getHoldings(),
    typeof kc.getMargins === "function" ? kc.getMargins() : Promise.resolve(null),
  ]);

  const positions = positionsRes.status === "fulfilled" ? (positionsRes.value as { net?: AnyRecord[]; day?: AnyRecord[] }) : {};
  const holdings = holdingsRes.status === "fulfilled" && Array.isArray(holdingsRes.value) ? holdingsRes.value as AnyRecord[] : [];
  const margins = marginsRes.status === "fulfilled" ? marginsRes.value : null;
  const netPositions = Array.isArray(positions.net) ? positions.net : [];

  const realizedPnl = roundMoney(netPositions.reduce((sum, position) => sum + toNumber(position.realised), 0));
  const unrealizedPnl = roundMoney(netPositions.reduce((sum, position) => sum + toNumber(position.unrealised), 0));
  const holdingsPnl = roundMoney(holdings.reduce((sum, holding) => sum + toNumber(holding.pnl), 0));
  const accountValue = pickNumber(margins, [
    "equity.net",
    "equity.available.live_balance",
    "equity.available.cash",
    "equity.available.opening_balance",
    "commodity.net",
  ]);

  return {
    broker: "zerodha",
    accountRef: "zerodha:primary",
    currency: "INR",
    realizedPnl,
    unrealizedPnl,
    holdingsPnl,
    totalPnl: roundMoney(realizedPnl + unrealizedPnl + holdingsPnl),
    accountValue: accountValue === undefined ? undefined : roundMoney(accountValue),
    measuredAt: new Date().toISOString(),
    raw: {
      positionCount: netPositions.length,
      holdingCount: holdings.length,
    },
  };
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
      if (items.length) return items;
    } catch {
      continue;
    }
  }
  return [];
}

function extractGenericPnl(rows: AnyRecord[]): { realizedPnl: number; unrealizedPnl: number; holdingsPnl: number; accountValue?: number } {
  let realizedPnl = 0;
  let unrealizedPnl = 0;
  let holdingsPnl = 0;
  let accountValue = 0;
  let sawPnl = false;

  for (const row of rows) {
    const realized = pickNumber(row, ["realized_pnl", "realised_pnl", "realizedPnl", "realisedPnl", "realised", "realized"]);
    const unrealized = pickNumber(row, ["unrealized_pnl", "unrealised_pnl", "unrealizedPnl", "unrealisedPnl", "unrealised", "unrealized"]);
    const pnl = pickNumber(row, ["pnl", "profit_loss", "profitLoss"]);
    const value = pickNumber(row, ["current_value", "currentValue", "market_value", "marketValue", "value"]);

    if (realized !== undefined) {
      realizedPnl += realized;
      sawPnl = true;
    }
    if (unrealized !== undefined) {
      unrealizedPnl += unrealized;
      sawPnl = true;
    }
    if (pnl !== undefined && realized === undefined && unrealized === undefined) {
      holdingsPnl += pnl;
      sawPnl = true;
    }
    if (value !== undefined) {
      accountValue += value;
    }
  }

  if (!sawPnl) {
    throw new Error("Groww account metrics endpoint did not return PnL fields.");
  }

  return {
    realizedPnl: roundMoney(realizedPnl),
    unrealizedPnl: roundMoney(unrealizedPnl),
    holdingsPnl: roundMoney(holdingsPnl),
    accountValue: accountValue > 0 ? roundMoney(accountValue) : undefined,
  };
}

async function getGrowwMetrics(request: BrokerAccountMetricsRequest): Promise<BrokerAccountMetrics> {
  const metadata = await resolveBrokerMetadata<{ accessToken?: string }>(request);
  const accessToken = String(metadata.accessToken || "").trim();
  if (!accessToken) {
    throw new Error("Groww account metrics require accessToken or a saved Groww secret.");
  }

  const [positions, holdings] = await Promise.all([
    fetchGrowwList(accessToken, ["/v1/positions", "/v1/portfolio/positions", "/v1/position/list"]),
    fetchGrowwList(accessToken, ["/v1/holdings", "/v1/portfolio/holdings", "/v1/holding/list"]),
  ]);
  const extracted = extractGenericPnl([...positions, ...holdings]);

  return {
    broker: "groww",
    accountRef: "groww:primary",
    currency: "INR",
    ...extracted,
    totalPnl: roundMoney(extracted.realizedPnl + extracted.unrealizedPnl + extracted.holdingsPnl),
    measuredAt: new Date().toISOString(),
    raw: {
      positionCount: positions.length,
      holdingCount: holdings.length,
    },
  };
}

async function getLighterMetrics(request: BrokerAccountMetricsRequest): Promise<BrokerAccountMetrics> {
  const metadata = await resolveBrokerMetadata<{ apiKey?: string; accountIndex?: number | string; apiKeyIndex?: number | string }>(request);
  const apiKey = String(metadata.apiKey || "").trim();
  const accountIndex = toNumber(metadata.accountIndex);
  const apiKeyIndex = toNumber(metadata.apiKeyIndex);
  if (!apiKey) {
    throw new Error("Lighter account metrics require apiKey/accountIndex/apiKeyIndex or a saved Lighter secret.");
  }

  const client = await SignerClient.create({
    url: LIGHTER_BASE_URL,
    privateKey: apiKey,
    accountIndex,
    apiKeyIndex,
    nonceManagementType: NonceManagerType.OPTIMISTIC,
  });
  const profile = await client.getProfile(accountIndex);
  const positions = Array.isArray((profile as any)?.positions) ? (profile as any).positions : [];
  const accountValue = pickNumber(profile, ["portfolioValue", "portfolio_value", "accountValue", "totalAccountValue", "collateral"]);
  const realizedPnl = roundMoney(positions.reduce((sum: number, position: any) => sum + toNumber(position.realizedPnl ?? position.realized_pnl), 0));
  const unrealizedPnl = roundMoney(positions.reduce((sum: number, position: any) => sum + toNumber(position.unrealizedPnl ?? position.unrealized_pnl), 0));

  return {
    broker: "lighter",
    accountRef: `lighter:${accountIndex}`,
    currency: "USD",
    realizedPnl,
    unrealizedPnl,
    holdingsPnl: 0,
    totalPnl: roundMoney(realizedPnl + unrealizedPnl),
    accountValue: accountValue === undefined ? undefined : roundMoney(accountValue),
    measuredAt: new Date().toISOString(),
    raw: {
      positionCount: positions.length,
      accountIndex,
    },
  };
}

export async function getBrokerAccountMetrics(request: BrokerAccountMetricsRequest): Promise<BrokerAccountMetrics> {
  if (request.broker === "zerodha") return getZerodhaMetrics(request);
  if (request.broker === "groww") return getGrowwMetrics(request);
  if (request.broker === "lighter") return getLighterMetrics(request);
  throw new Error(`Unsupported broker for account metrics: ${String(request.broker)}`);
}
