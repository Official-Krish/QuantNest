import { AppError } from "./base.error";
import { ErrorCode } from "./codes";

export class NotificationFailedError extends AppError {
  constructor(source: string, message = "Failed to send notification") {
    super(ErrorCode.NOTIFICATION_FAILED, message, true, source);
    this.name = "NotificationFailedError";
  }
}

export class NotificationRateLimitedError extends AppError {
  constructor(source: string, message = "Notification rate limit exceeded") {
    super(ErrorCode.NOTIFICATION_RATE_LIMITED, message, true, source);
    this.name = "NotificationRateLimitedError";
  }
}
