import assert from "node:assert/strict";
import { after, test } from "node:test";

import { loadGoogleMaps } from "./google-maps-loader.ts";

// A tiny DOM for the script tag the loader appends.
function createDom() {
  const scripts = [];
  const document = {
    head: {
      appendChild(element) {
        scripts.push(element);
      },
    },
    createElement(tag) {
      return {
        tag,
        id: "",
        src: "",
        async: false,
        defer: false,
        onload: null,
        onerror: null,
        removed: false,
        remove() {
          this.removed = true;
          const index = scripts.indexOf(this);
          if (index >= 0) scripts.splice(index, 1);
        },
      };
    },
  };
  return { document, window: {}, scripts };
}

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

function installDom() {
  const dom = createDom();
  globalThis.window = dom.window;
  globalThis.document = dom.document;
  return dom;
}

after(() => {
  globalThis.window = originalWindow;
  globalThis.document = originalDocument;
});

// The module keeps one in-flight promise, so these tests run in order: the
// failure cases reset that state before the successful load at the end.

test("resolves without a script when the API is already present", async () => {
  const { window, scripts } = installDom();
  window.google = { maps: { Map: class {} } };

  await loadGoogleMaps("test-key");

  assert.equal(scripts.length, 0);
});

test("rejects and resets when the callback fires without the namespace", async () => {
  const { window, scripts } = installDom();

  const pending = loadGoogleMaps("test-key");
  assert.equal(scripts.length, 1);
  const [script] = scripts;
  assert.equal(typeof window.__aptGoogleMapsReady, "function");

  window.__aptGoogleMapsReady();

  await assert.rejects(pending, /failed to initialize/);
  assert.equal(window.__aptGoogleMapsReady, undefined, "the callback cleans up");
  assert.equal(script.removed, true, "the script is not left behind");
  assert.equal(scripts.length, 0);
});

test("rejects and resets when the script fails to load", async () => {
  const { window, scripts } = installDom();

  const pending = loadGoogleMaps("test-key");
  const [script] = scripts;

  script.onerror();

  await assert.rejects(pending, /script failed to load/);
  assert.equal(window.__aptGoogleMapsReady, undefined);
  assert.equal(script.removed, true);
  assert.equal(scripts.length, 0);
});

test("loads asynchronously through one shared callback", async () => {
  const { window, scripts } = installDom();
  const apiKey = "key with spaces/&";

  const first = loadGoogleMaps(apiKey);
  const second = loadGoogleMaps(apiKey);

  assert.equal(first, second, "concurrent calls share one load");
  assert.equal(scripts.length, 1, "only one script tag is appended");

  const [script] = scripts;
  assert.equal(script.id, "google-maps-js");
  assert.equal(script.async, true);
  assert.equal(script.defer, true);
  assert.match(script.src, /^https:\/\/maps\.googleapis\.com\/maps\/api\/js\?/);
  assert.ok(script.src.includes(`key=${encodeURIComponent(apiKey)}`));
  assert.match(script.src, /[?&]v=weekly(&|$)/);
  assert.match(
    script.src,
    /[?&]loading=async(&|$)/,
    "Google warns when the API is loaded without loading=async",
  );
  assert.match(script.src, /[?&]callback=__aptGoogleMapsReady(&|$)/);

  window.google = { maps: { Map: class {} } };
  window.__aptGoogleMapsReady();
  await first;

  assert.equal(window.__aptGoogleMapsReady, undefined, "the callback cleans up");
  assert.equal(script.removed, false);
});
