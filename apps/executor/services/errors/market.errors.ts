import { AppError } from "./base.error";
import { ErrorCode } from "./codes";

export class MarketDataUnavailableError extends AppError {
  constructor(source = "market-data", message = "Market data is unavailable") {
    super(ErrorCode.MARKET_DATA_UNAVAILABLE, message, true, source);
    this.name = "MarketDataUnavailableError";
  }
}
