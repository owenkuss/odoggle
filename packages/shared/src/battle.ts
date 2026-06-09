import { PDL_SCAN_TTL_MS } from "./constants";
import type { PdlResult } from "./types";

export const DEFAULT_PDL_SCORE = 5;

export function getEffectivePdlScore(lastPdl: PdlResult | undefined, now = Date.now()): number {
  if (!lastPdl) return DEFAULT_PDL_SCORE;
  if (now - lastPdl.scannedAt > PDL_SCAN_TTL_MS) return DEFAULT_PDL_SCORE;
  return lastPdl.composite;
}

export function resolveWinnerByPdl(
  player1Id: string,
  player2Id: string,
  player1Score: number,
  player2Score: number
): { winnerId: string; loserId: string } {
  if (player1Score > player2Score) {
    return { winnerId: player1Id, loserId: player2Id };
  }
  if (player2Score > player1Score) {
    return { winnerId: player2Id, loserId: player1Id };
  }
  if (player1Id < player2Id) {
    return { winnerId: player1Id, loserId: player2Id };
  }
  return { winnerId: player2Id, loserId: player1Id };
}
