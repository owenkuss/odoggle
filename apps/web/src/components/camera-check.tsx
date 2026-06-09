"use client";

import { useEffect, useRef, useState } from "react";
import { computePdl, detectDogFace, getFrameBrightness, validateCameraFrame } from "@/lib/pdl";
import type { PdlResult } from "@odoggle/shared";

interface CameraCheckProps {
  onPass: (pdl: PdlResult) => void;
  continueLabel?: string;
}

export function CameraCheck({ onPass, continueLabel = "Continue →" }: CameraCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Starting camera...");
  const [passed, setPassed] = useState(false);
  const [pdlResult, setPdlResult] = useState<PdlResult | null>(null);

  useEffect(() => {
    let stream: MediaStream;
    let interval: ReturnType<typeof setInterval>;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        interval = setInterval(async () => {
          const video = videoRef.current;
          if (!video) return;
          const brightness = getFrameBrightness(video);
          const detection = await detectDogFace(video);
          const result = validateCameraFrame(detection, brightness);
          if (result.ok && detection) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pdl = computePdl(detection, imageData);
            setPdlResult(pdl);
            setStatus(`Camera check passed · PDL ${pdl.composite}`);
            setPassed(true);
            clearInterval(interval);
          } else {
            setStatus(result.reason ?? "Adjust framing...");
          }
        }, 500);
      } catch {
        setStatus("Camera permission denied.");
      }
    }

    start();
    return () => {
      clearInterval(interval);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <video ref={videoRef} className="w-full rounded-xl bg-black aspect-video" muted playsInline />
      <p className={`mt-4 text-center ${passed ? "text-green-400" : "text-zinc-400"}`}>{status}</p>
      {passed && pdlResult && (
        <button
          onClick={() => onPass(pdlResult)}
          className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg"
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}
