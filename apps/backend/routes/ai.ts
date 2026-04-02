import axios from "axios";
import { Router } from "express";
import { AiStrategyDraftVersionModel, AiStrategySessionModel } from "@quantnest-trading/db/client";
import {
  aiStrategyDraftSessionSchema,
  aiStrategyDraftSummarySchema,
} from "@quantnest-trading/types/ai";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware";

const aiRouter = Router();

function getAiBuilderBaseUrl(): string {
  return process.env.AI_BUILDER_URL || "http://localhost:3001";
}

function getAiServiceJwtSecret(): string {
  const secret = process.env.AI_SERVICE_JWT_SECRET || process.env.AI_SERVICE_TOKEN;
  if (!secret || secret === "AI_SERVICE_TOKEN" || secret === "AI_SERVICE_JWT_SECRET") {
    throw new Error("AI service JWT secret must be configured and must not use the default placeholder value.");
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
    const result = await proxyAiBuilder("/api/v1/models", {
      method: "GET",
      userId: req.userId || undefined,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to load AI models.",
    });
  }
});

aiRouter.post("/strategy/plan", authMiddleware, async (req, res) => {
  try {
    const result = await proxyAiBuilder("/api/v1/strategy/plan", {
      method: "POST",
      userId: req.userId || undefined,
      data: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to generate AI strategy plan.",
    });
  }
});

aiRouter.post("/strategy/drafts", authMiddleware, async (req, res) => {
  try {
    const result = await proxyAiBuilder("/api/v1/strategy/drafts", {
      method: "POST",
      userId: req.userId || undefined,
      data: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to create AI draft.",
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

    const docs = await AiStrategySessionModel.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    

    const drafts = docs.flatMap((doc) => {
      const parsedDraft = aiStrategyDraftSessionSchema.safeParse(doc.sessionData);
      if (!parsedDraft.success) {
        const issueDetails = parsedDraft.error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
          expected: "expected" in issue ? issue.expected : undefined,
          received: "received" in issue ? issue.received : undefined,
        }));

        console.error("Failed to parse draft session data for summary", {
          userId,
          draftId: doc._id,
          issues: issueDetails,
          issuesJson: JSON.stringify(issueDetails),
        });
        return [];
      }

      const draft = parsedDraft.data;
      const lastMessage = [...draft.messages].reverse().find((message) => message.role === "user")?.content;
      return [aiStrategyDraftSummarySchema.parse({
        draftId: draft.draftId,
        title: draft.title,
        status: draft.status,
        updatedAt: draft.updatedAt,
        createdAt: draft.createdAt,
        workflowId: draft.workflowId,
        lastMessage,
      })];
    });

    res.status(200).json({
      success: true,
      data: { drafts },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to list AI drafts.",
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

    const doc = await AiStrategySessionModel.findOne({
      _id: req.params.draftId,
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

    const parsedDraft = aiStrategyDraftSessionSchema.safeParse(doc.sessionData);
    if (!parsedDraft.success) {
      const issueDetails = parsedDraft.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
        expected: "expected" in issue ? issue.expected : undefined,
        received: "received" in issue ? issue.received : undefined,
      }));

      console.error("Failed to parse draft session data", {
        userId,
        draftId: req.params.draftId,
        issues: issueDetails,
        issuesJson: JSON.stringify(issueDetails),
      });

      res.status(500).json({
        success: false,
        code: "INVALID_DRAFT_DATA",
        message: "Stored draft session data is invalid.",
        details: issueDetails,
      });
      return;
    }

    const draft = parsedDraft.data;

    res.status(200).json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to load AI draft.",
    });
  }
});

aiRouter.post("/strategy/drafts/:draftId/edit", authMiddleware, async (req, res) => {
  try {
    const result = await proxyAiBuilder(`/api/v1/strategy/drafts/${req.params.draftId}/edit`, {
      method: "POST",
      userId: req.userId || undefined,
      data: req.body,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to edit AI draft.",
    });
  }
});

aiRouter.get("/strategy/drafts/:draftId/versions/:versionId", authMiddleware, async (req, res) => {
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
      message: error instanceof Error ? error.message : "Failed to load AI draft version.",
    });
  }
});

aiRouter.put("/strategy/drafts/:draftId/setup", authMiddleware, async (req, res) => {
  try {
    const setupPath = typeof req.query.versionId === "string" && req.query.versionId.trim()
      ? `/api/v1/strategy/drafts/${req.params.draftId}/setup?versionId=${encodeURIComponent(req.query.versionId.trim())}`
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
      message: error instanceof Error ? error.message : "Failed to save AI draft setup.",
    });
  }
});

aiRouter.delete("/strategy/drafts/:draftId", authMiddleware, async (req, res) => {
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
      message: error instanceof Error ? error.message : "Failed to delete AI draft.",
    });
  }
});

aiRouter.patch("/strategy/drafts/:draftId/title", authMiddleware, async (req, res) => {
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

    const doc = await AiStrategySessionModel.findOne({ _id: draftId, userId }).lean();
    if (!doc) {
      res.status(404).json({
        success: false,
        code: "DRAFT_NOT_FOUND",
        message: "AI draft session was not found.",
      });
      return;
    }

    const parsedDraft = aiStrategyDraftSessionSchema.safeParse(doc.sessionData);
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
      message: error instanceof Error ? error.message : "Failed to rename AI draft.",
    });
  }
});

export default aiRouter;
