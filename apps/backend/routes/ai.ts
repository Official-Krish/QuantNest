import axios from "axios";
import { Router } from "express";
import {
  AiStrategyDraftVersionModel,
  AiStrategySessionModel,
  AiMemoryModel,
  MemoryDocumentModel,
  ApprovalRequestModel,
  ExecutionModel,
  ExecutionTraceModel,
  WorkflowModel,
} from "@quantnest-trading/db/client";
import {
  cosineSimilarity,
  embedText,
  embedTexts,
} from "@quantnest-trading/embeddings";
import {
  aiStrategyDraftSessionSchema,
  type AiDebugQueryRequest,
  type AiModelDescriptor,
} from "@quantnest-trading/types/ai";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware";
import { getUserAiDraft, listUserAiDraftSummaries } from "../services/aiDrafts";
import {
  assertAiChatCreationAllowed,
  assertAiIterationsAllowed,
  enforceAiRateLimit,
  enforcePlanModelAccess,
  getUserPlan,
  annotateModelsForPlan,
  isPlanLimitError,
} from "../services/subscription";

const aiRouter = Router();

function getAiBuilderBaseUrl(): string {
  return process.env.AI_BUILDER_URL || "http://localhost:3001";
}

function getAiServiceJwtSecret(): string {
  const secret =
    process.env.AI_SERVICE_JWT_SECRET || process.env.AI_SERVICE_TOKEN;
  if (
    !secret ||
    secret === "AI_SERVICE_TOKEN" ||
    secret === "AI_SERVICE_JWT_SECRET"
  ) {
    throw new Error(
      "AI service JWT secret must be configured and must not use the default placeholder value.",
    );
  }
  return secret;
}

function getAiServiceToken(userId?: string): string {
  return jwt.sign(
    {
      scope: "ai-builder-service",
      userId: userId || undefined,
    },
    getAiServiceJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: "60s",
      audience: "ai-builder",
      issuer: "quantnest-backend",
    },
  );
}

async function proxyAiBuilder(
  path: string,
  options: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    userId?: string;
    headers?: Record<string, string>;
    data?: unknown;
  },
) {
  const response = await axios.request({
    url: `${getAiBuilderBaseUrl()}${path}`,
    method: options.method,
    headers: {
      "x-ai-service-token": getAiServiceToken(options.userId),
      ...(options.headers || {}),
    },
    data: options.data,
    validateStatus: () => true,
  });

  return { status: response.status, data: response.data };
}

aiRouter.get("/models", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const result = await proxyAiBuilder("/api/v1/models", {
      method: "GET",
      userId,
    });

    if (result.status >= 200 && result.status < 300 && result.data?.models) {
      const plan = await getUserPlan(userId);
      const nextModels = annotateModelsForPlan(
        result.data.models as AiModelDescriptor[],
        plan,
      );

      res.status(result.status).json({
        ...result.data,
        models: nextModels,
      });
      return;
    }

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to load AI models.",
    });
  }
});

aiRouter.post("/strategy/plan", authMiddleware, async (req, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    await enforceAiRateLimit(req.userId);

    const payload = await enforcePlanModelAccess(req.userId, req.body);

    const result = await proxyAiBuilder("/api/v1/strategy/plan", {
      method: "POST",
      userId: req.userId || undefined,
      data: payload,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    if (isPlanLimitError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate AI strategy plan.",
    });
  }
});

