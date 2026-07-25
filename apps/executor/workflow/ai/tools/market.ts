import {
  getCurrentPrice,
  getVolume,
  getHistoricalPrice,
  getMarketAssets,
  isMarketOpen,
  getTimeUntilMarketOpen,
} from "@quantnest-trading/market";
import type { ToolHandler } from "./types";

export const getPriceTool: ToolHandler = {
  definition: {
    name: "get_market_price",
    description: "Get the current market price of a stock or crypto asset",
    parameters: {
      type: "OBJECT",
      properties: {
        asset: {
          type: "STRING",
          description: "The asset symbol (e.g. RELIANCE, BTC, ETH, AAPL)",
        },
        market: {
          type: "STRING",
          description: "The market type: 'Indian' or 'Crypto'",
          enum: ["Indian", "Crypto"],
        },
      },
      required: ["asset", "market"],
    },
  },
  async execute(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const asset = String(args.asset ?? "");
    const marketRaw = String(args.market ?? "");
    const market = marketRaw === "Crypto" ? "Crypto" : "Indian";

    if (!asset) {
      return { error: "Asset is required", price: null };
    }

    try {
      const price = await getCurrentPrice(asset, market);
      return {
        symbol: asset,
        market,
        price,
        currency: market === "Indian" ? "INR" : "USD",
      };
    } catch (error) {
      return {
        error: `Failed to fetch price for ${asset}: ${error instanceof Error ? error.message : "Unknown error"}`,
        price: null,
      };
    }
  },
};

export const getVolumeTool: ToolHandler = {
  definition: {
    name: "get_market_volume",
    description: "Get the current trading volume of a stock or crypto asset",
    parameters: {
      type: "OBJECT",
      properties: {
        asset: {
          type: "STRING",
          description: "The asset symbol (e.g. RELIANCE, BTC, ETH, AAPL)",
        },
        market: {
          type: "STRING",
          description: "The market type: 'Indian' or 'Crypto'",
          enum: ["Indian", "Crypto"],
        },
      },
      required: ["asset", "market"],
    },
  },
  async execute(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const asset = String(args.asset ?? "");
    const market = String(args.market ?? "") === "Crypto" ? "Crypto" : "Indian";

    if (!asset) {
      return { error: "Asset is required", volume: null };
    }

    try {
      const volume = await getVolume(asset, market);
      return { symbol: asset, market, volume };
    } catch (error) {
      return {
        error: `Failed to fetch volume for ${asset}: ${error instanceof Error ? error.message : "Unknown error"}`,
        volume: null,
      };
    }
  },
};

export const getHistoricalTool: ToolHandler = {
  definition: {
    name: "get_market_historical",
    description:
      "Get historical price data for a stock or crypto asset over a date range",
    parameters: {
      type: "OBJECT",
      properties: {
        asset: {
          type: "STRING",
          description: "The asset symbol (e.g. RELIANCE, BTC, ETH, AAPL)",
        },
        market: {
          type: "STRING",
          description: "The market type: 'Indian' or 'Crypto'",
          enum: ["Indian", "Crypto"],
        },
        period1: {
          type: "STRING",
          description:
            "Start date in ISO format (e.g. 2024-01-01 or 2024-01-01T00:00:00Z)",
        },
        period2: {
          type: "STRING",
          description:
            "End date in ISO format (e.g. 2024-12-31 or 2024-12-31T00:00:00Z)",
        },
        interval: {
          type: "STRING",
          description:
            "Candle interval: '1d' (daily), '1wk' (weekly), or '1mo' (monthly)",
          enum: ["1d", "1wk", "1mo"],
        },
      },
      required: ["asset", "market", "period1", "period2"],
    },
  },
  async execute(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const asset = String(args.asset ?? "");
    const market = String(args.market ?? "") === "Crypto" ? "Crypto" : "Indian";
    const period1 = String(args.period1 ?? "");
    const period2 = String(args.period2 ?? "");
    const interval = String(args.interval ?? "1d") as "1d" | "1wk" | "1mo";

    if (!asset) {
      return { error: "Asset is required", bars: null };
    }

    if (!period1 || !period2) {
      return { error: "period1 and period2 are required", bars: null };
    }

    try {
      const p1 = new Date(period1);
      const p2 = new Date(period2);
      if (Number.isNaN(p1.getTime()) || Number.isNaN(p2.getTime())) {
        return {
          error: "Invalid date format. Use ISO format (e.g. 2024-01-01)",
          bars: null,
        };
      }

      const bars = await getHistoricalPrice(asset, market, p1, p2, interval);
      return {
        symbol: asset,
        market,
        interval,
        period1: p1.toISOString(),
        period2: p2.toISOString(),
        barCount: bars.length,
        bars: bars.map((b) => ({
          date: b.date instanceof Date ? b.date.toISOString() : String(b.date),
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
        })),
      };
    } catch (error) {
      return {
        error: `Failed to fetch historical data for ${asset}: ${error instanceof Error ? error.message : "Unknown error"}`,
        bars: null,
      };
    }
  },
};

export const getAssetsTool: ToolHandler = {
  definition: {
    name: "get_market_assets",
    description:
      "Get the list of available tradeable assets (stocks or cryptocurrencies)",
    parameters: {
      type: "OBJECT",
      properties: {
        market: {
          type: "STRING",
          description: "The market type: 'Indian' or 'Crypto'",
          enum: ["Indian", "Crypto"],
        },
        limit: {
          type: "NUMBER",
          description:
            "Maximum number of assets to return (default 50, max 200)",
        },
      },
      required: ["market"],
    },
  },
  async execute(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const market = String(args.market ?? "") === "Crypto" ? "Crypto" : "Indian";
    const limit = Math.min(200, Math.max(1, Number(args.limit ?? 50)));

    try {
      const assets = await getMarketAssets(market, { limit });
      return {
        market,
        total: assets.length,
        assets: assets.map((a) => ({
          symbol: a.symbol,
          name: a.name ?? null,
          type: a.type,
        })),
      };
    } catch (error) {
      return {
        error: `Failed to fetch assets for ${market}: ${error instanceof Error ? error.message : "Unknown error"}`,
        assets: null,
      };
    }
  },
};

export const getMarketStatusTool: ToolHandler = {
  definition: {
    name: "get_market_status",
    description:
      "Check whether the Indian market is currently open or closed, and time until next open",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  async execute(): Promise<Record<string, unknown>> {
    try {
      const open = isMarketOpen();
      const timeUntilOpenMs = getTimeUntilMarketOpen();
      const timeUntilOpenMin = Math.ceil(timeUntilOpenMs / 60000);
      return {
        market: "Indian",
        isOpen: open,
        timeUntilNextOpenMs: timeUntilOpenMs,
        timeUntilNextOpenMinutes: timeUntilOpenMin,
        message: open
          ? "Indian market is currently open"
          : `Indian market is currently closed. Next open in ~${timeUntilOpenMin} minutes.`,
      };
    } catch (error) {
      return {
        error: `Failed to get market status: ${error instanceof Error ? error.message : "Unknown error"}`,
        isOpen: null,
      };
    }
  },
};
