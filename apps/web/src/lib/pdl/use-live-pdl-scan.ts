"use client";

import { useEffect, useRef, useState } from "react";
import type { DogFaceDetection, PdlResult } from "@odoggle/shared";
import {
  computePdl,
  detectDogFace,
  drawDetectionOverlay,
  getFrameBrightness,
  validateCameraFrame,
} from "@/lib/pdl";
import { smoothPdlResult } from "@/lib/pdl/smooth";
import { resetDetectionSmoothing, smoothDetection } from "@/lib/pdl/smooth-detection";

const SCAN_INTERVAL_MS = 280;

export interface LivePdlScanState {
  livePdl: PdlResult | null;
  framingHint: string;
  framingOk: boolean;
  detection: DogFaceDetection | null;
}

export function useLivePdlScan(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  overlayRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean
): LivePdlScanState {
  const smoothedRef = useRef<PdlResult | null>(null);
  const [livePdl, setLivePdl] = useState<PdlResult | null>(null);
  const [framingHint, setFramingHint] = useState("Point camera at your dog's face…");
  const [framingOk, setFramingOk] = useState(false);
  const [detection, setDetection] = useState<DogFaceDetection | null>(null);

  useEffect(() => {
    if (!enabled) {
      smoothedRef.current = null;
      resetDetectionSmoothing();
      setLivePdl(null);
      setFramingOk(false);
      setDetection(null);
      return;
    }

    let active = true;

    const tick = async () => {
      if (!active) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        setTimeout(tick, SCAN_INTERVAL_MS);
        return;
      }

      const brightness = getFrameBrightness(video);
      const rawDet = await detectDogFace(video);
      if (!active) return;

      const det = rawDet ? smoothDetection(rawDet) : null;
      setDetection(det);
      if (overlayRef.current) {
        drawDetectionOverlay(overlayRef.current, video, det);
      }

      const frameCheck = validateCameraFrame(det, brightness);
      if (!frameCheck.ok) {
        setFramingOk(false);
        setFramingHint(frameCheck.reason ?? "Adjust framing…");
        setTimeout(tick, SCAN_INTERVAL_MS);
        return;
      }

      setFramingOk(true);
      setFramingHint("Face locked — hold steady");

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const raw = computePdl(det!, imageData);
      const smoothed = smoothPdlResult(smoothedRef.current, raw);
      smoothedRef.current = smoothed;
      setLivePdl({ ...smoothed });
      setTimeout(tick, SCAN_INTERVAL_MS);
    };

    void tick();
    return () => {
      active = false;
    };
  }, [enabled, videoRef, overlayRef]);

  return { livePdl, framingHint, framingOk, detection };
}
