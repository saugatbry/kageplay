import crypto from "crypto";

const memoryCache = new Map<string, { data: any; ts: number }>();

let remoteCache: any = null;
let remoteLoading = false;

async function getRemote() {
  if (remoteCache !== null) return remoteCache;
  if (remoteLoading) return null;
  remoteLoading = true;
  try {
    // 1) Try Cloudflare Workers KV binding (OpenNext exposes env as process.env)
    const cfKv = (process.env as any).CACHE_KV;
    if (cfKv && typeof cfKv.get === "function" && typeof cfKv.put === "function") {
      remoteCache = { type: "cf-kv", client: cfKv };
      remoteLoading = false;
      return remoteCache;
    }
  } catch {
    // fall through
  }
  try {
    // 2) Try Upstash Redis (HTTP-based, works on Node.js and CF Workers)
    const { Redis } = await import("@upstash/redis");
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (url && token) {
      remoteCache = { type: "upstash", client: new Redis({ url, token }) };
      remoteLoading = false;
      return remoteCache;
    }
  } catch {
    // fall through
  }
  remoteCache = null;
  remoteLoading = false;
  return null;
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

  const remote = await getRemote();
  if (remote) {
    try {
      let raw: any;
      if (remote.type === "cf-kv") {
        raw = await withTimeout(remote.client.get(nkey, { type: "json" }), 5000);
      } else {
        raw = await withTimeout(remote.client.get(nkey), 5000);
        if (typeof raw === "string") raw = JSON.parse(raw);
      }
      if (raw && Date.now() - raw.ts < maxAge * 1000) {
        memoryCache.set(nkey, { data: raw.data, ts: raw.ts });
        return raw.data;
      }
    } catch {}
  }

  return null;
}

export async function setCache(key: string, data: any) {
  const nkey = normalizeKey(key);
  const entry = { ts: Date.now(), data };

  memoryCache.set(nkey, entry);

  const remote = await getRemote();
  if (remote) {
    try {
      if (remote.type === "cf-kv") {
        await withTimeout(remote.client.put(nkey, JSON.stringify(entry), { expirationTtl: 86400 }), 5000);
      } else {
        await withTimeout(remote.client.set(nkey, JSON.stringify(entry)), 5000);
      }
    } catch {}
  }
}

export function clearMemoryCache() {
  memoryCache.clear();
}

export { memoryCache };
