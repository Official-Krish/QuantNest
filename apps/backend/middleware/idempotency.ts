import type { NextFunction, Request, Response } from "express";
import { redisGet, redisSet } from "@quantnest-trading/redis";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_HEADER = "Idempotency-Key";

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.method === "GET" || req.method === "HEAD") {
    next();
    return;
  }

  const key = req.headers[IDEMPOTENCY_HEADER.toLowerCase()] as
    | string
    | undefined;
  if (!key || typeof key !== "string" || key.length < 8) {
    next();
    return;
  }

  const redisKey = `idempotency:${key}`;
  const cached = await redisGet<string>(redisKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      res.status(parsed.status).json(parsed.body);
      return;
    } catch {
      // stale cache, continue
    }
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    const payload = JSON.stringify({ status: res.statusCode, body });
    void redisSet(redisKey, payload, IDEMPOTENCY_TTL_MS);
    return originalJson(body);
  };

  next();
}
