import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FAB_CLEARANCE_PX,
  FAB_EDGE_MARGIN_PX,
  FAB_SIZE_PX,
  resolveFabPlacement,
} from "./notification-fab-safe-area.ts";

const VIEWPORT = { width: 1280, height: 900 };
/** Sidebar 256 + edge margin 12, as the FAB computes it. */
const MIN_LEFT = 268;
const RIGHT_COLUMN_LEFT = VIEWPORT.width - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX;
const LEFT_COLUMN_LEFT = MIN_LEFT;
/** Top range on the 900px viewport. */
const MIN_TOP = FAB_EDGE_MARGIN_PX;
const MAX_TOP = VIEWPORT.height - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX;

function place(preferred, obstacles, viewport = VIEWPORT) {
  return resolveFabPlacement({ viewport, obstacles, preferred, minLeft: MIN_LEFT });
}

function rect(top, bottom, left = 0, right = VIEWPORT.width) {
  return { left, top, right, bottom };
}

test("keeps the saved anchor when nothing is marked", () => {
  assert.deepEqual(place({ side: "right", topRatio: 0.12 }, []), {
    side: "right",
    topPx: 108,
    leftPx: RIGHT_COLUMN_LEFT,
    clear: true,
    docked: false,
  });
});

test("moves the bell above the messages composer, keeping the clearance margin", () => {
  const composer = rect(820, 900);
  const resolved = place({ side: "right", topRatio: 0.9 }, [composer]);

  assert.equal(resolved.side, "right");
  assert.equal(resolved.clear, true);
  assert.equal(resolved.topPx, composer.top - FAB_CLEARANCE_PX - FAB_SIZE_PX);
  assert.ok(resolved.topPx + FAB_SIZE_PX + FAB_CLEARANCE_PX <= composer.top);
});

test("picks the nearest side of a small floating control", () => {
  const jumpToLatest = rect(700, 740, 1200, VIEWPORT.width);
  const resolved = place({ side: "right", topRatio: 0.8 }, [jumpToLatest]);

  assert.equal(resolved.topPx, jumpToLatest.bottom + FAB_CLEARANCE_PX);
  assert.equal(resolved.clear, true);
});

test("ignores marked controls that do not reach the saved edge", () => {
  const contactRail = rect(0, 900, 0, 400);
  assert.deepEqual(place({ side: "right", topRatio: 0.9 }, [contactRail]), {
    side: "right",
    topPx: 810,
    leftPx: RIGHT_COLUMN_LEFT,
    clear: true,
    docked: false,
  });
});

test("flips to the other edge when the saved edge is fully covered", () => {
  const fullHeightPanel = rect(0, 900, 1200, VIEWPORT.width);
  const resolved = place({ side: "right", topRatio: 0.12 }, [fullHeightPanel]);

  assert.equal(resolved.side, "left");
  assert.equal(resolved.leftPx, LEFT_COLUMN_LEFT);
  assert.equal(resolved.topPx, 108);
  assert.equal(resolved.clear, true);
});

test("messages layout: contact rail on the left, composer at the bottom right", () => {
  const contactRail = rect(0, 900, 0, 400);
  const composer = rect(820, 900, 268, VIEWPORT.width);
  const resolved = place({ side: "left", topRatio: 0.9 }, [contactRail, composer]);

  assert.equal(resolved.side, "right");
  assert.equal(resolved.topPx, composer.top - FAB_CLEARANCE_PX - FAB_SIZE_PX);
  assert.equal(resolved.clear, true);
});

test("a fully covered viewport falls back to the least-obscuring slot", () => {
  const leftPanel = rect(0, 900, 200, 400);
  const rightPanel = rect(0, 900, 1200, VIEWPORT.width);
  const resolved = place({ side: "right", topRatio: 0.9 }, [leftPanel, rightPanel]);

  assert.equal(resolved.clear, false);
  assert.equal(resolved.side, "right");
  assert.equal(resolved.topPx, 810);
});

test("clamps the anchor to the viewport ends", () => {
  const viewport = { width: 800, height: 200 };
  assert.equal(place({ side: "right", topRatio: 0.99 }, [], viewport).topPx, 144);
  assert.equal(place({ side: "left", topRatio: 0 }, [], viewport).topPx, MIN_TOP);
});

test("returns the saved side for an unmeasured viewport (SSR)", () => {
  assert.deepEqual(place({ side: "left", topRatio: 0.5 }, [], { width: 0, height: 0 }), {
    side: "left",
    topPx: MIN_TOP,
    leftPx: LEFT_COLUMN_LEFT,
    clear: true,
    docked: false,
  });
});

