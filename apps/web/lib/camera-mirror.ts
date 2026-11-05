// Flip decision for verification camera captures. Pure so it stays
// node-tested; CameraCapture owns the toggle state and captured frame.
//
// The live video preview always stays raw. Only the saved JPEG may be
// flipped horizontally. A confirmed rear camera is never flipped. Browsers
// can fall back to a laptop webcam even when the rear camera was requested,
// so the actual track's facing mode decides eligibility; an unreported
// mode is treated as a webcam rather than excluding that laptop.

export function canFlipCapturedPhoto(facingMode?: string): boolean {
  return facingMode !== "environment";
}

export function shouldFlipCapturedPhoto(canFlip: boolean, flipPhoto: boolean): boolean {
  return canFlip && flipPhoto;
}
