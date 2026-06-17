import type { InferenceSession } from "onnxruntime-web";
import type { DogFaceDetection, DogLandmark } from "@odoggle/shared";
import { LANDMARK_COUNT } from "./scorer";

let prevHeuristicBbox: { x: number; y: number; width: number; height: number } | null = null;

export async function runLandmarkModel(
  source: HTMLVideoElement | HTMLCanvasElement,
  bbox: { x: number; y: number; width: number; height: number },
  size: number,
  landmarkSession: InferenceSession,
  preprocess: (source: HTMLVideoElement | HTMLCanvasElement, size: number) => import("onnxruntime-web").Tensor
): Promise<DogLandmark[]> {
  const canvas = document.createElement("canvas");
  const sw = "videoWidth" in source ? source.videoWidth : source.width;
  const sh = "videoHeight" in source ? source.videoHeight : source.height;
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  const crop = document.createElement("canvas");
  crop.width = size;
  crop.height = size;
  const cropCtx = crop.getContext("2d")!;
  cropCtx.drawImage(
    canvas,
    bbox.x * sw,
    bbox.y * sh,
    bbox.width * sw,
    bbox.height * sh,
    0,
    0,
    size,
    size
  );

  const input = preprocess(crop, size);
  const result = await landmarkSession.run({ input });
  const coords = Object.values(result)[0].data as Float32Array;
  const landmarks: DogLandmark[] = [];
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    landmarks.push({
      x: bbox.x + (coords[i * 2] / size) * bbox.width,
      y: bbox.y + (coords[i * 2 + 1] / size) * bbox.height,
      visible: coords[i * 2] >= 0,
    });
  }
  return landmarks;
}

function lm(x: number, y: number): DogLandmark {
  return { x, y, visible: true };
}

/** Dog-shaped landmark layout from a bounding box (heuristic / fallback mode). */
export function generatePseudoLandmarks(bbox: {
  x: number;
  y: number;
  width: number;
  height: number;
}): DogLandmark[] {
  const { x, y, width: w, height: h } = bbox;
  const landmarks: DogLandmark[] = new Array(LANDMARK_COUNT);

  // Left ear (0–6): arc along top-left
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    landmarks[i] = lm(x + w * (0.08 + t * 0.18), y + h * (0.06 + t * 0.22));
  }

  // Right ear (7–13): arc along top-right
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    landmarks[7 + i] = lm(x + w * (0.92 - t * 0.18), y + h * (0.06 + t * 0.22));
  }

  // Eyes (14–21)
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    landmarks[14 + i] = lm(x + w * (0.28 + t * 0.1), y + h * 0.36);
  }
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    landmarks[18 + i] = lm(x + w * (0.62 + t * 0.1), y + h * 0.36);
  }

  // Nose bridge (22–23)
  landmarks[22] = lm(x + w * 0.48, y + h * 0.44);
  landmarks[23] = lm(x + w * 0.52, y + h * 0.48);

  // Nose ring (24–31)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    landmarks[24 + i] = lm(
      x + w * (0.5 + Math.cos(a) * 0.07),
      y + h * (0.5 + Math.sin(a) * 0.05)
    );
  }

  // Jaw / chin (32–45): left cheek → chin → right cheek
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const jawX = x + w * (0.14 + t * 0.72);
    const jawY = y + h * (0.58 + Math.sin(t * Math.PI) * 0.22);
    landmarks[32 + i] = lm(jawX, jawY);
  }

  return landmarks;
}

function estimateFaceBBox(
  imageData: ImageData,
  w: number,
  h: number
): { x: number; y: number; width: number; height: number } | null {
  const gray = new Float32Array(w * h);
  const data = imageData.data;

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }

  const edge = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = gray[i + 1] - gray[i - 1];
      const gy = gray[i + w] - gray[i - w];
      edge[i] = Math.hypot(gx, gy);
    }
  }

  let bestScore = 0;
  let best: { x: number; y: number; width: number; height: number } | null = null;

  for (let fh = 0.22; fh <= 0.52; fh += 0.06) {
    const fw = fh * 0.92;
    for (let cy = 0.28; cy <= 0.58; cy += 0.05) {
      for (let cx = 0.32; cx <= 0.68; cx += 0.06) {
        const x0 = Math.max(1, Math.floor((cx - fw / 2) * w));
        const y0 = Math.max(1, Math.floor((cy - fh / 2) * h));
        const x1 = Math.min(w - 2, Math.floor((cx + fw / 2) * w));
        const y1 = Math.min(h - 2, Math.floor((cy + fh / 2) * h));

        let sum = 0;
        let count = 0;
        for (let py = y0; py < y1; py += 2) {
          for (let px = x0; px < x1; px += 2) {
            sum += edge[py * w + px];
            count++;
          }
        }

        const avg = count ? sum / count : 0;
        const centerBias = 1 - Math.hypot(cx - 0.5, cy - 0.44) * 0.65;
        const score = avg * centerBias;

        if (score > bestScore) {
          bestScore = score;
          best = { x: cx - fw / 2, y: cy - fh / 2, width: fw, height: fh };
        }
      }
    }
  }

  return bestScore > 8 ? best : null;
}

function smoothHeuristicBbox(
  next: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  if (!prevHeuristicBbox) {
    prevHeuristicBbox = next;
    return next;
  }
  const t = 0.32;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  prevHeuristicBbox = {
    x: lerp(prevHeuristicBbox.x, next.x),
    y: lerp(prevHeuristicBbox.y, next.y),
    width: lerp(prevHeuristicBbox.width, next.width),
    height: lerp(prevHeuristicBbox.height, next.height),
  };
  return prevHeuristicBbox;
}

export function resetHeuristicTracking(): void {
  prevHeuristicBbox = null;
}

export function heuristicDetection(
  source: HTMLVideoElement | HTMLCanvasElement,
  averageBrightness: (imageData: ImageData) => number
): DogFaceDetection | null {
  const w = "videoWidth" in source ? source.videoWidth : source.width;
  const h = "videoHeight" in source ? source.videoHeight : source.height;
  if (!w || !h) return null;

  const sampleW = 160;
  const sampleH = Math.max(90, Math.round((h / w) * sampleW));

  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, sampleW, sampleH);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const brightness = averageBrightness(imageData);
  if (brightness < 30 || brightness > 240) return null;

  const tracked = estimateFaceBBox(imageData, sampleW, sampleH);
  const fallback = { x: 0.325, y: 0.25, width: 0.35, height: 0.42 };
  const raw = tracked ?? prevHeuristicBbox ?? fallback;
  const bbox = smoothHeuristicBbox(raw);

  const landmarks = generatePseudoLandmarks(bbox);
  const faceFill = bbox.width * bbox.height;
  const confidence = tracked
    ? Math.min(0.82, 0.55 + faceFill * 0.5)
    : faceFill >= 0.12 && faceFill <= 0.5
      ? 0.48
      : 0.4;

  return { bbox, confidence, landmarks };
}
