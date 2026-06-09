export const DEFAULT_ELO = 400;
export const MIN_ELO = 100;
export const MAX_ELO = 3000;
export const MATCH_DURATION_SEC = 15;
export const PDL_SCAN_TTL_MS = 30 * 60 * 1000;
export const ROOM_CODE_LENGTH = 4;
export const ROOM_TTL_SEC = 86400;
export const TOP_DOG_RANK = 100;

export const ELO_K_FACTORS: Record<string, number> = {
  default: 32,
  topDog: 16,
  provisional: 48,
};

export const MATCHMAKING_BUCKETS = [100, 150, 200, 300, 500];

export const PDL_WEIGHTS = {
  symmetry: 0.25,
  harmony: 0.25,
  muzzle: 0.2,
  coat: 0.15,
  eyeAlertness: 0.15,
} as const;

export const PRO_PRICE_USD = 9.99;
/** Pro is a one-time purchase — no subscription, no expiry */
export const PRO_IS_LIFETIME = true;
