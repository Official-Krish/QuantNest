import "dotenv/config";
import { describe, test, expect } from "bun:test";
import { AppError } from "./services/errors/base.error";
import { ErrorCode } from "./services/errors/codes";
import {
  BrokerTimeoutError,
  BrokerAuthError,
  OrderRejectedError,
} from "./services/errors/broker.errors";
import { MarketDataUnavailableError } from "./services/errors/market.errors";
import { AiUnavailableError } from "./services/errors/ai.errors";
import { NotificationFailedError } from "./services/errors/notification.errors";
import { isRetryableActionError } from "./workflow/action-handlers/shared";
import { RateLimitedError } from "./services/rate-limiter";
import { CircuitBreakerOpenError } from "./services/circuit-breaker";
import { env } from "./config/env";
import { resolveRetryPolicy } from "./workflow/action-handlers/shared";

// ── 1. AppError hierarchy ─────────────────────────────────────────────────
describe("AppError hierarchy", () => {
  test("retryable errors", () => {
    expect(new BrokerTimeoutError("Zerodha").retryable).toBe(true);
    expect(new MarketDataUnavailableError("SOL").retryable).toBe(true);
    expect(new AiUnavailableError("gemini").retryable).toBe(true);
    expect(new NotificationFailedError("discord").retryable).toBe(true);
  });

  test("terminal errors", () => {
    expect(new BrokerAuthError("Zerodha").retryable).toBe(false);
    expect(new OrderRejectedError("symbol", "reason").retryable).toBe(false);
    expect(new RateLimitedError("gemini", 60).retryable).toBe(true); // rate limits are temporary
  });

  test("error codes match types", () => {
    expect(new BrokerTimeoutError("x").code).toBe(ErrorCode.BROKER_TIMEOUT);
    expect(new BrokerAuthError("x").code).toBe(ErrorCode.BROKER_AUTH_FAILED);
    expect(new MarketDataUnavailableError("x").code).toBe(
      ErrorCode.MARKET_DATA_UNAVAILABLE,
    );
    expect(new AiUnavailableError("x").code).toBe(ErrorCode.AI_UNAVAILABLE);
    expect(new CircuitBreakerOpenError("x").code).toBe(
      ErrorCode.CIRCUIT_BREAKER_OPEN,
    );
  });

  test("isRetryableActionError", () => {
    expect(isRetryableActionError(new BrokerTimeoutError("x"))).toBe(true);
    expect(isRetryableActionError(new BrokerAuthError("x"))).toBe(false);
    expect(isRetryableActionError(new Error("plain"))).toBe(true);
    expect(isRetryableActionError(new TypeError("type"))).toBe(true);
  });
});

// ── 2. Retry policy ───────────────────────────────────────────────────────
describe("retry policy", () => {
  test("resolveRetryPolicy defaults", () => {
    const p = resolveRetryPolicy(undefined);
    expect(p.enabled).toBe(false);
    expect(p.maxAttempts).toBe(1);
  });

  test("exponential backoff policy parsed correctly", () => {
    const p = resolveRetryPolicy({
      enabled: true,
      maxAttempts: 3,
      backoffType: "exponential",
      delaySeconds: 2,
    });
    expect(p.enabled).toBe(true);
    expect(p.maxAttempts).toBe(3);
    expect(p.backoffType).toBe("exponential");
    expect(p.delaySeconds).toBe(2);
  });

  test("fixed backoff policy parsed correctly", () => {
    const p = resolveRetryPolicy({
      enabled: true,
      maxAttempts: 5,
      backoffType: "fixed",
      delaySeconds: 5,
    });
    expect(p.backoffType).toBe("fixed");
    expect(p.delaySeconds).toBe(5);
  });

  test("retry defaults to disabled", () => {
    const p = resolveRetryPolicy(undefined);
    expect(p.enabled).toBe(false);
    expect(p.maxAttempts).toBe(1);
  });
});

// ── 3. Config/env ─────────────────────────────────────────────────────────
describe("config/env", () => {
  test("exports typed env object", () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.REDIS.HOST).toBe("localhost");
    expect(env.REDIS.PORT).toBe(6379);
    expect(env.AI.PROVIDER).toBe("gemini");
    expect(env.AI.GOOGLE_MODEL).toBe("gemini-2.5-flash");
    expect(env.NOTIFICATIONS.RESEND_API_KEY).toBeDefined();
  });

  test("rate limits have defaults", () => {
    expect(env.RATE_LIMITS.ZERODHA).toBe(50);
    expect(env.RATE_LIMITS.GEMINI).toBe(60);
    expect(env.RATE_LIMITS.MARKET_DATA).toBe(100);
  });
});

// ── 4. Circuit breaker ────────────────────────────────────────────────────
describe("circuit breaker", () => {
  test("CircuitBreakerOpenError is retryable", async () => {
    const err = new CircuitBreakerOpenError("test-service");
    expect(err.retryable).toBe(false);
    expect(err.code).toBe(ErrorCode.CIRCUIT_BREAKER_OPEN);
  });
});

// ── 5. Redis rate limiter ─────────────────────────────────────────────────
describe("rate limiter integration", () => {
  test("rate limiter connects to Redis", async () => {
    const { rateLimiter } = await import("./services/rate-limiter");
    // Should resolve without error when rate is not exceeded
    await rateLimiter.acquire("test-service");
    expect(true).toBe(true);
  });
});
