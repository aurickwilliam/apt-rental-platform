// Mirror decision for verification camera captures. Pure so it stays
// node-tested; CameraCapture owns the toggle state and preview.
//
// Only a front camera or webcam may be mirrored. A confirmed rear camera is
// never mirrored. Browsers can fall back to a laptop webcam even when the rear
// camera was requested, so the actual track's facing mode decides eligibility;
// an unreported mode is treated as a webcam rather than excluding that laptop.

export function canMirrorCamera(facingMode?: string): boolean {
  return facingMode !== "environment";
}

export function shouldMirrorCapture(canMirror: boolean, mirror: boolean): boolean {
  return canMirror && mirror;
}
