import type { LighterMetadata, TradingMetadata } from "@quantnest-trading/types";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;
export const ZERODHA_API_KEY_REGEX = /^[A-Za-z0-9]{8,32}$/;
export const ACCESS_TOKEN_REGEX = /^[A-Za-z0-9._-]{16,512}$/;
export const LIGHTER_PRIVATE_KEY_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validateStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getSignupValidationErrors(input: {
  username: string;
  email: string;
  password: string;
}): string[] {
  const errors: string[] = [];

  if (input.username.trim().length < 3 || input.username.trim().length > 30) {
    errors.push("Username must be between 3 and 30 characters.");
  }

  if (!validateEmail(input.email)) {
    errors.push("Enter a valid email address.");
  }

  if (!validateStrongPassword(input.password)) {
    errors.push(
      "Password must include upper/lowercase letters, a number, a special character, and be at least 8 characters."
    );
  }

  return errors;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number.NaN;
}

export function getTradingValidationErrors(
  action: "zerodha" | "groww" | "lighter",
  metadata: TradingMetadata | LighterMetadata | {}
): string[] {
  const errors: string[] = [];
  const data = metadata as any;

  const qty = toNumber(data.qty);
  if (!Number.isFinite(qty) || qty <= 0) {
    errors.push("Quantity must be greater than 0.");
  }

  if (!data.type) {
    errors.push("Select order/position type.");
  }
  if (!data.symbol) {
    errors.push("Select an asset/symbol.");
  }

  if (action === "zerodha") {
    if (!ZERODHA_API_KEY_REGEX.test(String(data.apiKey || "").trim())) {
      errors.push("Zerodha API key must be 8-32 alphanumeric characters.");
    }
    const accessToken = String(data.accessToken || "").trim();
    if (accessToken.length > 0 && !ACCESS_TOKEN_REGEX.test(accessToken)) {
      errors.push("Zerodha access token format is invalid.");
    }
  }

  if (action === "groww") {
    if (!ACCESS_TOKEN_REGEX.test(String(data.accessToken || "").trim())) {
      errors.push("Groww access token format is invalid.");
    }
  }

  if (action === "lighter") {
    if (!LIGHTER_PRIVATE_KEY_REGEX.test(String(data.apiKey || "").trim())) {
      errors.push("Lighter API key must be a valid 64-char hex private key.");
    }
    const accountIndex = toNumber(data.accountIndex);
    const apiKeyIndex = toNumber(data.apiKeyIndex);
    if (!Number.isInteger(accountIndex) || accountIndex < 0) {
      errors.push("Lighter account index must be a non-negative integer.");
    }
    if (!Number.isInteger(apiKeyIndex) || apiKeyIndex < 0) {
      errors.push("Lighter API key index must be a non-negative integer.");
    }
  }

  return errors;
}
