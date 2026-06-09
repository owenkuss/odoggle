import type { DogFaceDetection } from "@odoggle/shared";

/** Draw face box + landmark dots on a canvas aligned to the video. */
export function drawDetectionOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  detection: DogFaceDetection | null
): void {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);
  if (!detection) return;

  const { bbox, landmarks, confidence } = detection;
  const bx = bbox.x * w;
  const by = bbox.y * h;
  const bw = bbox.width * w;
  const bh = bbox.height * h;

  ctx.strokeStyle = confidence > 0.6 ? "rgba(251, 191, 36, 0.9)" : "rgba(148, 148, 168, 0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);

  for (const lm of landmarks) {
    if (!lm.visible) continue;
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(45, 212, 191, 0.85)";
    ctx.fill();
  }
}
