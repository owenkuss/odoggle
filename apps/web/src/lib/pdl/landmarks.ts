import type { InferenceSession } from "onnxruntime-web";
import type { DogFaceDetection, DogLandmark } from "@odoggle/shared";
import { LANDMARK_COUNT } from "./scorer";

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

export function generatePseudoLandmarks(bbox: {
  x: number;
  y: number;
  width: number;
  height: number;
}): DogLandmark[] {
  const { x, y, width: w, height: h } = bbox;
  const pts: [number, number][] = [];
  for (let i = 0; i < 7; i++) pts.push([x + w * (0.05 + i * 0.04), y + h * (0.05 + i * 0.02)]);
  for (let i = 0; i < 7; i++) pts.push([x + w * (0.95 - i * 0.04), y + h * (0.05 + i * 0.02)]);
  for (let i = 0; i < 4; i++) pts.push([x + w * (0.28 + i * 0.03), y + h * 0.35]);
  for (let i = 0; i < 4; i++) pts.push([x + w * (0.62 + i * 0.03), y + h * 0.35]);
  pts.push([x + w * 0.5, y + h * 0.42], [x + w * 0.5, y + h * 0.48]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push([x + w * (0.5 + Math.cos(a) * 0.08), y + h * (0.52 + Math.sin(a) * 0.06)]);
  }
  for (let i = 0; i < 14; i++) {
    pts.push([x + w * (0.2 + (i / 13) * 0.6), y + h * (0.65 + Math.sin(i) * 0.05)]);
  }
  return pts.map(([px, py]) => ({ x: px, y: py, visible: true }));
}

export function heuristicDetection(
  source: HTMLVideoElement | HTMLCanvasElement,
  averageBrightness: (imageData: ImageData) => number
): DogFaceDetection | null {
  const w = "videoWidth" in source ? source.videoWidth : source.width;
  const h = "videoHeight" in source ? source.videoHeight : source.height;
  if (!w || !h) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const brightness = averageBrightness(imageData);
  if (brightness < 30 || brightness > 240) return null;

  const cx = 0.5;
  const cy = 0.45;
  const fw = 0.35;
  const fh = 0.4;
  const bbox = { x: cx - fw / 2, y: cy - fh / 2, width: fw, height: fh };
  const landmarks = generatePseudoLandmarks(bbox);
  const faceFill = fw * fh;
  const confidence = faceFill >= 0.12 && faceFill <= 0.5 ? 0.72 : 0.45;

  return { bbox, confidence, landmarks };
}
