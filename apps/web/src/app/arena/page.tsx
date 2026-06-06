"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArenaBattle } from "@/components/arena-battle";
import { GateModal } from "@/components/ui";
import { usePlayer } from "@/lib/player-context";
import { PDL_SCAN_TTL_MS } from "@odoggle/shared";

function ArenaContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") ?? undefined;
  const { gateAccepted, acceptGate, player } = usePlayer();
  const pdlFresh =
    player.lastPdl && Date.now() - player.lastPdl.scannedAt < PDL_SCAN_TTL_MS;

  return (
    <>
      {!gateAccepted && <GateModal onAccept={acceptGate} />}
      {gateAccepted && !pdlFresh && (
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <p className="text-zinc-400 mb-4">Run a fresh PDL scan in The Lab before queuing.</p>
          <Link href="/lab" className="text-amber-400 hover:underline">Go to The Lab →</Link>
        </div>
      )}
      {gateAccepted && pdlFresh && <ArenaBattle roomCode={roomCode} />}
    </>
  );
}

export default function ArenaPage() {
  const { player } = usePlayer();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">1v1 Arena</h1>
      <p className="text-zinc-500 text-center mb-2">Ranked matchmaking · ELO on the line</p>
      <div className="text-center text-sm text-zinc-600 mb-8">
        {player.displayName} · {player.elo} ELO · {player.wins}W-{player.losses}L
      </div>
      <Suspense fallback={<div className="text-center text-zinc-500">Loading...</div>}>
        <ArenaContent />
      </Suspense>
    </div>
  );
}
