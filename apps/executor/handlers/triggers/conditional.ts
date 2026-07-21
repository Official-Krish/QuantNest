import type {
  ConditionalTriggerMetadata,
  IndicatorConditionGroup,
  IndicatorSnapshotEntry,
  TriggerEvaluationSnapshot,
} from "@quantnest-trading/types";
import { getCurrentPrice } from "@quantnest-trading/market";
import { indicatorEngine } from "../../services/indicator.engine";
import type { IWorkflowHandler } from "../../processors/types";
import type { NodeType, WorkflowType } from "../../types";

export async function handleConditionalTrigger(
  timeWindowMinutes?: number,
  startTime?: Date,
): Promise<{
  shouldEvaluate: boolean;
  snapshot: Partial<TriggerEvaluationSnapshot>;
}> {
  const snapshot: Partial<TriggerEvaluationSnapshot> = {
    triggerType: "conditional-trigger",
  };

  if (!timeWindowMinutes || !startTime) {
    return { shouldEvaluate: true, snapshot };
  }

  const now = Date.now();
  const start = startTime.getTime();
  const isWithinWindow =
    now >= start && now <= start + timeWindowMinutes * 60 * 1000;
  return { shouldEvaluate: isWithinWindow, snapshot };
}

export async function checkCondition(
  targetPrice: number,
  marketType: "Indian" | "Crypto",
  asset: string,
  condition: "above" | "below",
): Promise<{
  evaluatedCondition: boolean;
  snapshot: Partial<TriggerEvaluationSnapshot>;
}> {
  const currentPrice = await getCurrentPrice(asset, marketType);
  const evaluatedCondition =
    condition === "above"
      ? currentPrice > targetPrice
      : currentPrice < targetPrice;

  return {
    evaluatedCondition,
    snapshot: {
      triggerType: "conditional-trigger",
      symbol: asset,
      marketType,
      targetPrice,
      condition,
      currentPrice,
      evaluatedCondition,
    },
  };
}

export async function evaluateConditionalMetadata(
  metadata?: ConditionalTriggerMetadata,
): Promise<{
  evaluatedCondition: boolean;
  snapshot: Partial<TriggerEvaluationSnapshot>;
}> {
  const snapshot: Partial<TriggerEvaluationSnapshot> = {
    triggerType: "conditional-trigger",
    symbol: metadata?.asset,
    marketType: metadata?.marketType,
    targetPrice: metadata?.targetPrice,
    condition: metadata?.condition,
  };

  if (!metadata) {
    return { evaluatedCondition: false, snapshot };
  }

  const expression = metadata.expression as IndicatorConditionGroup | undefined;
  if (expression) {
    indicatorEngine.registerExpression(expression);
    const [evaluatedCondition, indicatorSnapshot] = await Promise.all([
      indicatorEngine.evaluateExpression(expression),
      indicatorEngine.getExpressionSnapshot(expression),
    ]);
    snapshot.expression = expression;
    snapshot.indicatorSnapshot = indicatorSnapshot as IndicatorSnapshotEntry[];
    snapshot.evaluatedCondition = evaluatedCondition;
    return { evaluatedCondition, snapshot };
  }

  if (
    typeof metadata.targetPrice === "number" &&
    typeof metadata.asset === "string" &&
    (metadata.condition === "above" || metadata.condition === "below")
  ) {
    const result = await checkCondition(
      metadata.targetPrice,
      metadata.marketType === "Crypto" || metadata.marketType === "web3"
        ? "Crypto"
        : "Indian",
      metadata.asset,
      metadata.condition,
    );
    return result;
  }

  return { evaluatedCondition: false, snapshot };
}

export const conditionalHandler: IWorkflowHandler = {
  async evaluate(workflow: WorkflowType, trigger: NodeType) {
    const metadata = trigger.data?.metadata as
      | Record<string, unknown>
      | undefined;

    const timeWindow = metadata?.timeWindowMinutes as number | undefined;
    const startTime = metadata?.startTime
      ? new Date(metadata.startTime as string)
      : undefined;

    const { shouldEvaluate, snapshot: timeSnapshot } =
      await handleConditionalTrigger(timeWindow, startTime);

    if (!shouldEvaluate) {
      return { shouldExecute: false, snapshot: timeSnapshot };
    }

    const { evaluatedCondition, snapshot } = await evaluateConditionalMetadata(
      metadata as any,
    );

    return {
      shouldExecute: evaluatedCondition,
      snapshot: snapshot as any,
      condition: evaluatedCondition,
    };
  },
};
