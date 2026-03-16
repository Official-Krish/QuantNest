import axios from "axios";
import { Router } from "express";
import { authMiddleware } from "../middleware";

const aiRouter = Router();

function getAiBuilderBaseUrl(): string {
  return process.env.AI_BUILDER_URL || "http://localhost:3001";
}

function getAiServiceToken(): string {
  const token = process.env.AI_SERVICE_TOKEN;
  if (!token || token === "AI_SERVICE_TOKEN") {
    throw new Error("AI_SERVICE_TOKEN must be configured and must not use the default placeholder value.");
  }
  return token;
}

async function proxyAiBuilder(
  path: string,
  options: {
    method: "GET" | "POST";
    headers?: Record<string, string>;
    data?: unknown;
  },
) {
  const response = await axios.request({
    url: `${getAiBuilderBaseUrl()}${path}`,
    method: options.method,
    headers: {
      "x-ai-service-token": getAiServiceToken(),
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
      headers: {
        "x-user-id": req.userId || "",
      },
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
      headers: {
        "x-user-id": req.userId || "",
      },
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

export default aiRouter;
