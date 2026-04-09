import { assetCompanyName, assetMapped, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import YahooFinance from "yahoo-finance2";

export * from "./utils";
export * from "./indicators";

const yahooFinance = new YahooFinance();

type MarketType = "Indian" | "Crypto";
type HistoricalInterval = "1d" | "1wk" | "1mo";
type ChartInterval = "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo";
type MarketAssetType = "equity" | "crypto";

const MARKET_ASSET_CACHE_TTL_MS = 15 * 60 * 1000;

const marketAssetCache = new Map<string, {
  fetchedAt: number;
  assets: MarketAsset[];
}>();

const INDIAN_SEARCH_QUERIES = [
  "NSE",
  "BSE",
  "NIFTY 50",
  "India stocks",
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "LT",
  "BHARTIARTL",
  "ITC",
  "KOTAKBANK",
  "AXISBANK",
  "ASIANPAINT",
  "MARUTI",
  "SUNPHARMA",
  "TITAN",
  "ULTRACEMCO",
  "NESTLEIND",
  "BAJFINANCE",
  "WIPRO",
  "POWERGRID",
  "NTPC",
  "HCLTECH",
  "TATAMOTORS",
  "ONGC",
  "COALINDIA",
  "ADANIENT",
  "ADANIPORTS",
  "M&M",
  "BAJAJFINSV",
  "JSWSTEEL",
  "HINDUNILVR",
  "DRREDDY",
  "NIFTY BANK",
  "NIFTY IT",
  "NIFTY PHARMA",
  "NIFTY AUTO",
  "NIFTY FMCG",
  "Indian banking stocks",
  "Indian energy stocks",
  "Indian auto stocks",
  "Indian pharma stocks",
  "Indian metal stocks",
];

const CRYPTO_SEARCH_QUERIES = [
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "Crypto USD",
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Binance Coin",
  "Ripple XRP",
  "Dogecoin",
  "Cardano",
  "Avalanche",
  "Polkadot",
  "Chainlink",
  "Litecoin",
  "Tron",
  "Near Protocol",
  "Aave",
  "Top crypto coins",
];

const DEFAULT_CRYPTO_FALLBACK_SYMBOLS = [
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "DOT",
  "LINK",
  "LTC",
  "TRX",
  "NEAR",
  "AAVE",
  "BCH",
  "ETC",
  "XLM",
  "ATOM",
  "ALGO",
  "APT",
];

export interface MarketAsset {
  symbol: string;
  ticker: string;
  market: MarketType;
  type: MarketAssetType;
  name?: string;
}

export interface HistoricalBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function resolveTicker(asset: string, market: MarketType) {
  const normalizedAsset = String(asset || "").trim().toUpperCase();

  if (market === "Indian") {
    if (!normalizedAsset) {
      throw new Error("Asset is required for Indian market.");
    }

    if (normalizedAsset.includes(".")) {
      return normalizedAsset;
    }

    if (assetMapped[normalizedAsset]) {
      return assetMapped[normalizedAsset];
    }

    return `${normalizedAsset}.NS`;
  }

  if (!normalizedAsset) {
    throw new Error("Asset is required for Crypto market.");
  }

  if (normalizedAsset.includes("-")) {
    return normalizedAsset;
  }

  return `${normalizedAsset}-USD`;
}

function normalizeIndianSymbol(ticker: string) {
  return ticker.replace(/\.(NS|BO)$/i, "").toUpperCase();
}

function buildFallbackIndianAssets(limit = 50): MarketAsset[] {
  return Object.entries(assetMapped)
    .map(([symbol, ticker]) => ({
      symbol,
      ticker,
      market: "Indian" as const,
      type: "equity" as const,
      name: assetCompanyName[symbol],
    }))
    .slice(0, Math.max(limit, 1));
}

function buildFallbackCryptoAssets(limit = 50): MarketAsset[] {
  const symbols = Array.from(new Set([...SUPPORTED_WEB3_ASSETS, ...DEFAULT_CRYPTO_FALLBACK_SYMBOLS]));

  return symbols
    .map((symbol) => ({
      symbol,
      ticker: `${symbol}-USD`,
      market: "Crypto" as const,
      type: "crypto" as const,
      name: symbol,
    }))
    .slice(0, Math.max(limit, 1));
}

function mergeUniqueAssets(primary: MarketAsset[], fallback: MarketAsset[], limit: number): MarketAsset[] {
  const uniqueBySymbol = new Map<string, MarketAsset>();

  for (const asset of primary) {
    const symbol = String(asset.symbol || "").trim().toUpperCase();
    if (!symbol) continue;
    uniqueBySymbol.set(symbol, {
      ...asset,
      symbol,
    });
  }

  for (const asset of fallback) {
    const symbol = String(asset.symbol || "").trim().toUpperCase();
    if (!symbol || uniqueBySymbol.has(symbol)) continue;
    uniqueBySymbol.set(symbol, {
      ...asset,
      symbol,
    });
  }

  return Array.from(uniqueBySymbol.values()).slice(0, Math.max(limit, 1));
}

function isValidIndianQuote(quote: any): boolean {
  const symbol = String(quote?.symbol || "").toUpperCase();
  if (!symbol.endsWith(".NS") && !symbol.endsWith(".BO")) {
    return false;
  }

  const baseSymbol = normalizeIndianSymbol(symbol);
  // Keep plain equity-like symbols and skip derivative-style variants.
  if (!/^[A-Z0-9]+$/.test(baseSymbol)) {
    return false;
  }

  const quoteType = String(quote?.quoteType || "").toUpperCase();
  if (quoteType && !["EQUITY", "ETF", "INDEX"].includes(quoteType)) {
    return false;
  }

  return true;
}

function isValidCryptoQuote(quote: any): boolean {
  const symbol = String(quote?.symbol || "").toUpperCase();
  if (!/^[A-Z]{2,12}-USD$/.test(symbol)) {
    return false;
  }

  const quoteType = String(quote?.quoteType || "").toUpperCase();
  if (quoteType && !["CRYPTOCURRENCY", "CURRENCY"].includes(quoteType)) {
    return false;
  }

  return true;
}

async function searchYahooQuotes(
  query: string,
  options?: {
    quotesCount?: number;
    region?: string;
    lang?: string;
    enableFuzzyQuery?: boolean;
  },
): Promise<any[]> {
  try {
    const result = await (yahooFinance as any).search(query, {
      quotesCount: options?.quotesCount ?? 50,
      region: options?.region,
      lang: options?.lang,
      newsCount: 0,
      enableFuzzyQuery: options?.enableFuzzyQuery ?? false,
    });

    return Array.isArray(result?.quotes) ? result.quotes : [];
  } catch {
    return [];
  }
}

async function fetchIndianAssetsFromYahoo(limit: number): Promise<MarketAsset[]> {
  const assetMap = new Map<string, MarketAsset>();

  for (const query of INDIAN_SEARCH_QUERIES) {
    const quotes = await searchYahooQuotes(query, {
      quotesCount: 25,
      region: "IN",
      lang: "en-IN",
      enableFuzzyQuery: true,
    });
    for (const quote of quotes) {
      if (!isValidIndianQuote(quote)) continue;

      const ticker = String(quote.symbol || "").toUpperCase();
      const symbol = normalizeIndianSymbol(ticker);
      if (!symbol) continue;

      assetMap.set(symbol, {
        symbol,
        ticker,
        market: "Indian",
        type: "equity",
        name: String(quote.shortname || quote.longname || "").trim() || undefined,
      });

      if (assetMap.size >= limit) {
        return Array.from(assetMap.values());
      }
    }
  }

  return Array.from(assetMap.values());
}

async function fetchCryptoAssetsFromYahoo(limit: number): Promise<MarketAsset[]> {
  const assetMap = new Map<string, MarketAsset>();

  for (const query of CRYPTO_SEARCH_QUERIES) {
    const quotes = await searchYahooQuotes(query, {
      quotesCount: 30,
      region: "US",
      lang: "en-US",
      enableFuzzyQuery: true,
    });
    for (const quote of quotes) {
      if (!isValidCryptoQuote(quote)) continue;

      const ticker = String(quote.symbol || "").toUpperCase();
      const symbol = ticker.replace(/-USD$/i, "").toUpperCase();
      if (!symbol) continue;

      assetMap.set(symbol, {
        symbol,
        ticker,
        market: "Crypto",
        type: "crypto",
        name: String(quote.shortname || quote.longname || symbol).trim() || symbol,
      });

      if (assetMap.size >= limit) {
        return Array.from(assetMap.values());
      }
    }
  }

  return Array.from(assetMap.values());
}

export async function getMarketAssets(
  market: MarketType,
  options?: { limit?: number; forceRefresh?: boolean },
): Promise<MarketAsset[]> {
  const limit = Math.max(1, Number(options?.limit || 50));
  const cacheKey = `${market}:${limit}`;

  if (!options?.forceRefresh) {
    const cached = marketAssetCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < MARKET_ASSET_CACHE_TTL_MS) {
      return cached.assets;
    }
  }

  let assets: MarketAsset[] = [];
  if (market === "Indian") {
    const yahooAssets = await fetchIndianAssetsFromYahoo(limit);
    const fallbackAssets = buildFallbackIndianAssets(limit);
    assets = mergeUniqueAssets(yahooAssets, fallbackAssets, limit);
  } else {
    const yahooAssets = await fetchCryptoAssetsFromYahoo(limit);
    const fallbackAssets = buildFallbackCryptoAssets(limit);
    assets = mergeUniqueAssets(yahooAssets, fallbackAssets, limit);
  }

  marketAssetCache.set(cacheKey, {
    fetchedAt: Date.now(),
    assets,
  });

  return assets;
}

