import { createClient } from "redis";

const host = process.env.REDIS_HOST ?? "redis";

export const redisSubscriber = createClient({
  url: `redis://${host}:6379`,
});

let _connected = false;

export async function initRedis() {
  if (_connected) return;
  redisSubscriber.on("error", (err) => console.error("[redis] error:", err));
  await redisSubscriber.connect();
  _connected = true;
  console.log(`[redis] connected to ${host}:6379`);
}

export function getRedis() {
  return redisSubscriber;
}

export async function redisGet<T = string>(key: string): Promise<T | null> {
  try {
    const val = await redisSubscriber.get(key);
    if (val === null) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as T;
    }
  } catch (err) {
    console.error("[redis] get error:", err);
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlMs?: number,
): Promise<void> {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlMs !== undefined) {
      await redisSubscriber.set(key, str, { PX: ttlMs });
    } else {
      await redisSubscriber.set(key, str);
    }
  } catch (err) {
    console.error("[redis] set error:", err);
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    await redisSubscriber.del(key);
  } catch (err) {
    console.error("[redis] del error:", err);
  }
}

export async function redisCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): Promise<T> {
  try {
    const cached = await redisGet<T>(key);
    if (cached !== null) return cached;
  } catch {
    // fall through to fetcher
  }

  const value = await fetcher();
  await redisSet(key, value, ttlMs);
  return value;
}
