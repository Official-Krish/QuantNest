import type {
  AiModelDescriptor,
  AiStrategyBuilderRequest,
  AiStrategyBuilderResponse,
} from "@quantnest-trading/types/ai";

export interface StrategyPlannerProvider {
  readonly provider: string;
  readonly models: AiModelDescriptor[];
  generatePlan(
    input: AiStrategyBuilderRequest,
    prompt: string,
  ): Promise<AiStrategyBuilderResponse>;
}
