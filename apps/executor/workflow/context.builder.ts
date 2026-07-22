import type { ExecutionContext } from "./execute.context";
import type { NodeType } from "../types";

export class ExecutionContextBuilder {
  private ctx: ExecutionContext = {
    executionMode: "live",
    trace: {
      nodeEntries: [],
      branchDecisions: [],
    },
  };

  setUser(userId?: string): this {
    this.ctx.userId = userId;
    return this;
  }

  setWorkflow(workflowId?: string): this {
    this.ctx.workflowId = workflowId;
    return this;
  }

  setExecutionMode(mode?: "live" | "dry-run"): this {
    this.ctx.executionMode = mode || "live";
    return this;
  }

  setCondition(_condition?: boolean): this {
    return this;
  }

  setTrigger(trigger: NodeType, nodes: NodeType[]): this {
    const connectedSymbols = [
      ...new Set(
        nodes
          .filter((node) => (node?.data?.kind || "").toLowerCase() === "action")
          .map((node) => node?.data?.metadata?.symbol)
          .filter(
            (symbol): symbol is string =>
              typeof symbol === "string" && symbol.length > 0,
          ),
      ),
    ];

    const inferredSymbol = trigger.data?.metadata?.asset || connectedSymbols[0];
    const inferredMarketType =
      trigger.data?.metadata?.marketType === "Crypto" ||
      trigger.data?.metadata?.marketType === "web3"
        ? "Crypto"
        : "Indian";

    this.ctx.details = {
      symbol: inferredSymbol,
      aiContext: {
        triggerType: trigger.type || "trigger",
        marketType: inferredMarketType,
        symbol: inferredSymbol,
        connectedSymbols,
        targetPrice: trigger.data?.metadata?.targetPrice,
        condition: trigger.data?.metadata?.condition,
        direction: trigger.data?.metadata?.direction,
        breakoutLevel: trigger.data?.metadata?.breakoutLevel,
        timerIntervalSeconds:
          trigger.type === "timer" ? trigger.data?.metadata?.time : undefined,
        expression: trigger.data?.metadata?.expression,
        evaluatedCondition: undefined,
      },
    };

    this.applyTriggerContext(trigger, connectedSymbols, inferredMarketType);
    return this;
  }

  private applyTriggerContext(
    trigger: NodeType,
    connectedSymbols: string[],
    _inferredMarketType: "Indian" | "Crypto",
  ): void {
    const type = trigger.type;

    if (type === "price-trigger") {
      this.ctx.eventType = "price_trigger";
      this.ctx.details = {
        symbol: trigger.data?.metadata?.asset,
        targetPrice: trigger.data?.metadata?.targetPrice,
        condition: trigger.data?.metadata?.condition,
        aiContext: {
          triggerType: "price-trigger",
          marketType:
            trigger.data?.metadata?.marketType === "Crypto"
              ? "Crypto"
              : "Indian",
          symbol: trigger.data?.metadata?.asset,
          connectedSymbols,
          targetPrice: trigger.data?.metadata?.targetPrice,
          condition: trigger.data?.metadata?.condition,
        },
      };
      return;
    }

    if (type === "breakout-retest-trigger") {
      this.ctx.eventType = "price_trigger";
      this.ctx.details = {
        symbol: trigger.data?.metadata?.asset,
        targetPrice: trigger.data?.metadata?.breakoutLevel,
        aiContext: {
          triggerType: "breakout-retest-trigger",
          marketType:
            trigger.data?.metadata?.marketType === "Crypto"
              ? "Crypto"
              : "Indian",
          symbol: trigger.data?.metadata?.asset,
          connectedSymbols,
          breakoutLevel: trigger.data?.metadata?.breakoutLevel,
          direction: trigger.data?.metadata?.direction,
        },
      };
      return;
    }

    if (type === "conditional-trigger" && trigger.data?.metadata) {
      this.ctx.details = {
        ...(this.ctx.details || {}),
        aiContext: {
          triggerType: "conditional-trigger",
          marketType:
            trigger.data?.metadata?.marketType === "Crypto"
              ? "Crypto"
              : "Indian",
          symbol: trigger.data?.metadata?.asset,
          connectedSymbols,
          targetPrice: trigger.data?.metadata?.targetPrice,
          condition: trigger.data?.metadata?.condition,
          expression: trigger.data?.metadata?.expression,
          evaluatedCondition: undefined,
        },
      };
      return;
    }
  }

  build(): ExecutionContext {
    return this.ctx;
  }
}
