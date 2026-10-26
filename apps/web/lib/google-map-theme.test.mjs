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

test("map follows resolved Appearance while retaining camera and latest pin in Map view only", async () => {
  const slots = [];
  const pendingEffects = [];
  const maps = [];
  const markers = [];
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
    Marker: class {
      constructor(options) { Object.assign(this, options); this.handlers = {}; markers.push(this); }
      addListener(name, callback) { this.handlers[name] = callback; }
      setPosition(position) { this.position = position; }
      getPosition() { return { lat: () => this.position.lat, lng: () => this.position.lng }; }
      setMap(map) { this.map = map; }
    },
    event: { clearInstanceListeners: instance => cleared.push(instance), trigger() {} },
  };
  // The loader is real code reading the same stubbed `window.google`.
  const loaderExports = {};
  vm.runInNewContext(loaderCompiled, { exports: loaderExports, window: { google: { maps: google } } });
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next-themes": { useTheme: () => ({ resolvedTheme: theme }) },
    "@/lib/google-maps-loader": loaderExports,
  };
  const context = {
    exports: {},
    require: name => modules[name],
    window: { google: { maps: google } },
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

  props = { ...props, latitude: 14.7, longitude: 120.95 };
  await render();
  assert.equal(markers[0].position.lat, 14.7);
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
  assert.equal(markers[0].map, null, "old marker is detached");
  assert.ok(cleared.includes(maps[0]));
  assert.ok(cleared.includes(markers[0]));
  assert.equal(markers[1].position.lat, 14.7, "uses the latest pin, not the initial coordinates");
  maps[1].handlers.click({ latLng: { lat: () => 14.9, lng: () => 121.1 } });
  assert.deepEqual(picks, [[14.9, 121.1]]);

  props = { ...props, latitude: null, longitude: null, readOnly: true };
  await render();
  theme = "dark";
  await render();
  assert.equal(maps.at(-1).colorScheme, "DARK");
  assert.equal(markers.length, 2, "removed pins do not reappear after theme changes");
  maps.at(-1).handlers.click({ latLng: { lat: () => 15, lng: () => 121 } });
  assert.equal(picks.length, 1, "read-only preview cannot change the pin");
  slots.forEach(slot => slot?.cleanup?.());
});
