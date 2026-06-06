export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  elo INTEGER NOT NULL DEFAULT 400,
  peak_elo INTEGER NOT NULL DEFAULT 400,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  is_guest BOOLEAN NOT NULL DEFAULT true,
  google_id TEXT UNIQUE,
  last_pdl JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_elo ON players (elo DESC);

CREATE TABLE IF NOT EXISTS match_outcomes (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  winner_id TEXT NOT NULL,
  loser_id TEXT NOT NULL,
  winner_elo_delta INTEGER NOT NULL DEFAULT 0,
  loser_elo_delta INTEGER NOT NULL DEFAULT 0,
  winner_elo INTEGER NOT NULL,
  loser_elo INTEGER NOT NULL,
  unranked BOOLEAN NOT NULL DEFAULT false,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_outcomes_created ON match_outcomes (created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  match_id TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports (reporter_id);
`;
