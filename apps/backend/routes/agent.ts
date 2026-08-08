import { Router } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware, internalAuthMiddleware } from "../middleware";
import { getJwtSecret } from "../utils/security";
import { agentRegistry } from "../ws/agentRegistry";
import { pendingRequests } from "../ws/pendingRequests";
import { sendToAgent } from "../ws/server";
import crypto from "crypto";

const agentRouter = Router();

agentRouter.post("/verify-agent", authMiddleware, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const agents = agentRegistry.getByUser(userId);
  if (agents.length === 0) {
    res.status(200).json({ connected: false, agents: [] });
    return;
  }
  res.status(200).json({
    connected: true,
    agents: agents.map((a) => ({
      id: a.id,
      version: a.version,
      os: a.os,
      hostname: a.hostname,
      capabilities: a.capabilities,
      availableModels: a.availableModels ?? [],
      selectedModel: a.selectedModel ?? null,
      modelReady: a.modelReady ?? false,
      modelError: a.modelError ?? null,
      connectedAt: a.connectedAt,
    })),
  });
});

agentRouter.post("/user/agent-token", authMiddleware, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const jwtSecret = getJwtSecret();
    const token = jwt.sign({ userId, type: "agent" }, jwtSecret, {
      algorithm: "HS256",
      expiresIn: "15m",
    });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate token" });
  }
});

agentRouter.post(
  "/internal/agent-execute",
  internalAuthMiddleware,
  async (req, res) => {
    const { userId, prompt, messages, tools, context, timeout, model } =
      req.body as {
        userId?: string;
        prompt?: string;
        messages?: Array<{ role: string; content: string }>;
        tools?: string[];
        context?: Record<string, unknown>;
        timeout?: number;
        model?: string;
      };

    if (!userId || (!prompt && !messages)) {
      res
        .status(400)
        .json({ error: "userId and prompt or messages are required" });
      return;
    }

    const agent = agentRegistry.pickForUser(userId);
    if (!agent) {
      res.status(400).json({ error: "No agent online for this user" });
      return;
    }

    const jobId = crypto.randomUUID();
    const resultPromise = pendingRequests.create(
      jobId,
      timeout ?? 30_000,
      agent.id,
    );

    const sent = sendToAgent(agent.id, {
      id: crypto.randomUUID(),
      type: "EXECUTE_AI",
      payload: {
        jobId,
        prompt,
        messages,
        tools,
        context,
        timeout: timeout ?? 30_000,
        model: model || agent.selectedModel || "openclaw/default",
      },
    });

    if (!sent) {
      pendingRequests.reject(jobId, new Error("Failed to send to agent"));
      res.status(500).json({ error: "Failed to send to agent" });
      return;
    }

    try {
      const result = await resultPromise;
      res.status(200).json(result);
    } catch (err: any) {
      res
        .status(408)
        .json({ error: err?.message ?? "Agent execution timed out" });
    }
  },
);

agentRouter.post("/internal/agent-model", authMiddleware, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const { model, action } = req.body as {
    model?: string;
    action?: "set" | "test";
  };

  const agent = agentRegistry.pickForUser(userId);
  if (!agent) {
    res.status(400).json({ error: "No agent online for this user" });
    return;
  }

  const jobId = crypto.randomUUID();
  const resultPromise = pendingRequests.create(jobId, 30_000, agent.id);

  const sent = sendToAgent(agent.id, {
    id: crypto.randomUUID(),
    type: action === "set" ? "SET_MODEL" : "TEST_MODEL",
    payload: {
      jobId,
      model: model || agent.selectedModel || "openclaw/default",
    },
  });

  if (!sent) {
    pendingRequests.reject(jobId, new Error("Failed to send to agent"));
    res.status(500).json({ error: "Failed to send to agent" });
    return;
  }

  try {
    const result = await resultPromise;
    res.status(200).json(result);
  } catch (err: any) {
    res
      .status(408)
      .json({ error: err?.message ?? "Agent model action timed out" });
  }
});

agentRouter.post("/verify-workflow-creds", authMiddleware, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { workflowId, brokers } = req.body as {
    workflowId?: string;
    brokers?: string[];
  };

  if (!workflowId || !brokers?.length) {
    res.status(400).json({ error: "workflowId and brokers are required" });
    return;
  }

  const agent = agentRegistry.pickForUser(userId);
  if (!agent) {
    res.status(400).json({ error: "No agent online for this user" });
    return;
  }

  const jobId = crypto.randomUUID();
  const resultPromise = pendingRequests.create(jobId, 120_000);

  const sent = sendToAgent(agent.id, {
    id: crypto.randomUUID(),
    type: "VERIFY_CREDENTIALS",
    payload: { jobId, workflowId, brokers },
  });

  if (!sent) {
    pendingRequests.reject(jobId, new Error("Failed to send to agent"));
    res.status(500).json({ error: "Failed to send to agent" });
    return;
  }

  try {
    const result = await resultPromise;
    res.status(200).json(result);
  } catch (err: any) {
    res
      .status(408)
      .json({ error: err?.message ?? "Credential verification timed out" });
  }
});

export default agentRouter;
