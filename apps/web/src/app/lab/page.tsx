"use client";

import Link from "next/link";
import { LabScanner } from "@/components/lab-scanner";
import { ProGate } from "@/components/pro-gate";
import { GateModal } from "@/components/ui";
import { usePlayer } from "@/lib/player-context";

export default function LabPage() {
  const { gateAccepted, acceptGate, player } = usePlayer();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">The Lab</h1>
      <p className="text-zinc-500 text-center mb-8">
        {player.isPro
          ? "Live PDL scan — rating updates as your dog stays in frame."
          : "Pro members only · lifetime access unlocks The Lab."}
      </p>
      {!gateAccepted && <GateModal onAccept={acceptGate} />}
      {gateAccepted && (
        <ProGate>
          <LabScanner />
          {player.lastPdl && (
            <div className="mt-6 text-center">
              <Link href="/arena" className="text-amber-400 hover:underline">
                Enter Arena with this PDL →
              </Link>
            </div>
          )}
        </ProGate>
      )}
    </div>
  );
}
