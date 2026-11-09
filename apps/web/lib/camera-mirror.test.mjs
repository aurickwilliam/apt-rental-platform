import assert from "node:assert/strict";
import { test } from "node:test";
import { canFlipCapturedPhoto, shouldFlipCapturedPhoto } from "./camera-mirror.ts";

test("a confirmed rear camera cannot flip the captured photo", () => {
  assert.equal(canFlipCapturedPhoto("environment"), false);
  assert.equal(shouldFlipCapturedPhoto(canFlipCapturedPhoto("environment"), true), false);
  assert.equal(shouldFlipCapturedPhoto(canFlipCapturedPhoto("environment"), false), false);
});

test("front cameras and webcams can opt into flipping the captured photo", () => {
  for (const facingMode of ["user", "left", "right", undefined]) {
    assert.equal(canFlipCapturedPhoto(facingMode), true);
    assert.equal(shouldFlipCapturedPhoto(canFlipCapturedPhoto(facingMode), true), true);
  }
});

test("flip photo remains off until explicitly enabled", () => {
  assert.equal(shouldFlipCapturedPhoto(true, false), false);
  assert.equal(shouldFlipCapturedPhoto(false, false), false);
});