aiRouter.post("/debug/explain", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const executionId = String(req.body?.executionId || "").trim();
    const question = String(req.body?.question || "").trim();
    if (!executionId || !question) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "executionId and question are required.",
      });
      return;
    }

    const execution = await ExecutionModel.findOne({
      _id: executionId,
      userId,
    }).lean();
    if (!execution) {
      res.status(404).json({
        success: false,
        code: "EXECUTION_NOT_FOUND",
        message: "Execution not found.",
      });
      return;
    }

    const trace = await ExecutionTraceModel.findOne({ executionId }).lean();
    if (!trace) {
      res.status(404).json({
        success: false,
        code: "TRACE_NOT_FOUND",
        message:
          "Execution trace not found. This execution ran before the trace feature was added.",
      });
      return;
    }

    const debugRequest: AiDebugQueryRequest = {
      question,
      workflowName: req.body?.workflowName || "Workflow",
      triggerType: (trace.trigger as any)?.triggerType || "unknown",
      triggerSnapshot: trace.trigger as Record<string, unknown>,
      branchDecisions: (trace.branchDecisions || []).map((bd: any) => ({
        nodeId: bd.nodeId,
        nodeType: bd.nodeType,
        evaluatedCondition: bd.evaluatedCondition,
        selectedBranch: bd.selectedBranch,
        availableBranches: bd.availableBranches || [],
      })),
      nodeSteps: (execution.steps || []).map((step: any) => ({
        nodeType: step.nodeType,
        status: step.status,
        message: step.message,
      })),
      indicatorSnapshot: ((trace.trigger as any)?.indicatorSnapshot || []).map(
        (is: any) => ({
          symbol: is.symbol,
          indicator: is.indicator,
          timeframe: is.timeframe,
          period: is.period,
          value: is.value,
        }),
      ),
      executionStatus: execution.status as
        | "Success"
        | "Failed"
        | "InProgress"
        | "PendingApproval",
      marketDataAtExecution: trace.marketDataSnapshot as
        | Record<string, unknown>
        | undefined,
    };

    const result = await proxyAiBuilder("/api/v1/debug/explain", {
      method: "POST",
      userId,
      data: debugRequest,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to explain execution.",
    });
  }
});

aiRouter.post("/strategy/drafts", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    await enforceAiRateLimit(userId);
    await assertAiChatCreationAllowed(userId);

    const payload = await enforcePlanModelAccess(userId, req.body);

    const result = await proxyAiBuilder("/api/v1/strategy/drafts", {
      method: "POST",
      userId,
      data: payload,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    if (isPlanLimitError(error)) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to create AI draft.",
    });
  }
});

aiRouter.get("/strategy/drafts", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const drafts = await listUserAiDraftSummaries(userId);

    res.status(200).json({
      success: true,
      data: { drafts },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to list AI drafts.",
    });
  }
});

aiRouter.get("/strategy/drafts/:draftId", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const draftResult = await getUserAiDraft(
      userId,
      String(req.params.draftId),
    );
    if (draftResult.status === "not_found") {
      res.status(404).json({
        success: false,
        code: "DRAFT_NOT_FOUND",
        message: "AI draft session was not found.",
      });
      return;
    }
    if (draftResult.status === "invalid") {
      res.status(500).json({
        success: false,
        code: "INVALID_DRAFT_DATA",
        message: "Stored draft session data is invalid.",
        details: draftResult.issues,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { draft: draftResult.draft },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to load AI draft.",
    });
  }
});

aiRouter.post(
  "/strategy/drafts/:draftId/edit",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
        return;
      }

      await enforceAiRateLimit(userId);

      const draftResult = await getUserAiDraft(
        userId,
        String(req.params.draftId),
      );
      if (draftResult.status === "not_found") {
        res.status(404).json({
          success: false,
          code: "DRAFT_NOT_FOUND",
          message: "AI draft session was not found.",
        });
        return;
      }
      if (draftResult.status === "invalid") {
        res.status(500).json({
          success: false,
          code: "INVALID_DRAFT_DATA",
          message: "Stored draft session data is invalid.",
          details: draftResult.issues,
        });
        return;
      }

      await assertAiIterationsAllowed(userId, draftResult.draft.edits.length);

      const payload = await enforcePlanModelAccess(userId, req.body);

      const result = await proxyAiBuilder(
        `/api/v1/strategy/drafts/${req.params.draftId}/edit`,
        {
          method: "POST",
          userId,
          data: payload,
        },
      );

      res.status(result.status).json(result.data);
    } catch (error) {
      if (isPlanLimitError(error)) {
        res.status(error.statusCode).json({
          success: false,
          code: error.code,
          message: error.message,
          details: error.details,
        });
        return;
      }

      res.status(500).json({
        success: false,
        code: "AI_PROXY_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to edit AI draft.",
      });
    }
  },
);

