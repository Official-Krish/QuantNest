import { getRedis } from "../index";

export async function acquireLock(
  key: string,
  value: string,
  ttlMs: number,
): Promise<boolean> {
  try {
    const redis = getRedis();
    const result = await redis.set(key, value, { NX: true, PX: ttlMs });
    return result === "OK";
  } catch (err) {
    console.error("[redis] acquireLock error:", err);
    return false;
  }
}

export async function releaseLock(
  key: string,
  value: string,
): Promise<boolean> {
  try {
    const redis = getRedis();
    const stored = await redis.getDel(key);
    return stored === value;
  } catch (err) {
    console.error("[redis] releaseLock error:", err);
    return false;
  }
}
