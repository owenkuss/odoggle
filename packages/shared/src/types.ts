export type PdlSubScoreKey =
  | "symmetry"
  | "harmony"
  | "muzzle"
  | "coat"
  | "eyeAlertness";

export interface PdlSubScores {
  symmetry: number;
  harmony: number;
  muzzle: number;
  coat: number;
  eyeAlertness: number;
}

export interface PdlResult {
  composite: number;
  subScores: PdlSubScores;
  confidence: number;
  scannedAt: number;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  elo: number;
  peakElo: number;
  wins: number;
  losses: number;
  isPro: boolean;
  isGuest: boolean;
  lastPdl?: PdlResult;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  elo: number;
  wins: number;
  losses: number;
  isPro: boolean;
  isTopDog: boolean;
}

export interface MatchOutcome {
  matchId: string;
  winnerId: string;
  loserId: string;
  winnerEloDelta: number;
  loserEloDelta: number;
  winnerElo: number;
  loserElo: number;
  unranked?: boolean;
}

export type ReportReason =
  | "inappropriate"
  | "not_a_dog"
  | "abuse"
  | "spam"
  | "other";

export interface VotePayload {
  matchId: string;
  voterId: string;
  votedForId: string;
}

export interface RoomInfo {
  code: string;
  hostId: string;
  guestId?: string;
  unranked: boolean;
  expiresAt: number;
}

export interface LiveStats {
  totalMatches: number;
  activePlayers: number;
  countries: number;
  hoursPerDay: number;
}

export interface DogLandmark {
  x: number;
  y: number;
  visible: boolean;
}

export interface DogFaceDetection {
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  landmarks: DogLandmark[];
}
