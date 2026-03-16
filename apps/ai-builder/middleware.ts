import type { NextFunction, Request, Response } from "express";

function getAiServiceToken(): string {
  const token = process.env.AI_SERVICE_TOKEN;
  if (!token || token === "AI_SERVICE_TOKEN") {
    throw new Error("AI_SERVICE_TOKEN must be configured and must not use the default placeholder value.");
  }
  return token;
}

export async function serviceAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const expectedToken = getAiServiceToken();
    const headerToken =
      req.headers["x-ai-service-token"] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    const providedToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;

    if (!providedToken) {
      res.status(401).json({
        success: false,
        code: "SERVICE_TOKEN_MISSING",
        message: "Missing AI service token.",
      });
      return;
    }

    if (providedToken !== expectedToken) {
      res.status(403).json({
        success: false,
        code: "SERVICE_TOKEN_INVALID",
        message: "Invalid AI service token.",
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "SERVICE_AUTH_ERROR",
      message: error instanceof Error ? error.message : "AI service authentication failed.",
    });
  }
}
