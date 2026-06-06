import type { PlayerProfile } from "@odoggle/shared";
import {
  dbGetLeaderboard,
  dbGetMatchCount,
  dbGetPlayer,
  dbMergePlayers,
  dbUpsertPlayer,
} from "../db/players";
import { dbSaveMatchOutcome } from "../db/matches";
import type { MatchOutcome } from "@odoggle/shared";

const cache = new Map<string, PlayerProfile>();

export function cachePlayer(profile: PlayerProfile): PlayerProfile {
  cache.set(profile.id, profile);
  void dbUpsertPlayer(profile);
  return profile;
}

export async function loadPlayer(id: string): Promise<PlayerProfile | undefined> {
  const cached = cache.get(id);
  if (cached) return cached;
  const fromDb = await dbGetPlayer(id);
  if (fromDb) {
    cache.set(id, fromDb);
    return fromDb;
  }
  return undefined;
}

export async function fetchLeaderboard(limit: number, fallback: () => ReturnType<typeof dbGetLeaderboard> extends Promise<infer T> ? NonNullable<T> : never) {
  const fromDb = await dbGetLeaderboard(limit);
  if (fromDb) return fromDb;
  return fallback();
}

export async function mergeGuestIntoAccount(
  guestId: string,
  accountId: string,
  displayName: string,
  memoryMerge: (guestId: string, accountId: string, displayName: string) => PlayerProfile
): Promise<PlayerProfile> {
  const fromDb = await dbMergePlayers(guestId, accountId, displayName);
  const merged = fromDb ?? memoryMerge(guestId, accountId, displayName);
  merged.id = accountId;
  merged.isGuest = false;
  cache.set(accountId, merged);
  cache.delete(guestId);
  void dbUpsertPlayer(merged);
  return merged;
}

export async function persistMatchOutcome(outcome: MatchOutcome, voteCount: number): Promise<void> {
  await dbSaveMatchOutcome(outcome, voteCount);
}

export async function fetchTotalMatches(fallback: number): Promise<number> {
  const fromDb = await dbGetMatchCount();
  if (fromDb !== null) return fromDb;
  return fallback;
}

export function memoryMergePlayers(
  players: Map<string, PlayerProfile>,
  guestId: string,
  accountId: string,
  displayName: string
): PlayerProfile {
  const guest = players.get(guestId);
  const existing = players.get(accountId);

  if (existing) {
    const merged: PlayerProfile = {
      ...existing,
      displayName,
      elo: Math.max(existing.elo, guest?.elo ?? existing.elo),
      peakElo: Math.max(existing.peakElo, guest?.peakElo ?? 0, guest?.elo ?? 0),
      wins: existing.wins + (guest?.wins ?? 0),
      losses: existing.losses + (guest?.losses ?? 0),
      isPro: existing.isPro || (guest?.isPro ?? false),
      isGuest: false,
      lastPdl: guest?.lastPdl ?? existing.lastPdl,
    };
    players.set(accountId, merged);
    return merged;
  }

  const merged: PlayerProfile = {
    id: accountId,
    displayName,
    elo: guest?.elo ?? 400,
    peakElo: guest?.peakElo ?? guest?.elo ?? 400,
    wins: guest?.wins ?? 0,
    losses: guest?.losses ?? 0,
    isPro: guest?.isPro ?? false,
    isGuest: false,
    lastPdl: guest?.lastPdl,
  };
  players.set(accountId, merged);
  return merged;
}
