"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { type MatchContestant } from "@/components/jury-vote-panel";
import { apiFetch } from "@/lib/api";
import { useJury } from "@/lib/jury-context";

interface VotingMatch {
  matchId: string;
  player1: MatchContestant;
  player2: MatchContestant;
  votes: number;
  minVotes: number;
  unranked?: boolean;
}

export default function SpectatePage() {
  const { connectSpectator, activeDuty } = useJury();
  const [matches, setMatches] = useState<VotingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      const res = await apiFetch("/api/matches/voting");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
      setError(null);
    } catch {
      setError("Cannot reach the game server. Start it with dev.cmd from the project folder.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
    const iv = setInterval(() => void loadMatches(), 5000);
    return () => clearInterval(iv);
  }, [loadMatches]);

  async function joinVote(match: VotingMatch) {
    setJoining(match.matchId);
    await connectSpectator(match.matchId);
    setJoining(null);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">Audience Vote</h1>
      <p className="text-zinc-500 text-center mb-8">
        Pick a live match and vote for the better dog. Queued players may get jury duty popups automatically.
      </p>

      {activeDuty && (
        <div className="mb-6 text-center text-sm text-green-400">
          Vote panel open below — scroll down if needed
        </div>
      )}

      {error && (
        <div className="mb-6 text-center bg-red-950/40 border border-red-900 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && <div className="text-center text-zinc-500">Loading active votes...</div>}

      {!loading && !error && matches.length === 0 && (
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-zinc-500">
          No matches awaiting votes right now.
          <Link href="/arena" className="block text-amber-400 mt-4 hover:underline">
            Enter Arena →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.matchId}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div>
              <div className="font-semibold">
                {m.player1.displayName}{" "}
                <span className="text-zinc-600 font-normal">vs</span> {m.player2.displayName}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {m.player1.elo} vs {m.player2.elo} ELO · {m.votes}/{m.minVotes} votes
                {m.unranked && " · unranked"}
              </div>
            </div>
            <button
              onClick={() => joinVote(m)}
              disabled={joining === m.matchId}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
            >
              {joining === m.matchId ? "..." : "Vote"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