aiRouter.get(
  "/strategy/drafts/:draftId/versions/:versionId",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await proxyAiBuilder(
        `/api/v1/strategy/drafts/${req.params.draftId}/versions/${req.params.versionId}`,
        {
          method: "GET",
          userId: req.userId || undefined,
        },
      );

      res.status(result.status).json(result.data);
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "AI_PROXY_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load AI draft version.",
      });
    }
  },
);

aiRouter.put(
  "/strategy/drafts/:draftId/setup",
  authMiddleware,
  async (req, res) => {
    try {
      const versionId =
        typeof req.query.versionId === "string"
          ? req.query.versionId.trim()
          : "";
      const setupPath = versionId
        ? `/api/v1/strategy/drafts/${req.params.draftId}/setup?versionId=${encodeURIComponent(versionId)}`
        : `/api/v1/strategy/drafts/${req.params.draftId}/setup`;
      const result = await proxyAiBuilder(setupPath, {
        method: "PUT",
        userId: req.userId || undefined,
        data: req.body,
      });

      res.status(result.status).json(result.data);
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "AI_PROXY_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save AI draft setup.",
      });
    }
  },
);

aiRouter.delete(
  "/strategy/drafts/:draftId",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
        return;
      }

      const draftId = String(req.params.draftId);
      const deletedSession = await AiStrategySessionModel.findOneAndDelete({
        _id: draftId,
        userId,
      });

      if (!deletedSession) {
        res.status(404).json({
          success: false,
          code: "DRAFT_NOT_FOUND",
          message: "AI draft session was not found.",
        });
        return;
      }

      await AiStrategyDraftVersionModel.deleteMany({ userId, draftId });

      res.status(200).json({
        success: true,
        data: { draftId },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "AI_PROXY_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to delete AI draft.",
      });
    }
  },
);

aiRouter.patch(
  "/strategy/drafts/:draftId/title",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
        return;
      }

      const draftId = String(req.params.draftId);
      const title = String(req.body?.title || "").trim();
      if (title.length < 3 || title.length > 120) {
        res.status(400).json({
          success: false,
          code: "INVALID_REQUEST",
          message: "Draft title must be between 3 and 120 characters.",
        });
        return;
      }

      const doc = await AiStrategySessionModel.findOne({
        _id: draftId,
        userId,
      }).lean();
      if (!doc) {
        res.status(404).json({
          success: false,
          code: "DRAFT_NOT_FOUND",
          message: "AI draft session was not found.",
        });
        return;
      }

      const parsedDraft = aiStrategyDraftSessionSchema.safeParse(
        doc.sessionData,
      );
      if (!parsedDraft.success) {
        res.status(500).json({
          success: false,
          code: "INVALID_DRAFT_DATA",
          message: "Stored draft session data is invalid.",
        });
        return;
      }

      const draft = {
        ...parsedDraft.data,
        title,
        updatedAt: new Date().toISOString(),
      };

      await AiStrategySessionModel.updateOne(
        { _id: draftId, userId },
        {
          $set: {
            title,
            status: parsedDraft.data.status,
            sessionData: draft,
          },
        },
      );

      res.status(200).json({
        success: true,
        data: { draft },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "AI_PROXY_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to rename AI draft.",
      });
    }
  },
);

// ---- Approval Request endpoints ----

