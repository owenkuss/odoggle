"use client";

export interface MatchContestant {
  id: string;
  displayName: string;
  elo: number;
}

interface JuryVotePanelProps {
  matchId: string;
  player1: MatchContestant;
  player2: MatchContestant;
  totalVotes?: number;
  minVotes?: number;
  onVote: (votedForId: string) => void;
  voted?: boolean;
  compact?: boolean;
}

export function JuryVotePanel({
  matchId,
  player1,
  player2,
  totalVotes = 0,
  minVotes = 3,
  onVote,
  voted = false,
  compact = false,
}: JuryVotePanelProps) {
  return (
    <div
      className={`bg-zinc-900 border border-amber-500/30 rounded-xl ${compact ? "p-4" : "p-6"}`}
    >
      <div className="text-center mb-4">
        <div className="text-xs text-amber-400 uppercase tracking-wide mb-1">Audience vote</div>
        <div className="text-sm text-zinc-500">
          Match {matchId.slice(0, 8)} · {totalVotes} / {minVotes} votes
        </div>
      </div>
      {voted ? (
        <div className="text-center text-green-400 text-sm">Vote recorded — thanks!</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[player1, player2].map((p) => (
            <button
              key={p.id}
              onClick={() => onVote(p.id)}
              className="bg-zinc-800 hover:bg-amber-500/20 hover:border-amber-500 border border-zinc-700 rounded-lg p-4 text-center transition-colors"
            >
              <div className="font-semibold">{p.displayName}</div>
              <div className="text-xs text-zinc-500 mt-1">{p.elo} ELO</div>
              <div className="text-xs text-amber-400 mt-2">Vote →</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
