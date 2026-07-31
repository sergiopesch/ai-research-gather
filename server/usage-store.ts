import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

type MemoryEntry = { value: unknown; expiresAt: number };
const memory = new Map<string, MemoryEntry>();
const MEMORY_LIMIT = 500;

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function pruneMemory(now = Date.now()): void {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
  while (memory.size >= MEMORY_LIMIT) memory.delete(memory.keys().next().value as string);
}

export function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = redisClient();
  if (redis) return await redis.get<T>(key);
  pruneMemory();
  return (memory.get(key)?.value as T | undefined) ?? null;
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = redisClient();
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }
  pruneMemory();
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function incrementUsage(key: string, ttlSeconds: number): Promise<number> {
  const redis = redisClient();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttlSeconds);
    return count;
  }
  pruneMemory();
  const current = memory.get(key);
  const count = typeof current?.value === "number" ? current.value + 1 : 1;
  memory.set(key, { value: count, expiresAt: current?.expiresAt || Date.now() + ttlSeconds * 1000 });
  return count;
}

export async function acquireLock(key: string, ttlSeconds = 180): Promise<boolean> {
  const redis = redisClient();
  if (redis) return (await redis.set(key, "1", { nx: true, ex: ttlSeconds })) === "OK";
  pruneMemory();
  if (memory.has(key)) return false;
  memory.set(key, { value: "1", expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  const redis = redisClient();
  if (redis) await redis.del(key);
  else memory.delete(key);
}
