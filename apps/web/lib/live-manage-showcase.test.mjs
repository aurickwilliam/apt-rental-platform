import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { manageScrollProgress, MANAGE_SCROLL_MAP, MANAGE_SCROLL_OFFSETS } from "../app/(main)/components/live-manage-motion.ts";

function render(depth, restoredPosition) {
  const jsx = (type, props) => ({ type, props });
  const ranges = [];
  const seeded = [];
  let subscriptions = 0;
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    react: {
      useRef: () => ({ current: { getBoundingClientRect: () => restoredPosition } }),
      useLayoutEffect: effect => { if (restoredPosition) effect(); },
    },
    "next/image": { default: "Image" },
    "@/hooks/use-landing-motion": { useLandingDepth: () => depth },
    "./live-manage-showcase.module.css": { default: { panel: "panel", dashboard: "dashboard", chat: "chat", pixelAngle: "pixelAngle", iphoneAngle: "iphoneAngle", phone: "phone" } },
    "./live-manage-motion": { manageScrollProgress, MANAGE_SCROLL_MAP, MANAGE_SCROLL_OFFSETS },
    "motion/react": {
      motion: { div: "motion.div" },
      useScroll: options => {
        subscriptions++;
        assert(options.target);
        assert.deepEqual([...options.offset], ["start 0.95", "center 0.45"]);
        return { scrollYProgress: "scroll" };
      },
      useTransform: (value, progress, output) => {
        assert.equal(value, "scroll");
        ranges.push({ progress: [...progress], values: [...output] });
        return { set: value => seeded.push(value) };
      },
      transform: (value, [start, end], [from, to]) => {
        const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
        return from + (to - from) * progress;
      },
    },
  };
  const exports = {};
  const source = readFileSync(new URL("../app/(main)/components/LiveManageShowcase.tsx", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, window: { innerHeight: 1000 }, require: name => { assert(name in dependencies, name); return dependencies[name]; } });

  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (typeof node.type === "function") return nodes(node.type(node.props));
    return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  }
  return { all: nodes(exports.default()), ranges, seeded, subscriptions: () => subscriptions };
}

for (const depth of [false, true]) {
  test(`Live & Manage keeps both phones ${depth ? "scroll-linked on desktop" : "static on touch/reduced-motion devices"}`, () => {
    const result = render(depth);
    assert.equal(result.subscriptions(), depth ? 1 : 0);
    const images = result.all.filter(node => node.type === "Image");
    assert.deepEqual(images.map(node => node.props.src), ["/landing/showcase-manage-rental.png", "/landing/showcase-manage-iphone-chat.png"]);
    assert.deepEqual(images.map(({ props }) => [props.width, props.height]), [[659, 1390], [675, 1394]]);
    assert(images.every(({ props }) => props.loading === "lazy" && props.unoptimized));
    assert.match(images[0].props.alt, /Google Pixel.*rent.*receipts.*repairs.*landlord/);
    assert.match(images[1].props.alt, /iPhone.*conversation.*maintenance/);
    const layers = result.all.filter(node => node.props?.["data-manage-layer"]);
    assert.equal(layers.length, 2);
    assert(layers.every(({ props }) => props.whileInView === undefined && props.transition === undefined));
    for (const { props } of layers) for (const value of ["opacity", "x", "y", "scale"]) {
      assert.equal(props.style[value] !== undefined, depth);
    }
    const angles = result.all.filter(node => node.props?.["data-manage-angle"]);
    assert.deepEqual(angles.map(({ props }) => props["data-manage-angle"]), ["pixel", "iphone"]);
    assert(angles.every(node => node.type === "div" && node.props.style === undefined));
    if (depth) assert.deepEqual(result.ranges, [
      { progress: [0, 0.24], values: [0, 1] },
      { progress: [0, 0.5], values: [-16, 0] },
      { progress: [0, 0.5], values: [32, 0] },
      { progress: [0, 0.5], values: [0.98, 1] },
      { progress: [0.3, 0.6], values: [0, 1] },
      { progress: [0.3, 0.8], values: [18, 0] },
      { progress: [0.3, 0.8], values: [36, 0] },
      { progress: [0.3, 0.8], values: [0.98, 1] },
    ]);
  });
}

test("restored/anchor positions start at the right scroll frame, with a still reading phase", () => {
  assert.deepEqual(render(true, { top: 1200, height: 500 }).seeded, [0, -16, 32, 0.98, 0, 18, 36, 0.98]);
  assert.deepEqual(render(true, { top: 350, height: 500 }).seeded, [1, 0, 0, 1, 1, 0, 0, 1]);
  const halfway = render(true, { top: 575, height: 500 }).seeded;
  assert.deepEqual(halfway.slice(0, 4), [1, 0, 0, 1], "Pixel has settled before iPhone");
  assert(halfway[4] > 0 && halfway[4] < 1);
  assert(halfway[5] > 0 && halfway[6] > 0);
});

