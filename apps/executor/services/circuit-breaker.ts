import { AppError } from "./errors/base.error";
import { ErrorCode } from "./errors/codes";

const enum BreakerState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

interface BreakerEntry {
  state: BreakerState;
  failureCount: number;
  lastFailureTime: number;
  halfOpenSuccessCount: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxProbes: number;
}

export class CircuitBreakerOpenError extends AppError {
  constructor(source: string) {
    super(
      ErrorCode.CIRCUIT_BREAKER_OPEN,
      `Circuit breaker is open for "${source}"`,
      false,
      source,
    );
    this.name = "CircuitBreakerOpenError";
  }
}

const DEFAULT_CONFIGS: Record<string, CircuitBreakerConfig> = {
  zerodha: {
    failureThreshold: 5,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  groww: {
    failureThreshold: 5,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  lighter: {
    failureThreshold: 5,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  gemini: {
    failureThreshold: 3,
    recoveryTimeoutMs: 60_000,
    halfOpenMaxProbes: 1,
  },
  "market-data": {
    failureThreshold: 5,
    recoveryTimeoutMs: 15_000,
    halfOpenMaxProbes: 2,
  },
  discord: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  slack: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  telegram: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  whatsapp: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  gmail: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  notion: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  "google-drive": {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  "google-sheets": {
    failureThreshold: 3,
    recoveryTimeoutMs: 30_000,
    halfOpenMaxProbes: 1,
  },
  postgres: {
    failureThreshold: 5,
    recoveryTimeoutMs: 15_000,
    halfOpenMaxProbes: 1,
  },
};

export class CircuitBreaker {
  private readonly entries = new Map<string, BreakerEntry>();
  private configs: Record<string, CircuitBreakerConfig>;

  constructor(overrides?: Record<string, Partial<CircuitBreakerConfig>>) {
    this.configs = { ...DEFAULT_CONFIGS };
    if (overrides) {
      for (const [service, cfg] of Object.entries(overrides)) {
        if (this.configs[service]) {
          this.configs[service] = { ...this.configs[service], ...cfg };
        }
      }
    }
  }

  async wrap<T>(service: string, fn: () => Promise<T>): Promise<T> {
    if (this.isOpen(service)) {
      throw new CircuitBreakerOpenError(service);
    }
    return fn();
  }

  recordSuccess(service: string): void {
    const entry = this.entries.get(service);
    if (!entry) return;

    if (entry.state === BreakerState.HALF_OPEN) {
      entry.halfOpenSuccessCount++;
      const config = this.configs[service];
      if (entry.halfOpenSuccessCount >= (config?.halfOpenMaxProbes ?? 1)) {
        entry.state = BreakerState.CLOSED;
        entry.failureCount = 0;
        entry.halfOpenSuccessCount = 0;
        entry.lastFailureTime = 0;
      }
    } else if (entry.state === BreakerState.CLOSED) {
      entry.failureCount = 0;
    }
  }

  recordFailure(service: string): void {
    let entry = this.entries.get(service);
    const config = this.configs[service];
    if (!config) return;

    if (!entry) {
      entry = {
        state: BreakerState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        halfOpenSuccessCount: 0,
      };
      this.entries.set(service, entry);
    }

    if (entry.state === BreakerState.HALF_OPEN) {
      entry.state = BreakerState.OPEN;
      entry.lastFailureTime = Date.now();
      return;
    }

    entry.failureCount++;
    entry.lastFailureTime = Date.now();

    if (entry.failureCount >= config.failureThreshold) {
      entry.state = BreakerState.OPEN;
    }
  }

  isOpen(service: string): boolean {
    const entry = this.entries.get(service);
    if (!entry) return false;

    if (entry.state === BreakerState.OPEN) {
      const config = this.configs[service];
      if (
        config &&
        Date.now() - entry.lastFailureTime >= config.recoveryTimeoutMs
      ) {
        entry.state = BreakerState.HALF_OPEN;
        entry.halfOpenSuccessCount = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  getState(service: string): "CLOSED" | "OPEN" | "HALF_OPEN" {
    const entry = this.entries.get(service);
    if (!entry) return "CLOSED";
    if (entry.state === BreakerState.CLOSED) return "CLOSED";
    if (entry.state === BreakerState.HALF_OPEN) return "HALF_OPEN";
    return "OPEN";
  }
}

export const circuitBreaker = new CircuitBreaker();
