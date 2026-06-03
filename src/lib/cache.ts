import crypto from "crypto";

const memoryCache = new Map<string, { data: any; ts: number }>();

let redisClient: any = null;
let redisLoading = false;

async function getRedis() {
  if (redisClient !== null) return redisClient;
  if (redisLoading) return null;
  redisLoading = true;
  try {
    const { Redis } = await import("@upstash/redis");
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (url && token) {
      redisClient = new Redis({ url, token });
    } else {
      redisClient = null;
    }
  } catch {
    redisClient = null;
  }
  redisLoading = false;
  return redisClient;
}

function normalizeKey(key: string): string {
  return "cache:" + crypto.createHash("sha256").update(key).digest("hex");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export async function getCached(key: string, maxAge: number): Promise<any | null> {
  const nkey = normalizeKey(key);

  const mem = memoryCache.get(nkey);
  if (mem && Date.now() - mem.ts < maxAge * 1000) return mem.data;

  const redis = await getRedis();
  if (redis) {
    try {
      const raw = await withTimeout(redis.get(nkey), 5000);
      if (raw) {
        const entry = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Date.now() - entry.ts < maxAge * 1000) {
          memoryCache.set(nkey, { data: entry.data, ts: entry.ts });
          return entry.data;
        }
      }
    } catch {}
  }

  return null;
}

export async function setCache(key: string, data: any) {
  const nkey = normalizeKey(key);
  const entry = { ts: Date.now(), data };

  memoryCache.set(nkey, entry);

  const redis = await getRedis();
  if (redis) {
    try { await withTimeout(redis.set(nkey, JSON.stringify(entry)), 5000); } catch {}
  }
}

export function clearMemoryCache() {
  memoryCache.clear();
}

export { memoryCache };