test("rental management is established before messaging, with less travel and a final reading interval", () => {
  assert(MANAGE_SCROLL_MAP.dashboardOpacity.progress[1] < MANAGE_SCROLL_MAP.chatOpacity.progress[0]);
  assert(MANAGE_SCROLL_MAP.dashboardY.progress[1] > MANAGE_SCROLL_MAP.dashboardOpacity.progress[1]);
  assert(MANAGE_SCROLL_MAP.chatOpacity.progress[1] < MANAGE_SCROLL_MAP.chatY.progress[1]);
  assert(MANAGE_SCROLL_MAP.dashboardY.values[0] < 64);
  assert(MANAGE_SCROLL_MAP.chatY.values[0] < 64);
  for (const mapping of Object.values(MANAGE_SCROLL_MAP)) assert(mapping.progress[1] <= 0.8);
});

test("phone assets retain transparent PNGs, a local blue stage and a dominant rental dashboard", () => {
  for (const [name, width, height] of [["showcase-manage-rental.png", 659, 1390], ["showcase-manage-iphone-chat.png", 675, 1394]]) {
    const png = readFileSync(new URL(`../public/landing/${name}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.equal(png[25], 6);
  }
  const css = readFileSync(new URL("../app/(main)/components/live-manage-showcase.module.css", import.meta.url), "utf8");
  assert.match(css, /\.panel\s*\{[^}]*max-width: 600px;[^}]*aspect-ratio: 1;/);
  assert.match(css, /\.panel::before\s*\{[^}]*inset: 12% 2% 6%;[^}]*background: var\(--secondary\);[^}]*pointer-events: none/);
  assert.match(css, /\.dashboard\s*\{[^}]*z-index: 1;[^}]*left: 9%;[^}]*width: 44%/);
  assert.match(css, /\.chat\s*\{[^}]*z-index: 2;[^}]*left: 51%;[^}]*width: 35%/);
  assert.match(css, /\.pixelAngle\s*\{\s*transform: rotate\(-3deg\)/);
  assert.match(css, /\.iphoneAngle\s*\{\s*transform: rotate\(4deg\)/);
  assert.match(css, /@media \(max-width: 639px\)[^]*rotate\(-2deg\)[^]*rotate\(2deg\)/);
  assert.doesNotMatch(css, /animation:|transition:|perspective\(/);
});

test("scroll distance follows panel geometry and finishes while the devices are in view", () => {
  assert.equal(manageScrollProgress(950, 1000, 500), 0);
  assert.equal(manageScrollProgress(575, 1000, 500), 0.5);
  assert.equal(manageScrollProgress(350, 1000, 500), 0.8);
  assert.equal(manageScrollProgress(200, 1000, 500), 1);
  assert.equal(manageScrollProgress(-200, 1000, 500), 1);
  assert.equal(manageScrollProgress(1200, 1000, 500), 0);
  assert.equal(manageScrollProgress(0, 0, 500), 1);
  assert.equal(manageScrollProgress(0, 1000, 0), 1);
  for (const viewport of [700, 900, 1080]) {
    const panel = 600;
    // The complete taller Pixel fits during the still 80–100% reading interval.
    const topAtReading = viewport * 0.95 - 0.9 * (viewport + panel) / 2;
    assert(topAtReading > 0);
    assert(topAtReading + panel * 0.97 <= viewport + 1);
  }
});

test("SSR, reduced motion and no-JavaScript fallbacks never hide the final composition", () => {
  const css = readFileSync(new URL("../app/(main)/components/live-manage-showcase.module.css", import.meta.url), "utf8");
  assert.match(css, /min-width: 1024px[^]*hover: hover[^]*prefers-reduced-motion: no-preference/);
  assert.match(css, /translate\(-16px, 32px\) scale\(0.98\)/);
  assert.match(css, /translate\(18px, 36px\) scale\(0.98\)/);
  assert.match(css, /prefers-reduced-motion: reduce[^]*opacity: 1 !important;[^]*transform: none !important;/);
  assert.match(css, /:global\(html\.apt-reduce-motion\) \.dashboard/);
  const source = readFileSync(new URL("../app/(main)/components/LiveManageShowcase.tsx", import.meta.url), "utf8");
  assert.match(source, /<noscript><style>[^]*?opacity: 1 !important; transform: none !important;[^]*?<\/noscript>/);
});
