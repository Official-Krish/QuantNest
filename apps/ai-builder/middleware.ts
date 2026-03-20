import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface AiServiceJwtPayload extends jwt.JwtPayload {
  scope?: string;
  userId?: string;
}

function getAiServiceJwtSecret(): string {
  const secret = process.env.AI_SERVICE_JWT_SECRET || process.env.AI_SERVICE_TOKEN;
  if (!secret || secret === "AI_SERVICE_TOKEN" || secret === "AI_SERVICE_JWT_SECRET") {
    throw new Error("AI service JWT secret must be configured and must not use the default placeholder value.");
  }
  return secret;
}

export async function serviceAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const jwtSecret = getAiServiceJwtSecret();
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

    const decoded = jwt.verify(providedToken, jwtSecret, {
      algorithms: ["HS256"],
      audience: "ai-builder",
      issuer: "quantnest-backend",
    }) as AiServiceJwtPayload;

    if (decoded.scope !== "ai-builder-service") {
      res.status(403).json({
        success: false,
        code: "SERVICE_TOKEN_INVALID",
        message: "Invalid AI service token.",
      });
      return;
    }

    if (decoded.userId) {
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(403).json({
        success: false,
        code: "SERVICE_TOKEN_INVALID",
        message: error instanceof jwt.TokenExpiredError
          ? "AI service token expired."
          : "Invalid AI service token.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      code: "SERVICE_AUTH_ERROR",
      message: error instanceof Error ? error.message : "AI service authentication failed.",
    });
  }
}
