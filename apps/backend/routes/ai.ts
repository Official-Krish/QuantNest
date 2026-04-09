import axios from "axios";
import { Router } from "express";
import { AiStrategyDraftVersionModel, AiStrategySessionModel } from "@quantnest-trading/db/client";
import { aiStrategyDraftSessionSchema, type AiModelDescriptor } from "@quantnest-trading/types/ai";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware";
import { getUserAiDraft, listUserAiDraftSummaries } from "../services/aiDrafts";
import { sanitizeSharedPayload } from "../services/shareSanitizer";
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

function generateUniqueShareCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function ensureDraftShareCode(userId: string, draftId: string) {
  const draft = await AiStrategySessionModel.findOne({ _id: draftId, userId });
  if (!draft) {
    return null;
  }

  if ((draft as any).shareCode) {
    return String((draft as any).shareCode);
  }

  let nextCode = generateUniqueShareCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await AiStrategySessionModel.findOne({ shareCode: nextCode }).select({ _id: 1 }).lean();
    if (!existing) {
      (draft as any).shareCode = nextCode;
      await draft.save();
      return nextCode;
    }
    nextCode = generateUniqueShareCode();
  }

  throw new Error("Failed to generate a unique share code.");
}

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
      const nextModels = annotateModelsForPlan(result.data.models as AiModelDescriptor[], plan);

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
      message: error instanceof Error ? error.message : "Failed to load AI models.",
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
      message: error instanceof Error ? error.message : "Failed to generate AI strategy plan.",
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

    const drafts = await listUserAiDraftSummaries(userId);

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

    const draftResult = await getUserAiDraft(userId, String(req.params.draftId));
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
      message: error instanceof Error ? error.message : "Failed to load AI draft.",
    });
  }
});

aiRouter.post("/strategy/drafts/:draftId/edit", authMiddleware, async (req, res) => {
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

    const draftResult = await getUserAiDraft(userId, String(req.params.draftId));
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

    const result = await proxyAiBuilder(`/api/v1/strategy/drafts/${req.params.draftId}/edit`, {
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
    const versionId = typeof req.query.versionId === "string" ? req.query.versionId.trim() : "";
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

aiRouter.post("/strategy/drafts/:draftId/share", authMiddleware, async (req, res) => {
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

    const shareCode = await ensureDraftShareCode(userId, String(req.params.draftId));
    if (!shareCode) {
      res.status(404).json({
        success: false,
        code: "DRAFT_NOT_FOUND",
        message: "AI draft session was not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        shareCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to generate share code.",
    });
  }
});

aiRouter.get("/strategy/drafts/share/:shareCode", async (req, res) => {
  try {
    const shareCode = String(req.params.shareCode || "").trim().toUpperCase();
    if (!shareCode) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Share code is required.",
      });
      return;
    }

    const doc = await AiStrategySessionModel.findOne({ shareCode }).lean();
    if (!doc) {
      res.status(404).json({
        success: false,
        code: "DRAFT_NOT_FOUND",
        message: "AI draft session was not found.",
      });
      return;
    }

    const parsed = aiStrategyDraftSessionSchema.safeParse((doc as any).sessionData);
    if (!parsed.success) {
      res.status(500).json({
        success: false,
        code: "INVALID_DRAFT_DATA",
        message: "Stored draft session data is invalid.",
      });
      return;
    }

    const draft = parsed.data;
    const preview = {
      title: draft.title,
      status: draft.status,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      versions: draft.workflowVersions.length,
      lastMessage:
        [...draft.messages].reverse().find((message) => message.role === "user")?.content || "",
    };

    res.status(200).json({
      success: true,
      data: { preview },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_PROXY_ERROR",
      message: error instanceof Error ? error.message : "Failed to load shared AI draft.",
    });
  }
});

aiRouter.post("/strategy/drafts/import", authMiddleware, async (req, res) => {
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

    await assertAiChatCreationAllowed(userId);

    const shareCode = String(req.body?.shareCode || "").trim().toUpperCase();
    if (!shareCode) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Share code is required.",
      });
      return;
    }

    const source = await AiStrategySessionModel.findOne({ shareCode }).lean();
    if (!source) {
      res.status(404).json({
        success: false,
        code: "DRAFT_NOT_FOUND",
        message: "AI draft session was not found.",
      });
      return;
    }

    const parsed = aiStrategyDraftSessionSchema.safeParse((source as any).sessionData);
    if (!parsed.success) {
      res.status(500).json({
        success: false,
        code: "INVALID_DRAFT_DATA",
        message: "Stored draft session data is invalid.",
      });
      return;
    }

    const sourceDraft = sanitizeSharedPayload(parsed.data);
    const nowIso = new Date().toISOString();
    const importedTitleBase = String(sourceDraft.title || "Imported AI chat").trim();
    const importedTitle = importedTitleBase.toLowerCase().includes("imported")
      ? importedTitleBase
      : `${importedTitleBase} (Imported)`;

    const importedDoc = await AiStrategySessionModel.create({
      userId,
      title: importedTitle,
      status: sourceDraft.status,
      workflowId: undefined,
      sessionData: {
        ...sourceDraft,
        title: importedTitle,
        workflowId: undefined,
        draftId: new mongoose.Types.ObjectId().toString(),
        updatedAt: nowIso,
      },
    });

    const importedDraftId = String(importedDoc._id);
    const sourceDraftId = String((source as any)._id);

    const sessionDataWithNewId = {
      ...(importedDoc as any).sessionData,
      draftId: importedDraftId,
    };

    await AiStrategySessionModel.updateOne(
      { _id: importedDraftId, userId },
      {
        $set: {
          sessionData: sessionDataWithNewId,
        },
      },
    );

    const sourceVersions = await AiStrategyDraftVersionModel.find({ draftId: sourceDraftId }).lean();
    if (sourceVersions.length > 0) {
      await AiStrategyDraftVersionModel.insertMany(
        sourceVersions.map((entry) => ({
          userId,
          draftId: importedDraftId,
          versionId: entry.versionId,
          version: entry.version,
          setupState: entry.setupState,
        })),
        { ordered: false },
      );
    }

    res.status(201).json({
      success: true,
      data: {
        draft: sessionDataWithNewId,
      },
    });
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
      message: error instanceof Error ? error.message : "Failed to import AI draft.",
    });
  }
});

export default aiRouter;
