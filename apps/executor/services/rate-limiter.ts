import { Redis } from "ioredis";
import { AppError } from "./errors/base.error";
import { ErrorCode } from "./errors/codes";

export class RateLimitedError extends AppError {
  constructor(source: string, limit: number) {
    super(
      ErrorCode.RATE_LIMITED,
      `Rate limit exceeded for "${source}": ${limit} requests per minute`,
      true,
      source,
    );
    this.name = "RateLimitedError";
  }
}

const WINDOW_SECONDS = 60;

const DEFAULT_LIMITS: Record<string, number> = {
  zerodha: 50,
  groww: 60,
  lighter: 100,
  gemini: 60,
  discord: 30,
  slack: 30,
  telegram: 20,
  whatsapp: 20,
  gmail: 10,
  notion: 30,
  "google-drive": 30,
  "google-sheets": 30,
  postgres: 200,
  "market-data": 100,
};

export class RateLimiter {
  private readonly redis: Redis;

  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        host: process.env.REDIS_HOST ?? "redis",
        port: 6379,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      });
  }

  async acquire(service: string): Promise<void> {
    const limit = this.resolveLimit(service);
    if (limit <= 0) return;

    const key = `ratelimit:${service}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, WINDOW_SECONDS);
    }

    if (count > limit) {
      throw new RateLimitedError(service, limit);
    }
  }

  private resolveLimit(service: string): number {
    const envKey = `RATE_LIMIT_${service.toUpperCase().replace(/-/g, "_")}`;
    const envVal = process.env[envKey];
    if (envVal) {
      const parsed = parseInt(envVal, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_LIMITS[service] ?? 0;
  }
}

export const rateLimiter = new RateLimiter();
