import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshTokenModel } from "@quantnest-trading/db/client";
import { getJwtSecret } from "./security";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: "access" }, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createRefreshTokenRecord(
  userId: string,
): Promise<string> {
  const raw = generateRefreshToken();
  const familyId = crypto.randomUUID();

  await RefreshTokenModel.create({
    userId,
    tokenHash: hashToken(raw),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400000),
  });

  return raw;
}

export async function rotateRefreshToken(
  oldRawToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const tokenHash = hashToken(oldRawToken);
  const record = await RefreshTokenModel.findOne({
    tokenHash,
    revokedAt: null,
  });

  if (!record || record.expiresAt < new Date()) return null;

  const userId = record.userId.toString();
  const familyId = record.familyId;

  await RefreshTokenModel.updateOne(
    { _id: record._id },
    { $set: { revokedAt: new Date() } },
  );

  const newRaw = generateRefreshToken();
  await RefreshTokenModel.create({
    userId,
    tokenHash: hashToken(newRaw),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400000),
  });

  return {
    accessToken: generateAccessToken(userId),
    refreshToken: newRaw,
  };
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await RefreshTokenModel.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
