import { getCurrentPrice, getVolume } from "@quantnest-trading/market";
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
