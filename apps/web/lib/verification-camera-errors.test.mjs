import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { verificationCameraError } from "./verification-camera-errors.ts";

test("permission instructions match Safari, Chromium and other browsers", () => {
  assert.match(verificationCameraError("NotAllowedError", "iPhone Version/18.0 Safari/605.1"), /Safari's page menu/);
  assert.match(verificationCameraError("NotAllowedError", "Android Chrome/130 Safari/537"), /site controls/);
  assert.match(verificationCameraError("PermissionDeniedError", "iPhone CriOS/130 Safari/605"), /site controls/);
  assert.match(verificationCameraError("NotAllowedError", "Firefox/130"), /browser permissions/);
});

for (const [reason, match] of [["insecure", /HTTPS/], ["unsupported", /up-to-date browser/], ["NotFoundError", /No camera was found/], ["OverconstrainedError", /No suitable camera/], ["SecurityError", /blocked/], ["NotReadableError", /other apps or tabs/], ["AbortError", /other apps or tabs/], ["ended", /camera stopped/], ["capture", /could not be captured/]]) {
  test(`camera failure guidance: ${reason}`, () => {
    const message = verificationCameraError(reason, "");
    assert.match(message, match);
    assert.doesNotMatch(message, /upload|gallery/i);
  });
}

test("mobile capture paths have no file, capture-attribute, paste or drop input", () => {
  for (const file of ["CameraCapture.tsx", "MobileVerifyClient.tsx"]) {
    const source = readFileSync(new URL(`../app/verify/mobile/components/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /type=["']file["']|<input|onDrop|onPaste|capture=["']|\.files\b/);
  }
});