aiRouter.get("/approvals", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const status = String(req.query.status || "").trim();
    const filter: Record<string, unknown> = { userId };
    if (
      status &&
      ["pending", "approved", "rejected", "expired"].includes(status)
    ) {
      filter.status = status;
    }

    const approvals = await ApprovalRequestModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const workflowIds = [
      ...new Set(approvals.map((a) => String(a.workflowId))),
    ];
    const workflows = await WorkflowModel.find({ _id: { $in: workflowIds } })
      .select("workflowName")
      .lean();
    const workflowMap = Object.fromEntries(
      workflows.map((w) => [
        String(w._id),
        (w as any).workflowName || String(w._id),
      ]),
    );

    const mapped = approvals.map((a) => ({
      id: String(a._id),
      workflowId: String(a.workflowId),
      workflowName: workflowMap[String(a.workflowId)] || String(a.workflowId),
      nodeId: a.nodeId,
      executionId: a.executionId ? String(a.executionId) : undefined,
      status: a.status,
      prompt: a.prompt,
      proposedAction: a.proposedAction,
      metadata: a.metadata,
      createdAt: a.createdAt,
      approvedAt: a.approvedAt,
      rejectedAt: a.rejectedAt,
    }));

    res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "APPROVAL_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to list approval requests.",
    });
  }
});

aiRouter.patch(
  "/approvals/:approvalId/approve",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
        return;
      }

      const approvalId = String(req.params.approvalId);
      const approval = await ApprovalRequestModel.findOne({
        _id: approvalId,
        userId,
      });

      if (!approval) {
        res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          message: "Approval request not found.",
        });
        return;
      }

      if (approval.status !== "pending") {
        res.status(400).json({
          success: false,
          code: "ALREADY_PROCESSED",
          message: `Approval request is already ${approval.status}.`,
        });
        return;
      }

      approval.status = "approved";
      approval.approvedAt = new Date();
      await approval.save();

      const workflowId = String(approval.workflowId);
      await WorkflowModel.updateOne(
        { _id: workflowId },
        { $set: { status: "active" } },
      );

      res.status(200).json({
        success: true,
        data: { id: approvalId, status: "approved" },
        message: "Approval granted. Workflow has been resumed.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "APPROVAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to approve.",
      });
    }
  },
);

aiRouter.patch(
  "/approvals/:approvalId/reject",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
        return;
      }

      const approvalId = String(req.params.approvalId);
      const approval = await ApprovalRequestModel.findOne({
        _id: approvalId,
        userId,
      });

      if (!approval) {
        res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          message: "Approval request not found.",
        });
        return;
      }

      if (approval.status !== "pending") {
        res.status(400).json({
          success: false,
          code: "ALREADY_PROCESSED",
          message: `Approval request is already ${approval.status}.`,
        });
        return;
      }

      approval.status = "rejected";
      approval.rejectedAt = new Date();
      await approval.save();

      res.status(200).json({
        success: true,
        data: { id: approvalId, status: "rejected" },
        message: "Approval request was rejected.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        code: "APPROVAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to reject.",
      });
    }
  },
);

// ---- AI Memory endpoints ----

