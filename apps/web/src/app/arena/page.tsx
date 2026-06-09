"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArenaBattle } from "@/components/arena-battle";
import { GateModal } from "@/components/ui";
import { usePlayer } from "@/lib/player-context";

function ArenaContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") ?? undefined;
  const { gateAccepted, acceptGate } = usePlayer();

  return (
    <>
      {!gateAccepted && <GateModal onAccept={acceptGate} />}
      {gateAccepted && <ArenaBattle roomCode={roomCode} />}
    </>
  );
}

export default function ArenaPage() {
  const { player } = usePlayer();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">1v1 Arena</h1>
      <p className="text-zinc-500 text-center mb-2">
        Free for everyone · PDL scored on join · winner by dog rating
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
