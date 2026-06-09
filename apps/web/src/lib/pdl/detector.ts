import type { InferenceSession } from "onnxruntime-web";
import * as ort from "onnxruntime-web";
import type { DogFaceDetection } from "@odoggle/shared";
import { heuristicDetection, runLandmarkModel } from "./landmarks";

export interface ModelManifest {
  version: string;
  localizer: string;
  landmarks: string;
  localizerInputSize: number;
  landmarkInputSize: number;
}

let localizerSession: InferenceSession | null = null;
let landmarkSession: InferenceSession | null = null;
let manifest: ModelManifest | null = null;
let modelsFailed = false;

function preprocess(
  source: HTMLVideoElement | HTMLCanvasElement,
  size: number
): ort.Tensor {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const float32 = new Float32Array(3 * size * size);
  for (let i = 0; i < size * size; i++) {
    float32[i] = data[i * 4] / 255;
    float32[size * size + i] = data[i * 4 + 1] / 255;
    float32[2 * size * size + i] = data[i * 4 + 2] / 255;
  }
  return new ort.Tensor("float32", float32, [1, 3, size, size]);
}

function averageBrightness(imageData: ImageData): number {
  const { data } = imageData;
  let sum = 0;
  const step = 16;
  for (let i = 0; i < data.length; i += 4 * step) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (data.length / (4 * step));
}

export function isHeuristicMode(): boolean {
  return modelsFailed || !localizerSession || !landmarkSession;
}

export async function loadModels(basePath = "/models"): Promise<ModelManifest> {
  if (manifest) return manifest;

  const res = await fetch(`${basePath}/manifest.json`);
  manifest = (await res.json()) as ModelManifest;

  if (modelsFailed) return manifest;

  try {
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
    localizerSession = await ort.InferenceSession.create(`${basePath}/${manifest.localizer}`, {
      executionProviders: ["webgl", "wasm"],
    });
    landmarkSession = await ort.InferenceSession.create(`${basePath}/${manifest.landmarks}`, {
      executionProviders: ["webgl", "wasm"],
    });
  } catch {
    modelsFailed = true;
    localizerSession = null;
    landmarkSession = null;
  }

  return manifest;
}

export async function detectDogFace(
  source: HTMLVideoElement | HTMLCanvasElement
): Promise<DogFaceDetection | null> {
  await loadModels();

  if (!localizerSession || !landmarkSession) {
    return heuristicDetection(source, averageBrightness);
  }

  try {
    const m = manifest!;
    const input = preprocess(source, m.localizerInputSize);
    const locResult = await localizerSession.run({ input });
    const output = Object.values(locResult)[0].data as Float32Array;
    const [cx, cy, w, h, conf] = output;
    if (conf < 0.5) return heuristicDetection(source, averageBrightness);

    const bbox = { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
    const landmarks = await runLandmarkModel(
      source,
      bbox,
      m.landmarkInputSize,
      landmarkSession,
      preprocess
    );
    return { bbox, confidence: conf, landmarks };
  } catch {
    return heuristicDetection(source, averageBrightness);
  }
}

export function validateCameraFrame(
  detection: DogFaceDetection | null,
  brightness: number
): { ok: boolean; reason?: string } {
  if (!detection) return { ok: false, reason: "No dog face detected. Center your dog in frame." };
  if (detection.confidence < 0.45) return { ok: false, reason: "Dog face unclear. Move closer or improve lighting." };
  const fill = detection.bbox.width * detection.bbox.height;
  if (fill < 0.12) return { ok: false, reason: "Dog too far. Fill 40–70% of the frame." };
  if (fill > 0.55) return { ok: false, reason: "Dog too close. Step back slightly." };
  if (brightness < 40) return { ok: false, reason: "Too dark. Add more light." };
  if (brightness > 230) return { ok: false, reason: "Too bright. Reduce backlight." };
  return { ok: true };
}

export function getFrameBrightness(source: HTMLVideoElement | HTMLCanvasElement): number {
  const w = "videoWidth" in source ? source.videoWidth : source.width;
  const h = "videoHeight" in source ? source.videoHeight : source.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(w, 320);
  canvas.height = Math.min(h, 240);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return averageBrightness(ctx.getImageData(0, 0, canvas.width, canvas.height));
}
