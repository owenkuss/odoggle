"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_ELO, generateGuestId } from "@odoggle/shared";
import type { PdlResult, PlayerProfile } from "@odoggle/shared";

const STORAGE_KEY = "odoggle_player";

interface PlayerContextValue {
  player: PlayerProfile;
  setDisplayName: (name: string) => void;
  updateElo: (elo: number, peakElo?: number) => void;
  recordWin: () => void;
  recordLoss: () => void;
  setPdl: (pdl: PdlResult) => void;
  setPro: (isPro: boolean) => void;
  claimProfile: (profile: PlayerProfile) => void;
  gateAccepted: boolean;
  acceptGate: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function loadPlayer(): PlayerProfile {
  if (typeof window === "undefined") {
    return {
      id: "ssr",
      displayName: "Guest",
      elo: DEFAULT_ELO,
      peakElo: DEFAULT_ELO,
      wins: 0,
      losses: 0,
      isPro: false,
      isGuest: true,
    };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw) as PlayerProfile;
  const id = generateGuestId();
  return {
    id,
    displayName: `Guest${id.slice(-4)}`,
    elo: DEFAULT_ELO,
    peakElo: DEFAULT_ELO,
    wins: 0,
    losses: 0,
    isPro: false,
    isGuest: true,
  };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerProfile>(loadPlayer);
  const [gateAccepted, setGateAccepted] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  }, [player]);

  useEffect(() => {
    setGateAccepted(localStorage.getItem("odoggle_gate") === "1");
  }, []);

  const acceptGate = useCallback(() => {
    localStorage.setItem("odoggle_gate", "1");
    setGateAccepted(true);
  }, []);

  const setDisplayName = useCallback((displayName: string) => {
    setPlayer((p) => ({ ...p, displayName }));
  }, []);

  const updateElo = useCallback((elo: number, peakElo?: number) => {
    setPlayer((p) => ({ ...p, elo, peakElo: peakElo ?? Math.max(p.peakElo, elo) }));
  }, []);

  const recordWin = useCallback(() => {
    setPlayer((p) => ({ ...p, wins: p.wins + 1 }));
  }, []);

  const recordLoss = useCallback(() => {
    setPlayer((p) => ({ ...p, losses: p.losses + 1 }));
  }, []);

  const setPdl = useCallback((lastPdl: PdlResult) => {
    setPlayer((p) => ({ ...p, lastPdl }));
  }, []);

  const setPro = useCallback((isPro: boolean) => {
    setPlayer((p) => ({ ...p, isPro }));
  }, []);

  const claimProfile = useCallback((profile: PlayerProfile) => {
    setPlayer(profile);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        player,
        setDisplayName,
        updateElo,
        recordWin,
        recordLoss,
        setPdl,
        setPro,
        claimProfile,
        gateAccepted,
        acceptGate,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
