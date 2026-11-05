import assert from "node:assert/strict";
import { test } from "node:test";
import { canMirrorCamera, shouldMirrorCapture } from "./camera-mirror.ts";

test("a confirmed rear camera cannot be mirrored", () => {
  assert.equal(canMirrorCamera("environment"), false);
  assert.equal(shouldMirrorCapture(canMirrorCamera("environment"), true), false);
  assert.equal(shouldMirrorCapture(canMirrorCamera("environment"), false), false);
});

test("front cameras and webcams can opt into mirroring", () => {
  for (const facingMode of ["user", "left", "right", undefined]) {
    assert.equal(canMirrorCamera(facingMode), true);
    assert.equal(shouldMirrorCapture(canMirrorCamera(facingMode), true), true);
  }
});

test("mirror remains off until explicitly enabled", () => {
  assert.equal(shouldMirrorCapture(true, false), false);
  assert.equal(shouldMirrorCapture(false, false), false);
});
