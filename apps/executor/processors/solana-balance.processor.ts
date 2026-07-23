import { BaseWorkflowProcessor } from "./base.processor";
import { solanaBalanceHandler } from "../handlers/triggers/solana-balance";
import type { IWorkflowHandler } from "./types";

export class SolanaBalanceProcessor extends BaseWorkflowProcessor {
  readonly triggerType = "solana-balance";
  protected readonly handler: IWorkflowHandler = solanaBalanceHandler;
  protected readonly query = { triggerType: "solana-balance" };
}
