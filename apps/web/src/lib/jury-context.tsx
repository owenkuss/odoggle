"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { JuryVotePanel, type MatchContestant } from "@/components/jury-vote-panel";
import { usePlayer } from "@/lib/player-context";
import { SignalClient } from "@/lib/signal-client";

interface JuryDuty {
  matchId: string;
  player1: MatchContestant;
  player2: MatchContestant;
  minVotes: number;
  totalVotes: number;
}

interface JuryContextValue {
  activeDuty: JuryDuty | null;
  dismissDuty: () => void;
  connectSpectator: (matchId: string) => Promise<void>;
}

const JuryContext = createContext<JuryContextValue | null>(null);

export function JuryProvider({ children }: { children: React.ReactNode }) {
  const { player } = usePlayer();
  const signalRef = useRef<SignalClient | null>(null);
  const [activeDuty, setActiveDuty] = useState<JuryDuty | null>(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const signal = new SignalClient();
    signalRef.current = signal;
    void signal.connect().then(() => {
      signal.register(player.id, player.displayName, player.elo, player.isPro);
    });

    signal.onMessage((msg) => {
      if (msg.type === "jury_duty") {
        setActiveDuty({
          matchId: String(msg.matchId),
          player1: msg.player1 as MatchContestant,
          player2: msg.player2 as MatchContestant,
          minVotes: Number(msg.minVotes ?? 3),
          totalVotes: 0,
        });
        setVoted(false);
      }
      if (msg.type === "vote_recorded") {
        const mid = String(msg.matchId);
        setActiveDuty((d) =>
          d && d.matchId === mid
            ? { ...d, totalVotes: Number(msg.totalVotes ?? d.totalVotes) }
            : d
        );
      }
      if (msg.type === "match_result") {
        const mid = String(msg.matchId);
        setActiveDuty((d) => (d?.matchId === mid ? null : d));
      }
      if (msg.type === "spectating") {
        setActiveDuty({
          matchId: String(msg.matchId),
          player1: msg.player1 as MatchContestant,
          player2: msg.player2 as MatchContestant,
          minVotes: Number(msg.minVotes ?? 3),
          totalVotes: Number(msg.totalVotes ?? 0),
        });
        setVoted(false);
      }
    });

    return () => {
      signal.disconnect();
      signalRef.current = null;
    };
  }, [player.id, player.displayName, player.elo, player.isPro]);

  const dismissDuty = useCallback(() => setActiveDuty(null), []);

  const connectSpectator = useCallback(async (matchId: string) => {
    signalRef.current?.spectate(matchId);
  }, []);

  const castVote = useCallback((votedForId: string) => {
    setActiveDuty((d) => {
      if (d) signalRef.current?.vote(d.matchId, votedForId);
      return d;
    });
    setVoted(true);
  }, []);

  return (
    <JuryContext.Provider value={{ activeDuty, dismissDuty, connectSpectator }}>
      {children}
      {activeDuty && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <JuryVotePanel
            matchId={activeDuty.matchId}
            player1={activeDuty.player1}
            player2={activeDuty.player2}
            totalVotes={activeDuty.totalVotes}
            minVotes={activeDuty.minVotes}
            onVote={castVote}
            voted={voted}
            compact
          />
          <button
            onClick={dismissDuty}
            className="w-full mt-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </JuryContext.Provider>
  );
}

export function useJury() {
  const ctx = useContext(JuryContext);
  if (!ctx) throw new Error("useJury must be used within JuryProvider");
  return ctx;
}