test("slides below a control that sits above the anchor", () => {
  const header = rect(100, 300);
  const resolved = place({ side: "right", topRatio: 0.12 }, [header]);

  assert.equal(resolved.topPx, header.top - FAB_CLEARANCE_PX - FAB_SIZE_PX);
  assert.equal(resolved.clear, true);
});

test("keeps the margin above and below a mid-column control", () => {
  const control = rect(400, 600, 1220, VIEWPORT.width);

  const above = place({ side: "right", topRatio: 0.5 }, [control]);
  assert.equal(above.side, "right");
  assert.equal(above.topPx, control.top - FAB_CLEARANCE_PX - FAB_SIZE_PX);

  const below = place({ side: "right", topRatio: 0.6 }, [control]);
  assert.equal(below.side, "right");
  assert.equal(below.topPx, control.bottom + FAB_CLEARANCE_PX);
});

test("browse filter rail pushes a left-anchored bell to the right edge", () => {
  const filterRail = rect(60, 860, 0, 320);
  const resolved = place({ side: "left", topRatio: 0.5 }, [filterRail]);

  assert.equal(resolved.side, "right");
  assert.equal(resolved.leftPx, RIGHT_COLUMN_LEFT);
  assert.equal(resolved.topPx, 450);
  assert.equal(resolved.clear, true);
});

test("every resolved slot stays inside the viewport", () => {
  const obstacles = [rect(0, 140), rect(820, 900, 268, VIEWPORT.width)];
  for (const topRatio of [0, 0.05, 0.4, 0.95, 1]) {
    const resolved = place({ side: "right", topRatio }, obstacles);
    assert.ok(resolved.topPx >= MIN_TOP, `top ${resolved.topPx} >= ${MIN_TOP}`);
    assert.ok(resolved.topPx <= MAX_TOP, `top ${resolved.topPx} <= ${MAX_TOP}`);
    assert.ok(resolved.leftPx >= LEFT_COLUMN_LEFT);
    assert.ok(resolved.leftPx + FAB_SIZE_PX <= VIEWPORT.width);
  }
});

test("docks into the messages header, ignoring the saved anchor and obstacles", () => {
  const header = rect(0, 75, 256, VIEWPORT.width);
  const composer = rect(820, 900, 268, VIEWPORT.width);
  const resolved = resolveFabPlacement({
    viewport: VIEWPORT,
    obstacles: [header, composer],
    dock: header,
    preferred: { side: "left", topRatio: 0.92 },
    minLeft: MIN_LEFT,
  });

  assert.deepEqual(resolved, {
    side: "right",
    topPx: header.top + (header.bottom - header.top - FAB_SIZE_PX) / 2,
    leftPx: RIGHT_COLUMN_LEFT,
    clear: true,
    docked: true,
  });
});

test("dock honours its own right edge, not the viewport's", () => {
  const dock = rect(300, 380, 300, 1000);
  const resolved = resolveFabPlacement({
    viewport: VIEWPORT,
    obstacles: [],
    dock,
    preferred: { side: "right", topRatio: 0.5 },
    minLeft: MIN_LEFT,
  });

  assert.equal(resolved.leftPx, 1000 - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX);
  assert.equal(resolved.topPx, 300 + (380 - 300 - FAB_SIZE_PX) / 2);
  assert.equal(resolved.docked, true);
});

test("a dock shorter than the bell stays inside the viewport", () => {
  const resolved = resolveFabPlacement({
    viewport: VIEWPORT,
    obstacles: [],
    dock: rect(0, 20),
    preferred: { side: "right", topRatio: 0.5 },
    minLeft: MIN_LEFT,
  });
  assert.equal(resolved.topPx, MIN_TOP);
});

test("a dock left of the content edge stays inside the content area", () => {
  const resolved = resolveFabPlacement({
    viewport: VIEWPORT,
    obstacles: [],
    dock: rect(0, 75, 0, 200),
    preferred: { side: "right", topRatio: 0.5 },
    minLeft: MIN_LEFT,
  });
  assert.equal(resolved.leftPx, LEFT_COLUMN_LEFT);
});

test("a zero-size dock is ignored", () => {
  const resolved = resolveFabPlacement({
    viewport: VIEWPORT,
    obstacles: [],
    dock: rect(0, 0, 0, 0),
    preferred: { side: "right", topRatio: 0.12 },
    minLeft: MIN_LEFT,
  });
  assert.equal(resolved.docked, false);
  assert.equal(resolved.topPx, 108);
});
