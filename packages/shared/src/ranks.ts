export interface RankTier {
  title: string;
  emoji: string;
  minElo: number;
  maxElo: number;
}

/** Dog-themed ELO tiers — mirrors getRankTitle breakpoints. */
export const RANK_TIERS: RankTier[] = [
  { title: "Top Dog", emoji: "👑", minElo: 2400, maxElo: 9999 },
  { title: "Alpha", emoji: "⚡", minElo: 2000, maxElo: 2399 },
  { title: "Champion", emoji: "🏆", minElo: 1600, maxElo: 1999 },
  { title: "Good Boy", emoji: "⭐", minElo: 1200, maxElo: 1599 },
  { title: "Pup", emoji: "🐾", minElo: 800, maxElo: 1199 },
  { title: "Stray", emoji: "🥀", minElo: 0, maxElo: 799 },
];

export function getRankTier(elo: number): RankTier {
  return RANK_TIERS.find((t) => elo >= t.minElo) ?? RANK_TIERS[RANK_TIERS.length - 1];
}

export function formatEloBand(tier: RankTier): string {
  if (tier.minElo >= 2400) return `${tier.minElo.toLocaleString()}+ ELO`;
  return `${tier.minElo.toLocaleString()}–${tier.maxElo.toLocaleString()} ELO`;
}
