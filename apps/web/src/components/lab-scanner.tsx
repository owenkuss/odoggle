"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PdlBar } from "@/components/ui";
import {
  computePdl,
  detectDogFace,
  drawDetectionOverlay,
  getFrameBrightness,
  loadModels,
  isHeuristicMode,
  smoothPdlResult,
  validateCameraFrame,
} from "@/lib/pdl";
import { syncPdlToServer } from "@/lib/pdl-sync";
import { appendPdlHistory } from "@/lib/pdl-history";
import { usePlayer } from "@/lib/player-context";
import type { PdlResult } from "@odoggle/shared";

const SCAN_INTERVAL_MS = 280;

export function LabScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const smoothedRef = useRef<PdlResult | null>(null);
  const bestRef = useRef<PdlResult | null>(null);
  const scanningRef = useRef(false);

  const { player, setPdl } = usePlayer();
  const [livePdl, setLivePdl] = useState<PdlResult | null>(null);
  const [framingHint, setFramingHint] = useState("Point camera at your dog's face…");
  const [modelsReady, setModelsReady] = useState(false);
  const [usingHeuristic, setUsingHeuristic] = useState(true);
  const [locked, setLocked] = useState<PdlResult | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream;
    void loadModels().then(() => {
      setModelsReady(true);
      setUsingHeuristic(isHeuristicMode());
    });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
      })
      .catch(() => setFramingHint("Camera permission denied."));

    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (!scanning || locked) return;

    scanningRef.current = true;

    const tick = async () => {
      if (!scanningRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        setTimeout(tick, SCAN_INTERVAL_MS);
        return;
      }

      const brightness = getFrameBrightness(video);
      const detection = await detectDogFace(video);

      if (overlayRef.current) {
        drawDetectionOverlay(overlayRef.current, video, detection);
      }

      const frameCheck = validateCameraFrame(detection, brightness);
      if (!frameCheck.ok) {
        setFramingHint(frameCheck.reason ?? "Adjust framing…");
        setTimeout(tick, SCAN_INTERVAL_MS);
        return;
      }

      setFramingHint("Face locked — hold steady");

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const raw = computePdl(detection!, imageData);
      const smoothed = smoothPdlResult(smoothedRef.current, raw);
      smoothedRef.current = smoothed;

      if (!bestRef.current || raw.confidence > bestRef.current.confidence) {
        bestRef.current = raw;
      }

      setLivePdl({ ...smoothed });
      setTimeout(tick, SCAN_INTERVAL_MS);
    };

    void tick();
    return () => {
      scanningRef.current = false;
    };
  }, [scanning, locked]);

  const lockScore = useCallback(() => {
    const final = bestRef.current ?? smoothedRef.current ?? livePdl;
    if (!final) return;
    setLocked(final);
    setScanning(false);
    setPdl(final);
    appendPdlHistory(final);
    void syncPdlToServer(player.id, final);
  }, [livePdl, player.id, setPdl]);

  const rescan = useCallback(() => {
    smoothedRef.current = null;
    bestRef.current = null;
    setLocked(null);
    setLivePdl(null);
    setScanning(true);
  }, []);

  const display = locked ?? livePdl;

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/10 shadow-[var(--glow-amber)]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {scanning && !locked && display && (
          <div className="absolute top-3 right-3 glass-card px-3 py-2 text-center min-w-[4.5rem] border-amber-500/30">
            <div className="text-[10px] uppercase tracking-widest text-muted">Live PDL</div>
            <div className="text-3xl font-black stat-value tabular-nums leading-none">
              {display.composite.toFixed(1)}
            </div>
          </div>
        )}

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-accent-bright mb-1">Locked</div>
              <div className="text-6xl font-black stat-value">{locked.composite.toFixed(1)}</div>
            </div>
          </div>
        )}
      </div>

      <p
        className={`mt-3 text-center text-sm ${
          framingHint.includes("locked") || framingHint.includes("steady")
            ? "text-teal"
            : "text-muted"
        }`}
      >
        {locked ? "Score saved to your profile" : framingHint}
      </p>

      {!modelsReady && (
        <p className="text-xs text-center text-muted mt-1">Loading face models…</p>
      )}
      {modelsReady && usingHeuristic && (
        <p className="text-xs text-center text-amber-400/80 mt-1">
          Using heuristic mode — train ONNX models for UMax-level accuracy (see ml/README.md)
        </p>
      )}

      {!locked && scanning && (
        <button
          onClick={lockScore}
          disabled={!livePdl}
          className="btn-accent w-full mt-4 disabled:opacity-40"
        >
          {livePdl ? "Lock in this PDL →" : "Waiting for face…"}
        </button>
      )}

      {locked && (
        <div className="flex gap-3 mt-4">
          <button onClick={rescan} className="btn-ghost flex-1">
            Scan again
          </button>
          <Link href="/arena" className="btn-arena flex-1 text-center">
            Enter Arena →
          </Link>
        </div>
      )}

      {display && (
        <div className="glass-card p-6 mt-6">
          <div className="text-center mb-4">
            <div className="text-sm text-muted">{locked ? "Your PDL" : "Live breakdown"}</div>
            {!locked && (
              <div className="text-xs text-muted mt-1">Updates in real time as you hold the frame</div>
            )}
          </div>
          <PdlBar label="Symmetry" value={display.subScores.symmetry} />
          <PdlBar label="Harmony" value={display.subScores.harmony} />
          <PdlBar label="Muzzle" value={display.subScores.muzzle} />
          <PdlBar label="Coat" value={display.subScores.coat} />
          <PdlBar label="Eye Alertness" value={display.subScores.eyeAlertness} />
          <p className="text-xs text-muted mt-4">Scored on-device. No frames uploaded.</p>
        </div>
      )}
    </div>
  );
}
