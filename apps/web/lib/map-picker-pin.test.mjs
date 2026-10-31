import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createMapPickerPin } from "./map-picker-pin.ts";

// The overlay builds its element with `document.createElement`, so the test
// supplies a minimal DOM. `node --test` runs each file in its own process.
function createPinElement() {
  const listeners = {};
  const capture = new Set();
  return {
    className: "",
    innerHTML: "",
    style: {},
    removed: false,
    listeners,
    addEventListener(type, handler) {
      (listeners[type] ??= []).push(handler);
    },
    removeEventListener() {},
    setPointerCapture(id) {
      capture.add(id);
    },
    releasePointerCapture(id) {
      capture.delete(id);
    },
    hasPointerCapture(id) {
      return capture.has(id);
    },
    remove() {
      this.removed = true;
    },
    fire(type, event) {
      for (const handler of listeners[type] ?? []) handler(event);
    },
  };
}

const originalDocument = globalThis.document;
globalThis.document = { createElement: createPinElement };
after(() => {
  globalThis.document = originalDocument;
});

function createEnvironment() {
  const pane = {
    children: [],
    appendChild(child) {
      this.children.push(child);
    },
  };
  const points = [];
  const maps = {
    OverlayView: class {
      setMap(map) {
        this.map = map;
        if (map) {
          this.onAdd?.();
          this.draw?.();
        } else {
          this.onRemove?.();
        }
      }
      getPanes() {
        return { overlayMouseTarget: pane };
      }
      getProjection() {
        return {
          fromLatLngToDivPixel: ({ lat, lng }) => ({
            x: Math.round((lng - 120) * 1000),
            y: Math.round((lat - 14) * 1000),
          }),
          fromDivPixelToLatLng: ({ x, y }) => ({ lat: () => y / 1000 + 14, lng: () => x / 1000 + 120 }),
        };
      }
    },
    Point: class {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        points.push(this);
      }
    },
  };
  return { maps, pane, points };
}

function pointerEvent(values = {}) {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 0,
    clientY: 0,
    calls,
    preventDefault() {
      calls.preventDefault += 1;
    },
    stopPropagation() {
      calls.stopPropagation += 1;
    },
    ...values,
  };
}

test("draws the pin in the overlay pane and follows setPosition", () => {
  const { maps, pane } = createEnvironment();
  const pin = createMapPickerPin(maps, {
    position: { lat: 14.6, lng: 120.9 },
    draggable: false,
    onDragEnd() {},
  });

  pin.setMap({});
  assert.equal(pane.children.length, 1);
  const element = pane.children[0];
  assert.match(element.innerHTML, /<svg/);
  assert.equal(element.style.left, "900px");
  assert.equal(element.style.top, "600px");

  pin.setPosition({ lat: 14.7, lng: 120.95 });
  assert.equal(element.style.left, "950px");
  assert.equal(element.style.top, "700px");

  pin.setMap(null);
  assert.equal(element.removed, true, "removing the map removes the pin");
});

test("a read-only pin does not capture presses", () => {
  const { maps, pane } = createEnvironment();
  const picks = [];
  const pin = createMapPickerPin(maps, {
    position: { lat: 14.6, lng: 120.9 },
    draggable: false,
    onDragEnd: position => picks.push(position),
  });
  pin.setMap({});
  const element = pane.children[0];

  assert.equal(element.listeners.pointerdown, undefined, "no drag listeners are attached");
  element.fire("pointerdown", pointerEvent({ clientX: 100, clientY: 100 }));
  element.fire("pointerup", pointerEvent({ clientX: 150, clientY: 120 }));
  assert.deepEqual(picks, []);
  assert.equal(element.style.left, "900px");
});

test("dragging the pin reports the new position once, on release", () => {
  const { maps, pane, points } = createEnvironment();
  const picks = [];
  const pin = createMapPickerPin(maps, {
    position: { lat: 14.6, lng: 120.9 },
    draggable: true,
    onDragEnd: position => picks.push(position),
  });
  pin.setMap({});
  const element = pane.children[0];
  assert.ok((element.listeners.click ?? []).length > 0, "pin clicks never reach the map");

  const down = pointerEvent({ clientX: 100, clientY: 100 });
  element.fire("pointerdown", down);
  assert.equal(down.calls.preventDefault, 1);
  assert.equal(down.calls.stopPropagation, 1);
  assert.equal(element.hasPointerCapture(1), true);

  element.fire("pointermove", pointerEvent({ clientX: 150, clientY: 120 }));
  assert.deepEqual(picks, [], "nothing is reported mid-drag");
  assert.equal(element.style.left, "950px");
  assert.equal(element.style.top, "620px");
  assert.equal(points.length, 1, "div pixels are converted through google.maps.Point");

  element.fire("pointerup", pointerEvent({ clientX: 150, clientY: 120 }));
  assert.deepEqual(picks, [{ lat: 14.62, lng: 120.95 }]);
  assert.equal(element.hasPointerCapture(1), false);
});

test("a press that barely moves is a tap, not a drag", () => {
  const { maps, pane } = createEnvironment();
  const picks = [];
  const pin = createMapPickerPin(maps, {
    position: { lat: 14.6, lng: 120.9 },
    draggable: true,
    onDragEnd: position => picks.push(position),
  });
  pin.setMap({});
  const element = pane.children[0];

  element.fire("pointerdown", pointerEvent({ clientX: 100, clientY: 100 }));
  element.fire("pointermove", pointerEvent({ clientX: 102, clientY: 101 }));
  element.fire("pointerup", pointerEvent({ clientX: 102, clientY: 101 }));

  assert.deepEqual(picks, []);
  assert.equal(element.style.left, "900px");
  assert.equal(element.style.top, "600px");
});

test("a cancelled drag returns the pin to where it started", () => {
  const { maps, pane } = createEnvironment();
  const picks = [];
  const pin = createMapPickerPin(maps, {
    position: { lat: 14.6, lng: 120.9 },
    draggable: true,
    onDragEnd: position => picks.push(position),
  });
  pin.setMap({});
  const element = pane.children[0];

  element.fire("pointerdown", pointerEvent({ clientX: 100, clientY: 100 }));
  element.fire("pointermove", pointerEvent({ clientX: 150, clientY: 120 }));
  assert.equal(element.style.left, "950px");

  element.fire("pointercancel", pointerEvent({ clientX: 150, clientY: 120 }));
  assert.deepEqual(picks, []);
  assert.equal(element.style.left, "900px");
  assert.equal(element.style.top, "600px");
});
