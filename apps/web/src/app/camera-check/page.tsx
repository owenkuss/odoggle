"use client";

import { useRouter } from "next/navigation";
import { CameraCheck } from "@/components/camera-check";
import { GateModal } from "@/components/ui";
import { usePlayer } from "@/lib/player-context";

export default function CameraCheckPage() {
  const router = useRouter();
  const { gateAccepted, acceptGate } = usePlayer();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">Camera Check</h1>
      <p className="text-zinc-500 text-center mb-8">Frame your dog before entering the arena.</p>
      {!gateAccepted && <GateModal onAccept={acceptGate} />}
      {gateAccepted && <CameraCheck onPass={() => router.push("/lab")} />}
    </div>
  );
}
