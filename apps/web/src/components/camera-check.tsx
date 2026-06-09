"use client";

import { useEffect, useRef, useState } from "react";
import type { PdlResult } from "@odoggle/shared";
import { isHeuristicMode, loadModels } from "@/lib/pdl";
import { useLivePdlScan } from "@/lib/pdl/use-live-pdl-scan";

interface CameraCheckProps {
  onPass: (pdl: PdlResult, stream: MediaStream) => void;
  continueLabel?: string;
}

export function CameraCheck({ onPass, continueLabel = "Continue →" }: CameraCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepStreamRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [usingHeuristic, setUsingHeuristic] = useState(true);

  const { livePdl, framingHint, framingOk } = useLivePdlScan(
    videoRef,
    overlayRef,
    cameraReady
  );

  useEffect(() => {
    let stream: MediaStream;
    void loadModels().then(() => setUsingHeuristic(isHeuristicMode()));

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        stream = s;
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().then(() => setCameraReady(true));
        }
      })
      .catch(() => setCameraReady(false));

    return () => {
      if (!keepStreamRef.current) {
        stream?.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/10">
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
        {livePdl && (
          <div className="absolute top-3 right-3 glass-card px-3 py-2 text-center min-w-[4.5rem] border-amber-500/30">
            <div className="text-[10px] uppercase tracking-widest text-muted">Live PDL</div>
            <div className="text-3xl font-black stat-value tabular-nums leading-none">
              {livePdl.composite.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      <p
        className={`mt-3 text-center text-sm ${
          framingOk ? "text-teal" : "text-muted"
        }`}
      >
        {framingHint}
      </p>

      {usingHeuristic && cameraReady && (
        <p className="text-xs text-center text-amber-400/70 mt-1">
          Heuristic mode — train ONNX models for maximum accuracy
        </p>
      )}

      {framingOk && livePdl && streamRef.current && (
        <button
          onClick={() => {
            keepStreamRef.current = true;
            onPass(livePdl, streamRef.current!);
          }}
          className="btn-accent w-full mt-4"
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}
