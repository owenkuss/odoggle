"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PDL_SCAN_TTL_MS, getRankTier, type PdlResult } from "@odoggle/shared";
import { PdlBar } from "@/components/ui";
import { loadPdlHistory } from "@/lib/pdl-history";
import { usePlayer } from "@/lib/player-context";

function formatScanDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const { player } = usePlayer();
  const [history, setHistory] = useState<PdlResult[]>([]);
  const tier = getRankTier(player.elo);
  const pdlFresh =
    player.lastPdl && Date.now() - player.lastPdl.scannedAt < PDL_SCAN_TTL_MS;

  useEffect(() => {
    setHistory(loadPdlHistory());
  }, [player.lastPdl?.scannedAt]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center text-hero">Your Profile</h1>
      <p className="text-muted text-center mb-8">Stats, PDL history, and ladder tier</p>

      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-2xl font-bold">{player.displayName}</div>
            <div className="text-accent-bright text-sm mt-1">
              {tier.emoji} {tier.title}
            </div>
          </div>
          <div className="flex gap-2">
            {player.isPro && (
              <span className="text-xs bg-purple-500/20 text-pro-bright px-2 py-1 rounded">Pro</span>
            )}
            {player.isGuest && (
              <span className="text-xs bg-white/5 text-muted px-2 py-1 rounded">Guest</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div>
            <div className="text-2xl font-bold stat-value tabular-nums">{player.elo}</div>
            <div className="text-xs text-muted">ELO</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{player.peakElo}</div>
            <div className="text-xs text-muted">Peak</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">
              {player.wins}-{player.losses}
            </div>
            <div className="text-xs text-muted">W-L</div>
          </div>
        </div>

        <Link href="/leaderboard" className="block text-center text-sm text-accent-bright hover:underline">
          View global rank →
        </Link>

        {player.isGuest && (
          <p className="text-xs text-muted text-center mt-4">
            Link Google (top-right) to save rank across devices.
          </p>
        )}
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-4">Latest PDL Scan</h2>
        {!player.isPro ? (
          <p className="text-muted text-sm text-center py-4">
            The Lab is a Pro feature.{" "}
            <Link href="/pricing" className="text-accent-bright hover:underline">
              Get lifetime Pro →
            </Link>
          </p>
        ) : player.lastPdl ? (
          <>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold stat-value">{player.lastPdl.composite}</div>
              {!pdlFresh && (
                <p className="text-xs text-arena-bright mt-1">Stale — rescan in The Lab or at arena join</p>
              )}
            </div>
            <PdlBar label="Symmetry" value={player.lastPdl.subScores.symmetry} />
            <PdlBar label="Harmony" value={player.lastPdl.subScores.harmony} />
            <PdlBar label="Muzzle" value={player.lastPdl.subScores.muzzle} />
            <PdlBar label="Coat" value={player.lastPdl.subScores.coat} />
            <PdlBar label="Eye Alertness" value={player.lastPdl.subScores.eyeAlertness} />
          </>
        ) : (
          <p className="text-muted text-sm text-center py-4">
            No scan yet.{" "}
            <Link href="/lab" className="text-accent-bright hover:underline">
              Run one in The Lab →
            </Link>
          </p>
        )}
      </div>

      {player.isPro && history.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold mb-4">Scan history</h2>
          <ul className="space-y-2">
            {history.map((scan) => (
              <li
                key={scan.scannedAt}
                className="flex items-center justify-between text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0"
              >
                <span className="text-muted">{formatScanDate(scan.scannedAt)}</span>
                <span className="font-semibold text-accent-bright tabular-nums">{scan.composite}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        {player.isPro ? (
          <Link href="/lab" className="btn-ghost flex-1 text-center text-sm py-3">
            The Lab
          </Link>
        ) : (
          <Link href="/pricing" className="btn-ghost flex-1 text-center text-sm py-3">
            Get Pro
          </Link>
        )}
        <Link href="/arena" className="btn-accent flex-1 text-center text-sm py-3">
          Arena
        </Link>
      </div>
    </div>
  );
}
