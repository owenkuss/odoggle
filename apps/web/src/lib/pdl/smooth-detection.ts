import type { DogFaceDetection } from "@odoggle/shared";

const BBOX_ALPHA = 0.38;
const LANDMARK_ALPHA = 0.42;

let prevDetection: DogFaceDetection | null = null;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** EMA smoothing so the outline tracks smoothly frame-to-frame. */
export function smoothDetection(next: DogFaceDetection): DogFaceDetection {
  if (!prevDetection) {
    prevDetection = next;
    return next;
  }

  const bbox = {
    x: lerp(prevDetection.bbox.x, next.bbox.x, BBOX_ALPHA),
    y: lerp(prevDetection.bbox.y, next.bbox.y, BBOX_ALPHA),
    width: lerp(prevDetection.bbox.width, next.bbox.width, BBOX_ALPHA),
    height: lerp(prevDetection.bbox.height, next.bbox.height, BBOX_ALPHA),
  };

  const landmarks = next.landmarks.map((lm, i) => {
    const p = prevDetection!.landmarks[i];
    if (!p) return lm;
    return {
      x: lerp(p.x, lm.x, LANDMARK_ALPHA),
      y: lerp(p.y, lm.y, LANDMARK_ALPHA),
      visible: lm.visible,
    };
  });

  const smoothed: DogFaceDetection = {
    bbox,
    landmarks,
    confidence: Math.max(prevDetection.confidence, next.confidence),
  };
  prevDetection = smoothed;
  return smoothed;
}

export function resetDetectionSmoothing(): void {
  prevDetection = null;
}
