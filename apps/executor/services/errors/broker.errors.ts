import { AppError } from "./base.error";
import { ErrorCode } from "./codes";

export class BrokerTimeoutError extends AppError {
  constructor(source: string, message = "Broker request timed out") {
    super(ErrorCode.BROKER_TIMEOUT, message, true, source);
    this.name = "BrokerTimeoutError";
  }
}

export class BrokerAuthError extends AppError {
  constructor(source: string, message = "Broker authentication failed") {
    super(ErrorCode.BROKER_AUTH_FAILED, message, false, source);
    this.name = "BrokerAuthError";
  }
}

export class OrderRejectedError extends AppError {
  constructor(source: string, message = "Order was rejected by broker") {
    super(ErrorCode.ORDER_REJECTED, message, false, source);
    this.name = "OrderRejectedError";
  }
}
