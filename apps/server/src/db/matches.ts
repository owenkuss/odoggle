import type { MatchOutcome } from "@odoggle/shared";
import { v4 as uuidv4 } from "uuid";
import { getPool } from "./pool";

export async function dbSaveMatchOutcome(
  outcome: MatchOutcome,
  voteCount: number
): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  await pool.query(
    `INSERT INTO match_outcomes (
      id, match_id, winner_id, loser_id,
      winner_elo_delta, loser_elo_delta,
      winner_elo, loser_elo, unranked, vote_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO NOTHING`,
    [
      uuidv4(),
      outcome.matchId,
      outcome.winnerId,
      outcome.loserId,
      outcome.winnerEloDelta,
      outcome.loserEloDelta,
      outcome.winnerElo,
      outcome.loserElo,
      outcome.unranked ?? false,
      voteCount,
    ]
  );
}
