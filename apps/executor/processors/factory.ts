import type { IWorkflowProcessor } from "./types";
import { PriceTriggerProcessor } from "./price.processor";
import { BreakoutRetestProcessor } from "./breakout-retest.processor";
import { ConditionalTriggerProcessor } from "./conditional.processor";
import { MarketSessionProcessor } from "./market-session.processor";
import { PortfolioPnlDrawdownProcessor } from "./portfolio-pnl-drawdown.processor";

export class TriggerProcessorFactory {
  private processors: Map<string, IWorkflowProcessor> = new Map();
  private allProcessors: IWorkflowProcessor[] = [];

  constructor() {
    this.register(new PriceTriggerProcessor());
    this.register(new BreakoutRetestProcessor());
    this.register(new ConditionalTriggerProcessor());
    this.register(new MarketSessionProcessor());
    this.register(new PortfolioPnlDrawdownProcessor());
  }

  private register(processor: IWorkflowProcessor): void {
    this.processors.set(processor.triggerType, processor);
    this.allProcessors.push(processor);
  }

  get(triggerType: string): IWorkflowProcessor | undefined {
    return this.processors.get(triggerType);
  }

  getAll(): IWorkflowProcessor[] {
    return this.allProcessors;
  }
}

export const triggerProcessorFactory = new TriggerProcessorFactory();
