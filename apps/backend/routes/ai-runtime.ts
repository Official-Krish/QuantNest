import { Router } from "express";
import { z } from "zod";
import {
  AiRoleModel,
  AiExecutionLogModel,
  WorkflowModel,
} from "@quantnest-trading/db/client";
import { AIDecisionMetadataSchema } from "@quantnest-trading/types";
import { authMiddleware } from "../middleware";

const aiRuntimeRouter = Router();

const ExecuteBodySchema = z.object({
  workflowId: z.string().trim().min(1),
  nodeId: z.string().trim().min(1),
  metadata: AIDecisionMetadataSchema,
});

const ListLogsQuerySchema = z.object({
  workflowId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

const CreateRoleBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  prompt: z.string().trim().min(1, "Prompt is required"),
});

const UpdateRoleBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  prompt: z.string().trim().min(1).optional(),
});

aiRuntimeRouter.post("/execute", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      return;
    }

    const parsed = ExecuteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { workflowId } = parsed.data;

    const workflow = await WorkflowModel.findOne({
      _id: workflowId,
      userId,
    }).lean();
    if (!workflow) {
      res.status(404).json({
        success: false,
        code: "WORKFLOW_NOT_FOUND",
        message: "Workflow not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: "AI execution delegated to executor service." },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_RUNTIME_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to execute AI decision.",
    });
  }
});

aiRuntimeRouter.get("/execution-logs", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      return;
    }

    const parsed = ListLogsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { workflowId, limit, skip } = parsed.data;

    const filter: Record<string, unknown> = { userId };
    if (workflowId) filter.workflowId = workflowId;

    const [logs, total] = await Promise.all([
      AiExecutionLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AiExecutionLogModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { logs, total, limit, skip },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_RUNTIME_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch execution logs.",
    });
  }
});

aiRuntimeRouter.get("/roles", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      return;
    }

    const customRoles = await AiRoleModel.find({
      $or: [{ userId }, { userId: { $exists: false } }],
    })
      .sort({ isBuiltin: -1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { roles: customRoles },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_RUNTIME_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to fetch roles.",
    });
  }
});

aiRuntimeRouter.post("/roles", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      return;
    }

    const parsed = CreateRoleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { name, description, prompt } = parsed.data;

    const role = await AiRoleModel.create({
      userId,
      name,
      description: description ?? "",
      prompt,
      isBuiltin: false,
    });

    res.status(201).json({
      success: true,
      data: { role },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_RUNTIME_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to create role.",
    });
  }
});

aiRuntimeRouter.put("/roles/:roleId", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      return;
    }

    const parsed = UpdateRoleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const role = await AiRoleModel.findOne({ _id: req.params.roleId, userId });
    if (!role) {
      res
        .status(404)
        .json({
          success: false,
          code: "ROLE_NOT_FOUND",
          message: "Role not found.",
        });
      return;
    }

    if (role.isBuiltin) {
      res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Built-in roles cannot be modified.",
      });
      return;
    }

    const { name, description, prompt } = parsed.data;
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (prompt !== undefined) role.prompt = prompt;
    role.updatedAt = new Date();
    await role.save();

    res.status(200).json({ success: true, data: { role } });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_RUNTIME_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to update role.",
    });
  }
});

aiRuntimeRouter.delete("/roles/:roleId", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      return;
    }

    const role = await AiRoleModel.findOne({ _id: req.params.roleId, userId });
    if (!role) {
      res
        .status(404)
        .json({
          success: false,
          code: "ROLE_NOT_FOUND",
          message: "Role not found.",
        });
      return;
    }

    if (role.isBuiltin) {
      res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Built-in roles cannot be deleted.",
      });
      return;
    }

    await AiRoleModel.deleteOne({ _id: req.params.roleId });

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "AI_RUNTIME_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to delete role.",
    });
  }
});

export default aiRuntimeRouter;
