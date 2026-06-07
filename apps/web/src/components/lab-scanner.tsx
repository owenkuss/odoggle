"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PdlBar } from "@/components/ui";
import { computePdl, detectDogFace } from "@/lib/pdl";
import { syncPdlToServer } from "@/lib/pdl-sync";
import { appendPdlHistory } from "@/lib/pdl-history";
import { usePlayer } from "@/lib/player-context";
import type { PdlResult } from "@odoggle/shared";

export function LabScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { player, setPdl } = usePlayer();
  const [phase, setPhase] = useState<"idle" | "countdown" | "scanning" | "done">("idle");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<PdlResult | null>(null);

  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      });
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const runScan = useCallback(async () => {
    setPhase("countdown");
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setPhase("scanning");

    const video = videoRef.current;
    if (!video) return;

    let best: PdlResult | null = null;
    for (let frame = 0; frame < 10; frame++) {
      const detection = await detectDogFace(video);
      if (detection) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pdl = computePdl(detection, imageData);
        if (!best || pdl.confidence > best.confidence) best = pdl;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (best) {
      setResult(best);
      setPdl(best);
      appendPdlHistory(best);
      void syncPdlToServer(player.id, best);
      setPhase("done");
    } else {
      setPhase("idle");
    }
  }, [setPdl, player.id]);

  return (
    <div className="max-w-lg mx-auto">
      <video ref={videoRef} className="w-full rounded-xl bg-black aspect-video" muted playsInline />
      {phase === "idle" && (
        <button
          onClick={runScan}
          className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg"
        >
          Start PDL Scan →
        </button>
      )}
      {phase === "countdown" && (
        <div className="mt-6 text-center text-4xl font-bold text-amber-400">{countdown}</div>
      )}
      {phase === "scanning" && (
        <div className="mt-6 text-center text-zinc-400 animate-pulse">Analyzing dog face on-device...</div>
      )}
      {phase === "done" && result && (
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-sm text-zinc-500">Your PDL</div>
            <div className="text-5xl font-bold text-amber-400">{result.composite}</div>
          </div>
          <PdlBar label="Symmetry" value={result.subScores.symmetry} />
          <PdlBar label="Harmony" value={result.subScores.harmony} />
          <PdlBar label="Muzzle" value={result.subScores.muzzle} />
          <PdlBar label="Coat" value={result.subScores.coat} />
          <PdlBar label="Eye Alertness" value={result.subScores.eyeAlertness} />
          <p className="text-xs text-zinc-600 mt-4">Scored on-device. No frames uploaded.</p>
        </div>
      )}
    </div>
  );
}
