import jwt from "jsonwebtoken";

const INTERNAL_SCOPE = "executor-service";
const TOKEN_EXPIRY = "60s";

export function getInternalJwtSecret(): string {
  const secret = process.env.AI_SERVICE_JWT_SECRET;
  if (!secret) {
    throw new Error("AI_SERVICE_JWT_SECRET must be configured");
  }
  return secret;
}

export function generateInternalToken(userId?: string): string {
  return jwt.sign(
    {
      scope: INTERNAL_SCOPE,
      userId: userId || undefined,
    },
    getInternalJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: TOKEN_EXPIRY,
    },
  );
}
