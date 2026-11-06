import assert from "node:assert/strict";
import test from "node:test";
import { computeTutorialPlacement, TUTORIAL_NARROW_VIEWPORT } from "./tutorial-placement.ts";

const viewport = { width: 1280, height: 800 };
const card = { width: 360, height: 220 };

test("a sidebar target gets the card beside it", () => {
  const target = { top: 200, left: 16, width: 220, height: 44 };
  const result = computeTutorialPlacement({ target, viewport, card });
  assert.equal(result.mode, "beside");
  assert.equal(result.left, 16 + 220 + 12);
  assert.ok(result.top >= 16 && result.top + card.height <= viewport.height - 16);
});

test("the card never leaves the viewport", () => {
  const target = { top: 770, left: 16, width: 220, height: 44 };
  const result = computeTutorialPlacement({ target, viewport, card });
  assert.ok(result.top + card.height <= viewport.height - 16);
});

test("a target at the right edge puts the card below, then above", () => {
  const right = { top: 100, left: 1100, width: 160, height: 40 };
  assert.equal(computeTutorialPlacement({ target: right, viewport, card }).mode, "below");
  const lowRight = { top: 700, left: 1100, width: 160, height: 40 };
  assert.equal(computeTutorialPlacement({ target: lowRight, viewport, card }).mode, "above");
});

test("a missing target centers the card", () => {
  const result = computeTutorialPlacement({ target: null, viewport, card });
  assert.equal(result.mode, "centered");
  assert.equal(result.left, (viewport.width - card.width) / 2);
});

test("narrow screens dock the card across the bottom", () => {
  const narrow = { width: TUTORIAL_NARROW_VIEWPORT - 1, height: 700 };
  const result = computeTutorialPlacement({ target: { top: 10, left: 10, width: 40, height: 40 }, viewport: narrow, card });
  assert.equal(result.mode, "docked");
  assert.equal(result.left, 16);
  assert.equal(result.width, narrow.width - 32);
});
