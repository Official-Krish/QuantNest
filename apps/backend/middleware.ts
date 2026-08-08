import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./utils/security";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        email: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const jwtSecret = getJwtSecret();
    const cookieToken =
      req.cookies?.[process.env.AUTH_COOKIE_NAME || "quantnest_auth"];
    const headerToken = req.headers["authorization"]?.split(" ")[1];
    const token = cookieToken || headerToken;
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    const payload = decoded as any;
    if (payload.type && payload.type !== "access") {
      res.status(403).json({ message: "Invalid token type" });
      return;
    }

    const userId = payload.userId;
    if (!userId) {
      res.status(403).json({ message: "Invalid token payload" });
      return;
    }
    req.userId = userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Session expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("Auth error:", error);
      res.status(403).json({
        message: "Invalid token",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
      return;
    }
    res.status(500).json({
      message: "Error processing authentication",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
    return;
  }
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
      "AI_SERVICE_JWT_SECRET must be configured and must not use the default placeholder value.",
    );
  }
  return secret;
}

export function internalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const secret = getAiServiceJwtSecret();
    const headerToken = req.headers["authorization"]?.split(" ")[1];
    if (!headerToken) {
      res.status(401).json({ error: "No internal token provided" });
      return;
    }

    const decoded = jwt.verify(headerToken, secret, {
      algorithms: ["HS256"],
    });

    const payload = decoded as any;
    if (payload.scope !== "executor-service") {
      res.status(403).json({ error: "Invalid token scope" });
      return;
    }

    if (payload.userId) {
      req.userId = payload.userId;
    }
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: "Invalid internal token" });
      return;
    }
    res.status(500).json({ error: "Internal auth error" });
  }
}
