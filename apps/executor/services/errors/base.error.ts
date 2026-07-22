import { ErrorCode } from "./codes";

export class AppError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly source: string;

  constructor(
    code: string,
    message: string,
    retryable: boolean,
    source: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.retryable = retryable;
    this.source = source;
  }

  static from(
    err: unknown,
    defaults?: { code?: string; retryable?: boolean; source?: string },
  ): AppError {
    if (err instanceof AppError) {
      if (!defaults) return err;
      return new AppError(
        defaults.code ?? err.code,
        err.message,
        defaults.retryable ?? err.retryable,
        defaults.source ?? err.source,
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return new AppError(
      defaults?.code ?? ErrorCode.UNKNOWN,
      message,
      defaults?.retryable ?? true,
      defaults?.source ?? "unknown",
    );
  }
}
