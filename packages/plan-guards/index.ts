import { AiStrategySessionModel, UserModel, WorkflowModel } from "@quantnest-trading/db/client";
import type { AiModelDescriptor, AiModelRequestOptions } from "@quantnest-trading/types/ai";

export type SubscriptionPlan = "free" | "pro" | "team";

export interface PlanLimits {
	maxWorkflows: number;
	maxAiChats: number;
	maxAiIterationsPerChat: number;
	aiRequestsPerMinute: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
	free: {
		maxWorkflows: 3,
		maxAiChats: 3,
		maxAiIterationsPerChat: 5,
		aiRequestsPerMinute: 20,
	},
	pro: {
		maxWorkflows: 25,
		maxAiChats: 40,
		maxAiIterationsPerChat: 30,
		aiRequestsPerMinute: 100,
	},
	team: {
		maxWorkflows: 100,
		maxAiChats: 200,
		maxAiIterationsPerChat: 100,
		aiRequestsPerMinute: 300,
	},
};

export const FREE_TIER_MODEL_ID = "gemini-2.5-flash";

function normalizePlan(value?: string): SubscriptionPlan {
	const plan = String(value || "").trim().toLowerCase();
	if (plan === "pro" || plan === "team") {
		return plan;
	}

	return "free";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequestedModel(payload: unknown): AiModelRequestOptions {
	if (!isRecord(payload) || !isRecord(payload.model)) {
		return {};
	}

	const model = payload.model;
	return {
		provider: typeof model.provider === "string" ? model.provider : undefined,
		model: typeof model.model === "string" ? model.model : undefined,
	};
}

function toPlainObject(payload: unknown): Record<string, unknown> {
	return isRecord(payload) ? payload : {};
}

export class PlanLimitError extends Error {
	readonly code: string;
	readonly statusCode: number;
	readonly details?: Record<string, unknown>;

	constructor(
		code: string,
		message: string,
		statusCode = 429,
		details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "PlanLimitError";
		this.code = code;
		this.statusCode = statusCode;
		this.details = details;
	}
}

export function isPlanLimitError(error: unknown): error is PlanLimitError {
	return error instanceof PlanLimitError;
}

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
	const user = await UserModel.findById(userId).select({ subscriptionPlan: 1 }).lean();
	return normalizePlan((user as any)?.subscriptionPlan);
}

export async function getUserPlanWithLimits(userId: string): Promise<{
	plan: SubscriptionPlan;
	limits: PlanLimits;
}> {
	const plan = await getUserPlan(userId);
	return {
		plan,
		limits: PLAN_LIMITS[plan],
	};
}

export function annotateModelsForPlan(
	models: AiModelDescriptor[],
	plan: SubscriptionPlan,
): AiModelDescriptor[] {
	return models.map((model) => {
		if (plan !== "free") {
			return {
				...model,
				locked: false,
				lockReason: undefined,
			};
		}

		const allowed = model.id === FREE_TIER_MODEL_ID;
		return {
			...model,
			recommended: allowed,
			locked: !allowed,
			lockReason: allowed ? undefined : "Free tier supports only Gemini 2.5 Flash.",
		};
	});
}

export async function enforcePlanModelAccess(userId: string, payload: unknown) {
	const plan = await getUserPlan(userId);
	if (plan !== "free") {
		return payload;
	}

	const requested = getRequestedModel(payload);
	const requestedProvider = String(requested.provider || "").trim().toLowerCase();
	const requestedModel = String(requested.model || "").trim();

	if (requestedModel && requestedModel !== FREE_TIER_MODEL_ID) {
		throw new PlanLimitError(
			"AI_MODEL_TIER_LOCKED",
			"Free tier supports only Gemini 2.5 Flash.",
			403,
		);
	}

	if (requestedProvider && requestedProvider !== "gemini") {
		throw new PlanLimitError(
			"AI_MODEL_TIER_LOCKED",
			"Free tier supports only Gemini 2.5 Flash.",
			403,
		);
	}

	return {
		...toPlainObject(payload),
		model: {
			provider: "gemini",
			model: FREE_TIER_MODEL_ID,
		},
	};
}

