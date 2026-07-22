import { BaseWorkflowProcessor } from "./base.processor";
import { portfolioPnlDrawdownHandler } from "../handlers/triggers/portfolio-pnl-drawdown";

export class PortfolioPnlDrawdownProcessor extends BaseWorkflowProcessor {
  readonly triggerType = "portfolio-pnl-drawdown-trigger";
  protected readonly handler = portfolioPnlDrawdownHandler;
  protected readonly query = { triggerType: "portfolio-pnl-drawdown-trigger" };
}
