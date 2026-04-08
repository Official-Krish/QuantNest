import {
  PLAN_LIMITS,
  PlanLimitError,
  annotateModelsForPlan,
  assertAiChatCreationAllowed,
  assertAiIterationsAllowed,
  assertWorkflowCreationAllowed,
  enforceAiRateLimit,
  enforcePlanModelAccess,
  getUserPlan,
  getUserPlanWithLimits,
  getUserUsageSnapshot as getSharedUserUsageSnapshot,
  isPlanLimitError,
  type PlanLimits,
  type SubscriptionPlan,
} from "../../../packages/plan-guards/index.ts";

export {
  PLAN_LIMITS,
  PlanLimitError,
  annotateModelsForPlan,
  assertAiChatCreationAllowed,
  assertAiIterationsAllowed,
  assertWorkflowCreationAllowed,
  enforceAiRateLimit,
  enforcePlanModelAccess,
  getUserPlan,
  getUserPlanWithLimits,
  isPlanLimitError,
};

export type { PlanLimits, SubscriptionPlan };

export async function getUserUsageSnapshot(userId: string) {
  return getSharedUserUsageSnapshot(userId);
}
