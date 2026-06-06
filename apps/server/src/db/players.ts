import { DEFAULT_ELO, TOP_DOG_RANK } from "@odoggle/shared";
import type { PdlResult, PlayerProfile } from "@odoggle/shared";
import { getPool, isDbEnabled } from "./pool";

function rowToProfile(row: Record<string, unknown>): PlayerProfile {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    elo: Number(row.elo),
    peakElo: Number(row.peak_elo),
    wins: Number(row.wins),
    losses: Number(row.losses),
    isPro: Boolean(row.is_pro),
    isGuest: Boolean(row.is_guest),
    lastPdl: row.last_pdl ? (row.last_pdl as PdlResult) : undefined,
  };
}

export async function dbUpsertPlayer(profile: PlayerProfile): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  await pool.query(
    `INSERT INTO players (id, display_name, elo, peak_elo, wins, losses, is_pro, is_guest, last_pdl, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       elo = EXCLUDED.elo,
       peak_elo = EXCLUDED.peak_elo,
       wins = EXCLUDED.wins,
       losses = EXCLUDED.losses,
       is_pro = EXCLUDED.is_pro,
       is_guest = EXCLUDED.is_guest,
       last_pdl = COALESCE(EXCLUDED.last_pdl, players.last_pdl),
       updated_at = NOW()`,
    [
      profile.id,
      profile.displayName,
      profile.elo,
      profile.peakElo,
      profile.wins,
      profile.losses,
      profile.isPro,
      profile.isGuest,
      profile.lastPdl ? JSON.stringify(profile.lastPdl) : null,
    ]
  );
}

export async function dbGetPlayer(id: string): Promise<PlayerProfile | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query("SELECT * FROM players WHERE id = $1", [id]);
  return rows[0] ? rowToProfile(rows[0]) : null;
}

export async function dbGetLeaderboard(limit: number) {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    `SELECT * FROM players ORDER BY elo DESC LIMIT $1`,
    [limit]
  );
  return rows.map((row, i) => ({
    rank: i + 1,
    id: String(row.id),
    displayName: String(row.display_name),
    elo: Number(row.elo),
    peakElo: Number(row.peak_elo),
    wins: Number(row.wins),
    losses: Number(row.losses),
    isPro: Boolean(row.is_pro),
    isTopDog: i < TOP_DOG_RANK,
  }));
}

export async function dbMergePlayers(
  guestId: string,
  targetId: string,
  displayName: string
): Promise<PlayerProfile | null> {
  const pool = getPool();
  if (!pool) return null;

  const guest = await dbGetPlayer(guestId);
  const target = await dbGetPlayer(targetId);

  const guestElo = guest?.elo ?? DEFAULT_ELO;
  const guestWins = guest?.wins ?? 0;
  const guestLosses = guest?.losses ?? 0;
  const guestPeak = guest?.peakElo ?? DEFAULT_ELO;
  const guestPro = guest?.isPro ?? false;
  const guestPdl = guest?.lastPdl;

  if (target) {
    const merged: PlayerProfile = {
      id: targetId,
      displayName,
      elo: Math.max(target.elo, guestElo),
      peakElo: Math.max(target.peakElo, guestPeak, guestElo),
      wins: target.wins + guestWins,
      losses: target.losses + guestLosses,
      isPro: target.isPro || guestPro,
      isGuest: false,
      lastPdl: guestPdl ?? target.lastPdl,
    };
    await dbUpsertPlayer(merged);
    return merged;
  }

  const merged: PlayerProfile = {
    id: targetId,
    displayName,
    elo: guestElo,
    peakElo: guestPeak,
    wins: guestWins,
    losses: guestLosses,
    isPro: guestPro,
    isGuest: false,
    lastPdl: guestPdl,
  };
  await dbUpsertPlayer(merged);
  return merged;
}

export async function dbGetMatchCount(): Promise<number | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM match_outcomes");
  return Number(rows[0]?.count ?? 0);
}

export function dbAvailable(): boolean {
  return isDbEnabled();
}