aiRouter.get("/memories", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const workflowId = String(req.query.workflowId || "").trim();
    const nodeId = String(req.query.nodeId || "").trim();
    const filter: Record<string, unknown> = { userId };
    if (workflowId) filter.workflowId = workflowId;
    if (nodeId) filter.nodeId = nodeId;

    const memories = await AiMemoryModel.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const docs = await MemoryDocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const mapped = memories.map((m) => ({
      id: m._id,
      workflowId: m.workflowId,
      nodeId: m.nodeId,
      key: m.key,
      value: m.value,
      ttl: m.ttl,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    const mappedDocs = docs.map((d) => ({
      id: d._id,
      workflowId: d.workflowId,
      nodeId: d.nodeId,
      key: "default",
      source: d.source,
      content: d.content,
      metadata: d.metadata,
      ttl: d.ttl,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    const merged = [...mapped, ...mappedDocs].sort((a, b) => {
      const at = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bt = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bt - at;
    });

    res.status(200).json({ success: true, data: merged });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "MEMORY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to list memories.",
    });
  }
});

aiRouter.get("/memories/search", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const query = String(req.query.q || "").trim();
    const workflowId = String(req.query.workflowId || "").trim();
    const source = String(req.query.source || "").trim();
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || "5"), 10) || 5, 1),
      20,
    );

    if (!query) {
      res.status(400).json({
        success: false,
        code: "INVALID_QUERY",
        message: "Query parameter 'q' is required.",
      });
      return;
    }

    const filter: Record<string, unknown> = { userId };
    if (workflowId) filter.workflowId = workflowId;
    if (source) filter.source = source;

    const docs = await MemoryDocumentModel.find(filter)
      .select({
        content: 1,
        source: 1,
        workflowId: 1,
        nodeId: 1,
        embedding: 1,
        metadata: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const queryEmbedding = await embedText(query);
    let results: Array<{
      id: unknown;
      content: string;
      source: string;
      workflowId?: unknown;
      nodeId?: string | null;
      score: number;
      metadata?: Record<string, unknown>;
      createdAt?: Date;
    }> = [];

    if (queryEmbedding) {
      for (const doc of docs) {
        if (!doc.embedding || doc.embedding.length === 0) continue;
        const score = cosineSimilarity(queryEmbedding, doc.embedding);
        if (score <= 0) continue;
        results.push({
          id: doc._id,
          content: doc.content,
          source: doc.source,
          workflowId: doc.workflowId,
          nodeId: doc.nodeId,
          score,
          metadata: doc.metadata as Record<string, unknown> | undefined,
          createdAt: doc.createdAt,
        });
      }
      results.sort((a, b) => b.score - a.score);
      results = results.slice(0, limit);
    }

    if (results.length === 0) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      results = docs
        .filter((doc) => regex.test(doc.content))
        .slice(0, limit)
        .map((doc) => ({
          id: doc._id,
          content: doc.content,
          source: doc.source,
          workflowId: doc.workflowId,
          nodeId: doc.nodeId,
          score: 0,
          metadata: doc.metadata as Record<string, unknown> | undefined,
          createdAt: doc.createdAt,
        }));
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "MEMORY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to search memories.",
    });
  }
});

aiRouter.post("/memories/notes", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const content = String(req.body?.content || "").trim();
    const workflowId = String(req.body?.workflowId || "").trim() || undefined;
    const ttlHours = Number(req.body?.ttlHours);

    if (!content) {
      res.status(400).json({
        success: false,
        code: "INVALID_CONTENT",
        message: "Note content is required.",
      });
      return;
    }

    const notes = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (notes.length === 0) {
      res.status(400).json({
        success: false,
        code: "INVALID_CONTENT",
        message: "Note content is required.",
      });
      return;
    }

    const embeddings = await embedTexts(notes);
    const ttl =
      ttlHours > 0 ? new Date(Date.now() + ttlHours * 3600 * 1000) : undefined;

    const docs = notes.map((note, index) => ({
      userId,
      workflowId,
      source: "note",
      content: note,
      embedding: embeddings[index] ?? undefined,
      metadata: { kind: "manual-note" },
      ttl,
    }));

    const inserted = await MemoryDocumentModel.insertMany(docs);

    res.status(201).json({
      success: true,
      data: inserted.map((doc) => ({ id: doc._id, content: doc.content })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "MEMORY_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create memory note.",
    });
  }
});

aiRouter.delete("/memories/:memoryId", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      return;
    }

    const result = await AiMemoryModel.deleteOne({
      _id: req.params.memoryId,
      userId,
    });
    const docResult = await MemoryDocumentModel.deleteOne({
      _id: req.params.memoryId,
      userId,
    });
    if (result.deletedCount === 0 && docResult.deletedCount === 0) {
      res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Memory not found.",
      });
      return;
    }

    res.status(200).json({ success: true, message: "Memory deleted." });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "MEMORY_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to delete memory.",
    });
  }
});

export default aiRouter;
