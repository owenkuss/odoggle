import type { DogFaceDetection, DogLandmark, PdlResult, PdlSubScores } from "@odoggle/shared";
import { PDL_WEIGHTS } from "@odoggle/shared";
import { pdlToBand } from "@odoggle/shared";

export const LANDMARK_COUNT = 46;

// DogFLW landmark group indices (0-based)
export const LANDMARK_GROUPS = {
  leftEar: [0, 1, 2, 3, 4, 5, 6],
  rightEar: [7, 8, 9, 10, 11, 12, 13],
  leftEye: [14, 15, 16, 17],
  rightEye: [18, 19, 20, 21],
  noseBridge: [22, 23],
  noseRing: [24, 25, 26, 27, 28, 29, 30, 31],
  mouthChin: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
} as const;

/** Closed perimeter order for the live face outline overlay. */
export const FACE_OUTLINE_INDICES: readonly number[] = [
  ...LANDMARK_GROUPS.leftEar,
  ...LANDMARK_GROUPS.mouthChin,
  ...[...LANDMARK_GROUPS.rightEar].reverse(),
];

export function dist(a: DogLandmark, b: DogLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: DogLandmark, b: DogLandmark): DogLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visible: a.visible && b.visible };
}

export function angle(a: DogLandmark, b: DogLandmark, c: DogLandmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (mag === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}

function groupCenter(landmarks: DogLandmark[], indices: readonly number[]): DogLandmark | null {
  const visible = indices.filter((i) => landmarks[i]?.visible);
  if (visible.length === 0) return null;
  const x = visible.reduce((s, i) => s + landmarks[i].x, 0) / visible.length;
  const y = visible.reduce((s, i) => s + landmarks[i].y, 0) / visible.length;
  return { x, y, visible: true };
}

export function scoreSymmetry(landmarks: DogLandmark[]): number {
  const leftEar = groupCenter(landmarks, LANDMARK_GROUPS.leftEar);
  const rightEar = groupCenter(landmarks, LANDMARK_GROUPS.rightEar);
  const leftEye = groupCenter(landmarks, LANDMARK_GROUPS.leftEye);
  const rightEye = groupCenter(landmarks, LANDMARK_GROUPS.rightEye);
  const nose = groupCenter(landmarks, LANDMARK_GROUPS.noseBridge);
  if (!leftEar || !rightEar || !leftEye || !rightEye || !nose) return 50;

  const mid = midpoint(leftEye, rightEye);
  const earDelta = Math.abs(dist(leftEar, mid) - dist(rightEar, mid));
  const eyeDelta = Math.abs(dist(leftEye, mid) - dist(rightEye, mid));
  const noseOffset = Math.abs(nose.x - mid.x);
  const faceWidth = dist(leftEar, rightEar) || 1;
  const normalized = (earDelta + eyeDelta + noseOffset * 2) / faceWidth;
  return Math.max(0, Math.min(100, 100 - normalized * 200));
}

export function scoreHarmony(landmarks: DogLandmark[]): number {
  const leftEye = groupCenter(landmarks, LANDMARK_GROUPS.leftEye);
  const rightEye = groupCenter(landmarks, LANDMARK_GROUPS.rightEye);
  const nose = groupCenter(landmarks, LANDMARK_GROUPS.noseBridge);
  const chin = landmarks[45];
  const leftEar = groupCenter(landmarks, LANDMARK_GROUPS.leftEar);
  if (!leftEye || !rightEye || !nose || !chin?.visible || !leftEar) return 50;

  const eyeMid = midpoint(leftEye, rightEye);
  const faceHeight = dist(eyeMid, chin) || 1;
  const eyeToNose = dist(eyeMid, nose);
  const noseToChin = dist(nose, chin);
  const interEye = dist(leftEye, rightEye);
  const idealThird = faceHeight / 3;
  const thirdError = Math.abs(eyeToNose - idealThird) + Math.abs(noseToChin - idealThird);
  const ratio = interEye / (dist(leftEar, rightEye!) || 1);
  const idealRatio = 0.35;
  const ratioError = Math.abs(ratio - idealRatio);
  const score = 100 - (thirdError / faceHeight) * 80 - ratioError * 100;
  return Math.max(0, Math.min(100, score));
}

export function scoreMuzzle(landmarks: DogLandmark[]): number {
  const jaw = LANDMARK_GROUPS.mouthChin.filter((i) => landmarks[i]?.visible);
  if (jaw.length < 4) return 50;
  const left = landmarks[32];
  const chin = landmarks[45];
  const right = landmarks[38];
  if (!left?.visible || !chin?.visible || !right?.visible) return 50;
  const gonial = angle(left, chin, right);
  const ideal = 120;
  const angleScore = 100 - Math.abs(gonial - ideal) * 1.5;
  const lowerWidth = dist(left, right);
  const faceHeight = dist(groupCenter(landmarks, LANDMARK_GROUPS.leftEye)!, chin) || 1;
  const widthRatio = lowerWidth / faceHeight;
  const widthScore = 100 - Math.abs(widthRatio - 0.55) * 120;
  return Math.max(0, Math.min(100, (angleScore + widthScore) / 2));
}

export function scoreCoat(imageData: ImageData, landmarks: DogLandmark[]): number {
  const { data, width } = imageData;
  const cheekIndices = [33, 34, 35, 39, 40, 41];
  const samples: number[] = [];

  for (const idx of cheekIndices) {
    const lm = landmarks[idx];
    if (!lm?.visible) continue;
    const px = Math.floor(lm.x * width);
    const py = Math.floor(lm.y * imageData.height);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = px + dx;
        const y = py + dy;
        if (x < 0 || y < 0 || x >= width || y >= imageData.height) continue;
        const i = (y * width + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        samples.push(lum);
      }
    }
  }

  if (samples.length < 10) return 55;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / samples.length;
  const uniformity = Math.max(0, 100 - Math.sqrt(variance) * 2);
  return Math.max(0, Math.min(100, uniformity));
}

