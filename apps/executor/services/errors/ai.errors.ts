import { AppError } from "./base.error";
import { ErrorCode } from "./codes";

export class AiUnavailableError extends AppError {
  constructor(source = "gemini", message = "AI service is unavailable") {
    super(ErrorCode.AI_UNAVAILABLE, message, true, source);
    this.name = "AiUnavailableError";
  }
}

export class AiRateLimitedError extends AppError {
  constructor(source = "gemini", message = "AI service rate limit exceeded") {
    super(ErrorCode.AI_RATE_LIMITED, message, true, source);
    this.name = "AiRateLimitedError";
  }
}

export class AiInvalidResponseError extends AppError {
  constructor(source = "gemini", message = "AI returned an invalid response") {
    super(ErrorCode.AI_INVALID_RESPONSE, message, false, source);
    this.name = "AiInvalidResponseError";
  }
}
