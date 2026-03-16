import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./utils/security";

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
    const cookieToken = req.cookies?.[process.env.AUTH_COOKIE_NAME || "quantnest_auth"];
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    const userId = (decoded as { userId?: string }).userId;
    if (!userId) {
      res.status(403).json({ message: "Invalid token payload" });
      return;
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error("AI builder auth error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        message: "Invalid token",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
      return;
    }

    res.status(500).json({
      message: "Error processing authentication",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    });
  }
}
