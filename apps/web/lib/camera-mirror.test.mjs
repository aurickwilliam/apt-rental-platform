import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldMirrorCapture } from "./camera-mirror.ts";

test("the back camera (ID steps) is never mirrored", () => {
  assert.equal(shouldMirrorCapture("environment", undefined), false);
  assert.equal(shouldMirrorCapture("environment", true), false);
  assert.equal(shouldMirrorCapture("environment", false), false);
});

test("the front camera mirrors by default and honors the unmirror toggle", () => {
  assert.equal(shouldMirrorCapture("user", undefined), true);
  assert.equal(shouldMirrorCapture("user", false), true);
  assert.equal(shouldMirrorCapture("user", true), false);
});
