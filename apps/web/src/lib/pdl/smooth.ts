import type { PdlResult, PdlSubScores } from "@odoggle/shared";

const DEFAULT_ALPHA = 0.28;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothSubScores(prev: PdlSubScores | null, next: PdlSubScores, alpha: number): PdlSubScores {
  if (!prev) return next;
  return {
    symmetry: lerp(prev.symmetry, next.symmetry, alpha),
    harmony: lerp(prev.harmony, next.harmony, alpha),
    muzzle: lerp(prev.muzzle, next.muzzle, alpha),
    coat: lerp(prev.coat, next.coat, alpha),
    eyeAlertness: lerp(prev.eyeAlertness, next.eyeAlertness, alpha),
  };
}

/** Exponential moving average — keeps live rating stable without lagging too much. */
export function smoothPdlResult(
  prev: PdlResult | null,
  next: PdlResult,
  alpha = DEFAULT_ALPHA
): PdlResult {
  if (!prev) return next;
  const subScores = smoothSubScores(prev.subScores, next.subScores, alpha);
  return {
    composite: Math.round(lerp(prev.composite, next.composite, alpha) * 10) / 10,
    subScores,
    confidence: Math.max(prev.confidence, next.confidence),
    scannedAt: Date.now(),
  };
}

export function resetSmoothedPdl(): null {
  return null;
}