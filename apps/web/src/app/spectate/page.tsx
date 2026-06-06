"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JuryVotePanel, type MatchContestant } from "@/components/jury-vote-panel";
import { useJury } from "@/lib/jury-context";
import { usePlayer } from "@/lib/player-context";
import { SignalClient } from "@/lib/signal-client";

interface VotingMatch {
  matchId: string;
  player1: MatchContestant;
  player2: MatchContestant;
  votes: number;
  minVotes: number;
  unranked?: boolean;
}

export default function SpectatePage() {
  const { player } = usePlayer();
  const { connectSpectator } = useJury();
  const [matches, setMatches] = useState<VotingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState<VotingMatch | null>(null);
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const signalRef = useRef<SignalClient | null>(null);

  const loadMatches = useCallback(async () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    try {
      const res = await fetch(`${base}/api/matches/voting`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
    const iv = setInterval(() => void loadMatches(), 5000);
    return () => clearInterval(iv);
  }, [loadMatches]);

  useEffect(() => () => signalRef.current?.disconnect(), []);

  async function joinVote(match: VotingMatch) {
    setActiveMatch(match);
    setVoted(false);
    setVoteCount(match.votes);

    signalRef.current?.disconnect();
    const signal = new SignalClient();
    signalRef.current = signal;
    await signal.connect();
    signal.register(player.id, player.displayName, player.elo, player.isPro);
    signal.onMessage((msg) => {
      if (msg.type === "vote_recorded" && msg.matchId === match.matchId) {
        setVoteCount(Number(msg.totalVotes ?? 0));
      }
      if (msg.type === "match_result" && msg.matchId === match.matchId) {
        setActiveMatch(null);
        void loadMatches();
      }
    });
    signal.spectate(match.matchId);
    await connectSpectator(match.matchId);
  }

  function castVote(votedForId: string) {
    if (!activeMatch || !signalRef.current) return;
    signalRef.current.vote(activeMatch.matchId, votedForId);
    setVoted(true);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">Audience Vote</h1>
      <p className="text-zinc-500 text-center mb-8">
        Cast your vote on live bark battles. Players waiting in queue may be pulled as jury automatically.
      </p>

      {activeMatch && (
        <div className="mb-8">
          <JuryVotePanel
            matchId={activeMatch.matchId}
            player1={activeMatch.player1}
            player2={activeMatch.player2}
            totalVotes={voteCount}
            minVotes={activeMatch.minVotes}
            onVote={castVote}
            voted={voted}
          />
          <button
            onClick={() => setActiveMatch(null)}
            className="w-full mt-3 text-sm text-zinc-500 hover:text-zinc-300"
          >
            Back to list
          </button>
        </div>
      )}

      {loading && <div className="text-center text-zinc-500">Loading active votes...</div>}

      {!loading && matches.length === 0 && (
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
                {m.player1.displayName} vs {m.player2.displayName}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {m.votes} / {m.minVotes} votes
                {m.unranked && " · unranked"}
              </div>
            </div>
            <button
              onClick={() => joinVote(m)}
              className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
            >
              Vote
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
