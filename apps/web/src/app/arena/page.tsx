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
  const needsFreshPdl = player.isPro;

  return (
    <>
      {!gateAccepted && <GateModal onAccept={acceptGate} />}
      {gateAccepted && needsFreshPdl && !pdlFresh && (
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <p className="text-zinc-400 mb-4">Pro players need a fresh Lab scan before queuing.</p>
          <Link href="/lab" className="text-amber-400 hover:underline">
            Go to The Lab →
          </Link>
        </div>
      )}
      {gateAccepted && (!needsFreshPdl || pdlFresh) && <ArenaBattle roomCode={roomCode} />}
    </>
  );
}

export default function ArenaPage() {
  const { player } = usePlayer();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">1v1 Arena</h1>
      <p className="text-zinc-500 text-center mb-2">
        Free for everyone · Camera check on join · ELO on the line
      </p>
      <div className="text-center text-sm text-zinc-600 mb-8">
        {player.displayName} · {player.elo} ELO · {player.wins}W-{player.losses}L
        {player.isPro && <span className="text-purple-400 ml-2">· Pro</span>}
      </div>
      <Suspense fallback={<div className="text-center text-zinc-500">Loading...</div>}>
        <ArenaContent />
      </Suspense>
    </div>
  );
}