export function scoreEyeAlertness(landmarks: DogLandmark[]): number {
  const le = LANDMARK_GROUPS.leftEye;
  const re = LANDMARK_GROUPS.rightEye;
  const leftInner = landmarks[le[0]];
  const leftOuter = landmarks[le[3]];
  const rightInner = landmarks[re[0]];
  const rightOuter = landmarks[re[3]];
  if (!leftInner?.visible || !leftOuter?.visible || !rightInner?.visible || !rightOuter?.visible) {
    return 50;
  }

  function canthalTilt(inner: DogLandmark, outer: DogLandmark): number {
    const dx = outer.x - inner.x;
    const dy = inner.y - outer.y;
    const tilt = Math.atan2(dy, dx) * (180 / Math.PI);
    const ideal = 8;
    return 100 - Math.abs(tilt - ideal) * 3;
  }

  const left = canthalTilt(leftInner, leftOuter);
  const right = canthalTilt(rightInner, rightOuter);
  return Math.max(0, Math.min(100, (left + right) / 2));
}

export function computePdl(detection: DogFaceDetection, imageData?: ImageData): PdlResult {
  const { landmarks, confidence } = detection;
  const subScores: PdlSubScores = {
    symmetry: scoreSymmetry(landmarks),
    harmony: scoreHarmony(landmarks),
    muzzle: scoreMuzzle(landmarks),
    coat: imageData ? scoreCoat(imageData, landmarks) : 55,
    eyeAlertness: scoreEyeAlertness(landmarks),
  };

  const raw =
    subScores.symmetry * PDL_WEIGHTS.symmetry +
    subScores.harmony * PDL_WEIGHTS.harmony +
    subScores.muzzle * PDL_WEIGHTS.muzzle +
    subScores.coat * PDL_WEIGHTS.coat +
    subScores.eyeAlertness * PDL_WEIGHTS.eyeAlertness;

  return {
    composite: Math.round(pdlToBand(raw) * 10) / 10,
    subScores,
    confidence,
    scannedAt: Date.now(),
  };
}
