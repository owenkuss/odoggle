import { DEFAULT_ELO, ELO_K_FACTORS, MAX_ELO, MIN_ELO } from "./constants";

export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

export function computeEloDelta(
  playerElo: number,
  opponentElo: number,
  won: boolean,
  options?: { isTopDog?: boolean; isProvisional?: boolean }
): number {
  const k = options?.isProvisional
    ? ELO_K_FACTORS.provisional
    : options?.isTopDog
      ? ELO_K_FACTORS.topDog
      : ELO_K_FACTORS.default;

  const actual = won ? 1 : 0;
  const expected = expectedScore(playerElo, opponentElo);
  return Math.round(k * (actual - expected));
}

export function clampElo(elo: number): number {
  return Math.max(MIN_ELO, Math.min(MAX_ELO, elo));
}

export function applyMatchResult(
  winnerElo: number,
  loserElo: number,
  options?: { winnerTopDog?: boolean; loserTopDog?: boolean }
): { winnerDelta: number; loserDelta: number; winnerNew: number; loserNew: number } {
  const winnerDelta = computeEloDelta(winnerElo, loserElo, true, {
    isTopDog: options?.winnerTopDog,
  });
  const loserDelta = computeEloDelta(loserElo, winnerElo, false, {
    isTopDog: options?.loserTopDog,
  });

  return {
    winnerDelta,
    loserDelta,
    winnerNew: clampElo(winnerElo + winnerDelta),
    loserNew: clampElo(loserElo + loserDelta),
  };
}

export function pdlToBand(rawScore: number): number {
  const clamped = Math.max(0, Math.min(100, rawScore));
  if (clamped <= 20) return 1 + (clamped / 20) * 2;
  if (clamped <= 50) return 3 + ((clamped - 20) / 30) * 2;
  if (clamped <= 80) return 5 + ((clamped - 50) / 30) * 2;
  return 7 + ((clamped - 80) / 20) * 3;
}

export function generateRoomCode(length = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getRankTitle(elo: number): string {
  if (elo >= 2400) return "Top Dog";
  if (elo >= 2000) return "Alpha";
  if (elo >= 1600) return "Champion";
  if (elo >= 1200) return "Good Boy";
  if (elo >= 800) return "Pup";
  return "Stray";
}

export { DEFAULT_ELO };
