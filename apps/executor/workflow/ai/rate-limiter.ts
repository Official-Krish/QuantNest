interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface UserBudget {
  monthlyUsage: number;
  monthStart: number;
}

const buckets = new Map<string, TokenBucket>();
const budgets = new Map<string, UserBudget>();

const DEFAULT_TOKENS_PER_SECOND = 4;
const DEFAULT_BURST_SIZE = 20;
const MONTHLY_MS = 30 * 24 * 60 * 60 * 1000;

function getBucketKey(userId: string, workflowId?: string): string {
  return workflowId ? `${userId}:${workflowId}` : userId;
}

export function checkRateLimit(
  userId: string,
  workflowId?: string,
  tokensPerSecond: number = DEFAULT_TOKENS_PER_SECOND,
  burstSize: number = DEFAULT_BURST_SIZE,
): { allowed: boolean; retryAfterMs: number } {
  const key = getBucketKey(userId, workflowId);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: burstSize, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    burstSize,
    bucket.tokens + elapsed * tokensPerSecond,
  );
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  const retryAfterMs =
    Math.ceil(((1 - bucket.tokens) / tokensPerSecond) * 1000) + 100;
  return { allowed: false, retryAfterMs };
}

export function getMonthlyUsage(userId: string): number {
  const budget = budgets.get(userId);
  if (!budget) return 0;

  if (Date.now() - budget.monthStart > MONTHLY_MS) {
    budgets.delete(userId);
    return 0;
  }

  return budget.monthlyUsage;
}

export function trackAICost(
  userId: string,
  cost: number,
  monthlyBudget: number,
): { withinBudget: boolean; monthlyUsage: number } {
  const now = Date.now();
  let budget = budgets.get(userId);

  if (!budget || now - budget.monthStart > MONTHLY_MS) {
    budget = { monthlyUsage: 0, monthStart: now };
    budgets.set(userId, budget);
  }

  budget.monthlyUsage += cost;
  return {
    withinBudget: budget.monthlyUsage <= monthlyBudget,
    monthlyUsage: budget.monthlyUsage,
  };
}

export function estimateCost(model: string, tokens: number): number {
  const rates: Record<string, number> = {
    "gemini-2.5-flash": 0.15,
    "gemini-2.5-pro": 1.25,
    "gemini-2.0-flash": 0.1,
    "gemini-1.5-pro": 1.0,
    "gemini-1.5-flash": 0.08,
  };

  const ratePer1K = rates[model] ?? 0.15;
  return (tokens / 1000) * ratePer1K;
}
