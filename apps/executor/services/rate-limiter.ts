import { Redis } from "ioredis";
import { env } from "../config/env";
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
  zerodha: env.RATE_LIMITS.ZERODHA,
  groww: env.RATE_LIMITS.GROWW,
  lighter: env.RATE_LIMITS.LIGHTER,
  gemini: env.RATE_LIMITS.GEMINI,
  discord: env.RATE_LIMITS.DISCORD,
  slack: env.RATE_LIMITS.SLACK,
  telegram: env.RATE_LIMITS.TELEGRAM,
  whatsapp: env.RATE_LIMITS.WHATSAPP,
  gmail: env.RATE_LIMITS.GMAIL,
  notion: env.RATE_LIMITS.NOTION,
  "google-drive": env.RATE_LIMITS.GOOGLE_DRIVE,
  "google-sheets": env.RATE_LIMITS.GOOGLE_SHEETS,
  postgres: env.RATE_LIMITS.POSTGRES,
  "market-data": env.RATE_LIMITS.MARKET_DATA,
};

export class RateLimiter {
  private readonly redis: Redis;

  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        host: env.REDIS.HOST,
        port: env.REDIS.PORT,
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
    } else {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        await this.redis.expire(key, WINDOW_SECONDS);
      }
    }

    if (count > limit) {
      throw new RateLimitedError(service, limit);
    }
  }

  private resolveLimit(service: string): number {
    return DEFAULT_LIMITS[service] ?? 0;
  }
}

export const rateLimiter = new RateLimiter();
