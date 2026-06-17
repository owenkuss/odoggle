import type { DogFaceDetection, DogLandmark } from "@odoggle/shared";
import { FACE_OUTLINE_INDICES, LANDMARK_GROUPS } from "./scorer";

interface Point {
  x: number;
  y: number;
}

function toCanvasPoint(lm: DogLandmark, w: number, h: number): Point {
  return { x: lm.x * w, y: lm.y * h };
}

function collectPoints(
  landmarks: DogLandmark[],
  indices: readonly number[],
  w: number,
  h: number
): Point[] {
  const pts: Point[] = [];
  for (const i of indices) {
    const lm = landmarks[i];
    if (lm?.visible) pts.push(toCanvasPoint(lm, w, h));
  }
  return pts;
}

/** Smooth closed curve through landmark points. */
function strokeSmoothClosedPath(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  if (pts.length < 3) return;

  ctx.beginPath();
  const n = pts.length;
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start.x, start.y);

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const end = mid(curr, next);
    ctx.quadraticCurveTo(curr.x, curr.y, end.x, end.y);
  }

  ctx.closePath();
  ctx.stroke();
}

function strokeSmoothOpenPath(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  if (pts.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }

  const last = pts[pts.length - 1];
  ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
  ctx.stroke();
}

/** Draw dog-face contour + feature guides on a canvas aligned to the video. */
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

  const { landmarks, confidence } = detection;
  const locked = confidence > 0.55;
  const stroke = locked ? "rgba(251, 191, 36, 0.95)" : "rgba(148, 163, 184, 0.85)";
  const glow = locked ? "rgba(251, 191, 36, 0.25)" : "rgba(148, 163, 184, 0.15)";

  const outline = collectPoints(landmarks, FACE_OUTLINE_INDICES, w, h);

  if (outline.length >= 3) {
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = glow;
    strokeSmoothClosedPath(ctx, outline);

    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    strokeSmoothClosedPath(ctx, outline);
  }

  const leftEye = collectPoints(landmarks, LANDMARK_GROUPS.leftEye, w, h);
  const rightEye = collectPoints(landmarks, LANDMARK_GROUPS.rightEye, w, h);
  const nose = collectPoints(landmarks, LANDMARK_GROUPS.noseRing, w, h);

  ctx.lineWidth = 1.25;
  ctx.strokeStyle = locked ? "rgba(45, 212, 191, 0.7)" : "rgba(45, 212, 191, 0.45)";

  if (leftEye.length >= 3) strokeSmoothClosedPath(ctx, leftEye);
  if (rightEye.length >= 3) strokeSmoothClosedPath(ctx, rightEye);
  if (nose.length >= 3) strokeSmoothClosedPath(ctx, nose);

  const bridge = collectPoints(landmarks, LANDMARK_GROUPS.noseBridge, w, h);
  if (bridge.length >= 2) strokeSmoothOpenPath(ctx, bridge);
}
