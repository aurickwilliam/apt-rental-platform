import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/landlord/properties/components/GoogleMapPicker.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const loaderCompiled = ts.transpileModule(
  readFileSync(new URL("./google-maps-loader.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

const pinCompiled = ts.transpileModule(
  readFileSync(new URL("./map-picker-pin.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

// Minimal DOM for the pin overlay: one element with markup, a position and
// pointer listeners.
function createElement() {
  const listeners = {};
  const capture = new Set();
  return {
    className: "",
    innerHTML: "",
    style: {},
    removed: false,
    parent: null,
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
      if (!this.parent) return;
      const index = this.parent.children.indexOf(this);
      if (index >= 0) this.parent.children.splice(index, 1);
      this.parent = null;
    },
  };
}

const pane = {
  children: [],
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
  },
};
const document = { createElement };

test("map follows resolved Appearance while retaining camera and latest pin in Map view only", async () => {
  const slots = [];
  const pendingEffects = [];
  const maps = [];
  const pins = [];
  const cleared = [];
  const picks = [];
  let cursor = 0;
  let theme;
  let props = { latitude: 14.6, longitude: 120.9, onPick: (...position) => picks.push(position) };
  const react = {
    useRef(initial) {
      const slot = cursor++;
      return slots[slot] ??= { current: initial };
    },
    useState(initial) {
      const slot = cursor++;
      slots[slot] ??= { value: typeof initial === "function" ? initial() : initial };
      return [slots[slot].value, value => { slots[slot].value = value; }];
    },
    useEffect(effect, deps) {
      const slot = cursor++;
      const previous = slots[slot];
      if (!deps || !previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
        pendingEffects.push(() => {
          previous?.cleanup?.();
          slots[slot] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const jsx = (type, elementProps) => {
    if (type === "div" && elementProps.ref) elementProps.ref.current = {};
    return { type, props: elementProps };
  };
  const google = {
    Map: class {
      constructor(element, options) {
        Object.assign(this, options);
        this.handlers = {};
        maps.push(this);
      }
      addListener(name, callback) { this.handlers[name] = callback; }
      setCenter(position) { this.center = position; }
      getCenter() { return { lat: () => this.center.lat, lng: () => this.center.lng }; }
      getZoom() { return this.zoom; }
    },
    OverlayView: class {
      setMap(map) {
        this.map = map;
        if (map) {
          this.onAdd?.();
          this.draw?.();
          pins.push(this);
        } else {
          this.onRemove?.();
        }
      }
      getPanes() { return { overlayMouseTarget: pane }; }
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
      constructor(x, y) { this.x = x; this.y = y; }
    },
    event: { clearInstanceListeners: instance => cleared.push(instance), trigger() {} },
  };
  // The loader and the pin module are real code reading the same stubbed DOM and
  // `window.google`.
  const loaderExports = {};
  vm.runInNewContext(loaderCompiled, { exports: loaderExports, window: { google: { maps: google } } });
  const pinExports = {};
  vm.runInNewContext(pinCompiled, { exports: pinExports, document, console });
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next-themes": { useTheme: () => ({ resolvedTheme: theme }) },
    "@/lib/google-maps-loader": loaderExports,
    "@/lib/map-picker-pin": pinExports,
  };
  const context = {
    exports: {},
    require: name => modules[name],
    window: { google: { maps: google } },
    document,
    process: { env: { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "test-key" } },
    console,
    setTimeout: () => 1,
    clearTimeout() {},
  };
  vm.runInNewContext(compiled, context);
  const render = async () => {
    cursor = 0;
    context.exports.default(props);
    pendingEffects.splice(0).forEach(effect => effect());
    await Promise.resolve();
    await Promise.resolve();
  };

  await render();
  assert.equal(maps.length, 0, "waits for the resolved app theme");
  theme = "dark";
  await render();
  await render();
  assert.equal(maps[0].colorScheme, "DARK");
  assert.equal(maps[0].mapTypeId, "roadmap");
  assert.equal(maps[0].mapTypeControl, false, "Map/Satellite switch is hidden");
  assert.equal(pins.length, 1, "the pin is an overlay, not a Google marker");
  assert.equal(pane.children.length, 1);
  assert.match(pane.children[0].innerHTML, /<svg/, "the overlay pin draws its own markup");
  assert.equal(pane.children[0].style.left, "900px");
  assert.equal(pane.children[0].style.top, "600px");

  props = { ...props, latitude: 14.7, longitude: 120.95 };
  await render();
  assert.equal(pins[0].element.style.left, "950px");
  assert.equal(pins[0].element.style.top, "700px");

  maps[0].center = { lat: 14.8, lng: 121 };
  maps[0].zoom = 17;
  theme = "light";
  await render();
  await render();
  assert.equal(maps[1].colorScheme, "LIGHT");
  assert.equal(maps[1].center.lat, 14.8, "theme changes do not recenter on the pin");
  assert.equal(maps[1].zoom, 17);
  assert.equal(maps[1].mapTypeId, "roadmap");
  assert.equal(maps[1].mapTypeControl, false);
  assert.equal(pins[0].map, null, "old pin is detached");
  assert.equal(pins[0].element.removed, true);
  assert.equal(pane.children.length, 1, "only the rebuilt map's pin remains");
  assert.ok(cleared.includes(maps[0]));
  assert.equal(pins[1].element.style.left, "950px", "uses the latest pin, not the initial coordinates");
  assert.equal(pins[1].element.style.top, "700px");
  maps[1].handlers.click({ latLng: { lat: () => 14.9, lng: () => 121.1 } });
  assert.deepEqual(picks, [[14.9, 121.1]]);

  props = { ...props, latitude: null, longitude: null, readOnly: true };
  await render();
  theme = "dark";
  await render();
  assert.equal(maps.at(-1).colorScheme, "DARK");
  assert.equal(pins.length, 2, "removed pins do not reappear after theme changes");
  assert.equal(pane.children.length, 0, "a pin-less map has no overlay");
  maps.at(-1).handlers.click({ latLng: { lat: () => 15, lng: () => 121 } });
  assert.equal(picks.length, 1, "read-only preview cannot change the pin");
  slots.forEach(slot => slot?.cleanup?.());
});
