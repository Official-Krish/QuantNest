export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "JWT_SECRET") {
    throw new Error("JWT_SECRET must be configured and must not use the default placeholder value.");
  }
  return secret;
}
