import { getBrokerAccountMetrics } from "../../../services/accountMetrics";
import type { ToolHandler } from "./types";

export const getPortfolioSnapshotTool: ToolHandler = {
  definition: {
    name: "get_portfolio_snapshot",
    description:
      "Get current portfolio snapshot including P&L, account value, and position summary from a connected broker",
    parameters: {
      type: "OBJECT",
      properties: {
        broker: {
          type: "STRING",
          description:
            "The broker to fetch portfolio data from: 'zerodha', 'groww', or 'lighter'",
          enum: ["zerodha", "groww", "lighter"],
        },
        secretId: {
          type: "STRING",
          description:
            "Optional saved secret ID for broker credentials (avoids passing raw API keys)",
        },
        apiKey: {
          type: "STRING",
          description:
            "Broker API key (required if no secretId; for Lighter this is the private key)",
        },
        accessToken: {
          type: "STRING",
          description:
            "Broker access token (required for Zerodha/Groww if no secretId)",
        },
        accountIndex: {
          type: "NUMBER",
          description: "Account index for Lighter broker (default 0)",
        },
      },
      required: ["broker"],
    },
  },
  async execute(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const broker = String(args.broker ?? "")
      .trim()
      .toLowerCase() as "zerodha" | "groww" | "lighter";

    if (!["zerodha", "groww", "lighter"].includes(broker)) {
      return {
        error: "Invalid broker. Must be 'zerodha', 'groww', or 'lighter'",
        snapshot: null,
      };
    }

    try {
      const metrics = await getBrokerAccountMetrics({
        broker,
        metadata: {
          secretId: String(args.secretId ?? "").trim() || undefined,
          apiKey: String(args.apiKey ?? "").trim() || undefined,
          accessToken: String(args.accessToken ?? "").trim() || undefined,
          accountIndex: args.accountIndex ?? 0,
        },
      });

      return {
        snapshot: {
          broker: metrics.broker,
          accountRef: metrics.accountRef,
          currency: metrics.currency,
          realizedPnl: metrics.realizedPnl,
          unrealizedPnl: metrics.unrealizedPnl,
          holdingsPnl: metrics.holdingsPnl,
          totalPnl: metrics.totalPnl,
          accountValue: metrics.accountValue ?? null,
          measuredAt: metrics.measuredAt,
        },
      };
    } catch (error) {
      return {
        error: `Failed to fetch portfolio snapshot: ${error instanceof Error ? error.message : "Unknown error"}`,
        snapshot: null,
      };
    }
  },
};
