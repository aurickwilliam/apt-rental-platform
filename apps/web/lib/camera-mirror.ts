// Mirror decision for the verification camera capture. Pure so it stays
// node-tested; CameraCapture owns the toggle state and preview.
//
// The live <video> preview is never transformed, and the capture mirrors the
// raw front-camera frame by default (the selfie step with a held ID). Some
// front cameras/browser stacks already capture unmirrored, so the selfie step
// offers "Unmirror capture" to save the exactly-as-seen frame; ID steps
// (back camera) are never flipped either way.

export type CameraFacing = "environment" | "user";

export function shouldMirrorCapture(facing: CameraFacing, unmirror?: boolean): boolean {
  if (facing !== "user") return false;
  return !unmirror;
}
