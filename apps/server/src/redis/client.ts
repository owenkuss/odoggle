import Redis from "ioredis";
import type { RoomInfo } from "@odoggle/shared";
import { ROOM_TTL_SEC } from "@odoggle/shared";

let redis: Redis | null = null;

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export function getRedis(): Redis | null {
  if (!isRedisEnabled()) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 2 });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

const roomKey = (code: string) => `room:${code.toUpperCase()}`;
const presenceKey = (code: string) => `room:presence:${code.toUpperCase()}`;

export async function redisSaveRoom(room: RoomInfo): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(roomKey(room.code), JSON.stringify(room), "EX", ROOM_TTL_SEC);
}

export async function redisGetRoom(code: string): Promise<RoomInfo | null> {
  const r = getRedis();
  if (!r) return null;
  const raw = await r.get(roomKey(code));
  return raw ? (JSON.parse(raw) as RoomInfo) : null;
}

export async function redisDeleteRoom(code: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(roomKey(code), presenceKey(code));
}

export async function redisAddRoomPresence(code: string, playerId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const key = presenceKey(code);
  await r.sadd(key, playerId);
  await r.expire(key, ROOM_TTL_SEC);
}

export async function redisGetRoomPresence(code: string): Promise<Set<string>> {
  const r = getRedis();
  if (!r) return new Set();
  const members = await r.smembers(presenceKey(code));
  return new Set(members);
}

export async function redisClearRoomPresence(code: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(presenceKey(code));
}

export async function checkRateLimit(
  bucket: string,
  id: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  const r = getRedis();
  if (!r) return true;

  const key = `ratelimit:${bucket}:${id}`;
  const count = await r.incr(key);
  if (count === 1) await r.expire(key, windowSec);
  return count <= max;
}

export async function redisIncrStat(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.incr(`stat:${key}`);
}

export async function redisGetStat(key: string): Promise<number | null> {
  const r = getRedis();
  if (!r) return null;
  const val = await r.get(`stat:${key}`);
  return val ? Number(val) : 0;
}
