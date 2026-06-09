export { computePdl, LANDMARK_COUNT, LANDMARK_GROUPS } from "./scorer";
export { smoothPdlResult } from "./smooth";
export { drawDetectionOverlay } from "./overlay";
export type { DogFaceDetection, DogLandmark, PdlResult, PdlSubScores } from "./types";
export {
  detectDogFace,
  getFrameBrightness,
  loadModels,
  isHeuristicMode,
  validateCameraFrame,
} from "./detector";
export type { ModelManifest } from "./detector";
