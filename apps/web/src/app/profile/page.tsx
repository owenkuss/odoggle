"use client";

import Link from "next/link";
import { getRankTitle, PDL_SCAN_TTL_MS } from "@odoggle/shared";
import { PdlBar } from "@/components/ui";
import { usePlayer } from "@/lib/player-context";

export default function ProfilePage() {
  const { player } = usePlayer();
  const rank = getRankTitle(player.elo);
  const pdlFresh =
    player.lastPdl && Date.now() - player.lastPdl.scannedAt < PDL_SCAN_TTL_MS;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Profile</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-2xl font-bold">{player.displayName}</div>
            <div className="text-amber-400 text-sm mt-1">{rank}</div>
          </div>
          <div className="flex gap-2">
            {player.isPro && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Pro</span>
            )}
            {player.isGuest && (
              <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Guest</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div>
            <div className="text-2xl font-bold text-amber-400">{player.elo}</div>
            <div className="text-xs text-zinc-500">ELO</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{player.peakElo}</div>
            <div className="text-xs text-zinc-500">Peak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{player.wins}-{player.losses}</div>
            <div className="text-xs text-zinc-500">W-L</div>
          </div>
        </div>

        {!player.isGuest ? null : (
          <p className="text-xs text-zinc-600 text-center">
            Link Google (top-right) to save rank across devices.
          </p>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Latest PDL Scan</h2>
        {player.lastPdl ? (
          <>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-amber-400">{player.lastPdl.composite}</div>
              {!pdlFresh && (
                <p className="text-xs text-red-400 mt-1">Expired — rescan in The Lab before arena</p>
              )}
            </div>
            <PdlBar label="Symmetry" value={player.lastPdl.subScores.symmetry} />
            <PdlBar label="Harmony" value={player.lastPdl.subScores.harmony} />
            <PdlBar label="Muzzle" value={player.lastPdl.subScores.muzzle} />
            <PdlBar label="Coat" value={player.lastPdl.subScores.coat} />
            <PdlBar label="Eye Alertness" value={player.lastPdl.subScores.eyeAlertness} />
          </>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-4">
            No scan yet.{" "}
            <Link href="/lab" className="text-amber-400 hover:underline">Run one in The Lab →</Link>
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/lab" className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg text-sm">
          The Lab
        </Link>
        <Link href="/arena" className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg text-sm">
          Arena
        </Link>
      </div>
    </div>
  );
}
