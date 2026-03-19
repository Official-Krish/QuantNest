import { assetMapped } from "@quantnest-trading/types";
import YahooFinance from "yahoo-finance2";

export * from "./utils";
export * from "./indicators";

const yahooFinance = new YahooFinance();

type MarketType = "Indian" | "Crypto";
type HistoricalInterval = "1d" | "1wk" | "1mo";
type ChartInterval = "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo";

export interface HistoricalBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function resolveTicker(asset: string, market: MarketType) {
  const ticker = market === "Indian" ? assetMapped[asset] : `${asset}-USD`;
  if (!ticker) {
    throw new Error(`Asset ${asset} not supported in market ${market}`);
  }
  return ticker;
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
