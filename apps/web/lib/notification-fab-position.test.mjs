import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearFabPlacement,
  defaultFabPlacement,
  FAB_DEFAULT_PLACEMENT,
  FAB_DRAG_THRESHOLD_PX,
  FAB_STORAGE_KEY,
  isDefaultFabPlacement,
  loadFabPlacement,
  saveFabPlacement,
  snapSideForRelease,
} from "./notification-fab-position.ts";

function memoryStorage(initial) {
  const store = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };
}

test("default placement is top-right", () => {
  assert.deepEqual(defaultFabPlacement(), { side: "right", topRatio: 0.12 });
  assert.ok(FAB_DRAG_THRESHOLD_PX > 0);
});

test("loading without storage or entry falls back to default", () => {
  assert.deepEqual(loadFabPlacement(undefined), FAB_DEFAULT_PLACEMENT);
  assert.deepEqual(loadFabPlacement(null), FAB_DEFAULT_PLACEMENT);
  assert.deepEqual(loadFabPlacement(memoryStorage()), FAB_DEFAULT_PLACEMENT);
});

test("malformed or out-of-range entries are repaired, never thrown", () => {
  assert.deepEqual(
    loadFabPlacement(memoryStorage({ [FAB_STORAGE_KEY]: "not-json" })),
    FAB_DEFAULT_PLACEMENT,
  );
  assert.deepEqual(
    loadFabPlacement(memoryStorage({ [FAB_STORAGE_KEY]: JSON.stringify({ side: "up", topRatio: 42 }) })),
    { side: "right", topRatio: 0.95 },
  );
  assert.deepEqual(
    loadFabPlacement(memoryStorage({ [FAB_STORAGE_KEY]: JSON.stringify({ side: "left", topRatio: -3 }) })),
    { side: "left", topRatio: 0.05 },
  );
});

test("save then load round-trips the placement", () => {
  const storage = memoryStorage();
  saveFabPlacement({ side: "left", topRatio: 0.7 }, storage);
  assert.deepEqual(loadFabPlacement(storage), { side: "left", topRatio: 0.7 });
});

test("clearing restores the default", () => {
  const storage = memoryStorage();
  saveFabPlacement({ side: "left", topRatio: 0.7 }, storage);
  assert.equal(isDefaultFabPlacement(loadFabPlacement(storage)), false);
  clearFabPlacement(storage);
  assert.deepEqual(loadFabPlacement(storage), FAB_DEFAULT_PLACEMENT);
  assert.equal(isDefaultFabPlacement(loadFabPlacement(storage)), true);
});

test("release snaps to the nearest edge, ties keep the side", () => {
  assert.equal(snapSideForRelease(100, 1000, "right"), "left");
  assert.equal(snapSideForRelease(900, 1000, "left"), "right");
  assert.equal(snapSideForRelease(500, 1000, "left"), "left");
  assert.equal(snapSideForRelease(500, 1000, "right"), "right");
  assert.equal(snapSideForRelease(0, 0, "left"), "left");
});