export async function getUserUsageSnapshot(userId: string) {
	const [{ plan, limits }, workflowCount, aiChatCount] = await Promise.all([
		getUserPlanWithLimits(userId),
		WorkflowModel.countDocuments({ userId }),
		AiStrategySessionModel.countDocuments({ userId }),
	]);

	return {
		plan,
		limits,
		usage: {
			workflows: workflowCount,
			aiChats: aiChatCount,
		},
	};
}

export async function assertWorkflowCreationAllowed(userId: string): Promise<void> {
	const [{ plan, limits }, workflowCount] = await Promise.all([
		getUserPlanWithLimits(userId),
		WorkflowModel.countDocuments({ userId }),
	]);

	if (workflowCount >= limits.maxWorkflows) {
		throw new PlanLimitError(
			"WORKFLOW_LIMIT_REACHED",
			`You have reached the ${plan} plan limit of ${limits.maxWorkflows} workflows. Upgrade your plan or delete an existing workflow to continue.`,
			403,
			{
				plan,
				limit: limits.maxWorkflows,
				used: workflowCount,
			},
		);
	}
}

export async function assertAiChatCreationAllowed(userId: string): Promise<void> {
	const [{ plan, limits }, chatCount] = await Promise.all([
		getUserPlanWithLimits(userId),
		AiStrategySessionModel.countDocuments({ userId }),
	]);

	if (chatCount >= limits.maxAiChats) {
		throw new PlanLimitError(
			"AI_CHAT_LIMIT_REACHED",
			`You have reached the ${plan} plan limit of ${limits.maxAiChats} AI chats. Delete one existing chat to start a new one.`,
			403,
			{
				plan,
				limit: limits.maxAiChats,
				used: chatCount,
			},
		);
	}
}

export async function assertAiIterationsAllowed(
	userId: string,
	usedIterations: number,
): Promise<void> {
	const { plan, limits } = await getUserPlanWithLimits(userId);

	if (usedIterations >= limits.maxAiIterationsPerChat) {
		throw new PlanLimitError(
			"AI_ITERATION_LIMIT_REACHED",
			`This chat has reached the ${plan} plan limit of ${limits.maxAiIterationsPerChat} iterations. Start a new chat to continue.`,
			403,
			{
				plan,
				limit: limits.maxAiIterationsPerChat,
				used: usedIterations,
			},
		);
	}
}

type RateWindow = {
	count: number;
	resetAtMs: number;
};

const aiRateWindowByUser = new Map<string, RateWindow>();

export async function enforceAiRateLimit(userId: string): Promise<{
	plan: SubscriptionPlan;
	limit: number;
	remaining: number;
	resetAt: string;
}> {
	const { plan, limits } = await getUserPlanWithLimits(userId);
	const limit = limits.aiRequestsPerMinute;

	const now = Date.now();
	const windowStart = Math.floor(now / 60_000) * 60_000;
	const resetAtMs = windowStart + 60_000;
	const current = aiRateWindowByUser.get(userId);

	if (!current || now >= current.resetAtMs) {
		aiRateWindowByUser.set(userId, { count: 1, resetAtMs });
		return {
			plan,
			limit,
			remaining: Math.max(limit - 1, 0),
			resetAt: new Date(resetAtMs).toISOString(),
		};
	}

	if (current.count >= limit) {
		throw new PlanLimitError(
			"AI_RATE_LIMIT_REACHED",
			`Rate limit exceeded for ${plan} plan (${limit} AI requests/min). Please wait and retry.`,
			429,
			{
				plan,
				limit,
				resetAt: new Date(current.resetAtMs).toISOString(),
			},
		);
	}

	current.count += 1;
	aiRateWindowByUser.set(userId, current);

	return {
		plan,
		limit,
		remaining: Math.max(limit - current.count, 0),
		resetAt: new Date(current.resetAtMs).toISOString(),
	};
}