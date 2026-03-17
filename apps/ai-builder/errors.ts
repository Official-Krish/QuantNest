export class AiBuilderError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AiBuilderError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isAiBuilderError(error: unknown): error is AiBuilderError {
  return error instanceof AiBuilderError;
}