export async function getAllMarketAssets(options?: { limitPerMarket?: number; forceRefresh?: boolean }) {
  const limitPerMarket = Math.max(1, Number(options?.limitPerMarket || 50));
  const [indian, crypto] = await Promise.all([
    getMarketAssets("Indian", { limit: limitPerMarket, forceRefresh: options?.forceRefresh }),
    getMarketAssets("Crypto", { limit: limitPerMarket, forceRefresh: options?.forceRefresh }),
  ]);

  return {
    Indian: indian,
    Crypto: crypto,
  };
}

export async function getCurrentPrice(asset: string, market: MarketType): Promise<number> {
  try {
    const quote = await yahooFinance.quote(resolveTicker(asset, market));
    return quote.regularMarketPrice;
  } catch (error) {
    console.error("Failed to fetch price for", asset, error);
    throw new Error(`Failed to fetch current price for ${asset}`);
  }
}

export async function getHistoricalPrice(
  asset: string,
  market: MarketType,
  period1: Date,
  period2: Date,
  interval: HistoricalInterval = "1d",
): Promise<HistoricalBar[]> {
  try {
    const historicalData = await yahooFinance.historical(resolveTicker(asset, market), {
      period1,
      period2,
      interval,
    });

    return historicalData.map((item) => ({
      date: item.date,
      open: item.open ?? 0,
      high: item.high ?? item.open ?? 0,
      low: item.low ?? item.open ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
    }));
  } catch (error) {
    console.error("Failed to fetch historical price for", asset, error);
    throw new Error(`Failed to fetch historical price for ${asset} from ${period1} to ${period2}`);
  }
}

export async function getHistoricalChart(
  asset: string,
  market: MarketType,
  period1: Date,
  interval: ChartInterval,
): Promise<HistoricalBar[]> {
  try {
    const historicalChart = await yahooFinance.chart(resolveTicker(asset, market), {
      period1,
      interval,
    });

    return historicalChart.quotes.map((quote) => ({
      date: quote.date,
      open: quote.open ?? 0,
      high: quote.high ?? quote.open ?? 0,
      low: quote.low ?? quote.open ?? 0,
      close: quote.close ?? 0,
      volume: quote.volume ?? 0,
    }));
  } catch (error) {
    console.error("Failed to fetch historical chart for", asset, error);
    throw new Error(`Failed to fetch historical chart for ${asset} from ${period1}`);
  }
}

export async function getVolume(asset: string, market: MarketType): Promise<number> {
  try {
    const quote = await yahooFinance.quote(resolveTicker(asset, market));
    return quote.regularMarketVolume;
  } catch (error) {
    console.error("Failed to fetch volume for", asset, error);
    throw new Error(`Failed to fetch volume for ${asset}`);
  }
}
