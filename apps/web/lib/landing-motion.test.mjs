import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { discoverScrollProgress, DISCOVER_SCROLL_MAP, DISCOVER_SCROLL_OFFSETS, landingReveal, LANDING_VIEWPORT, LANDING_REVEAL_DURATION } from "../app/(main)/components/landing-motion.ts";

function load(path, modules = {}) {
  const jsx = (type, props) => ({ type, props });
  const defaults = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "next/image": { default: "Image" },
    "motion/react": { motion: { div: "motion.div" } },
    "./landing-motion": { discoverScrollProgress, DISCOVER_SCROLL_MAP, DISCOVER_SCROLL_OFFSETS, landingReveal, LANDING_VIEWPORT, LANDING_EASE: [0.22, 1, 0.36, 1], LANDING_REVEAL_DURATION },
    "./landing-motion.module.css": { default: { reveal: "reveal", discover: "discover", backLayer: "backLayer", frontLayer: "frontLayer", backAngle: "backAngle", frontAngle: "frontAngle", screen: "screen" } },
    "./discover-showcase.module.css": { default: { panel: "panel", laptop: "laptop", details: "details", laptopSurface: "laptopSurface", detailsSurface: "detailsSurface", screen: "screen" } },
    "./LandingReveal": { default: "LandingReveal" },
    ...modules,
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { assert(name in defaults, name); return defaults[name]; } });
  return exports;
}

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (typeof node.type === "function") return nodes(node.type(node.props));
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}

test("landing timing is bounded, non-bouncy, with a real stagger hold and one-time viewport reveals", () => {
  assert.equal(LANDING_VIEWPORT.once, true);
  const first = landingReveal();
  const later = landingReveal(0.16, 16, 0.985);
  assert.equal(first.transition.duration, LANDING_REVEAL_DURATION);
  assert(Math.abs(later.transition.duration - 0.72) < 1e-9);
  assert.deepEqual(later.target.opacity, [0, 0, 1]);
  assert.deepEqual(later.target.y, [16, 16, 0]);
  assert.deepEqual(later.target.scale, [0.985, 0.985, 1]);
  assert(Math.abs(later.transition.times[1] * later.transition.duration - 0.16) < 1e-9);
  assert(!("rotate" in later.target));
});

test("custom entrance duration excludes the stagger hold for time-based supporting reveals", () => {
  const browse = landingReveal(0, 14, 1, 1.1);
  const details = landingReveal(0.35, 16, 1, 1.1);
  assert.equal(browse.transition.duration, 1.1);
  assert(Math.abs(details.transition.duration - 1.45) < 1e-9);
  const hold = details.transition.times[1] * details.transition.duration;
  assert(Math.abs(hold - 0.35) < 1e-9);
  assert(Math.abs(details.transition.duration - hold - 1.1) < 1e-9);
  assert(hold < browse.transition.duration);
  assert.deepEqual(browse.transition.ease, [0.22, 1, 0.36, 1]);
  assert.deepEqual(details.transition.ease, ["linear", [0.22, 1, 0.36, 1]]);
});

for (const reduced of [false, true]) {
  test(`landing reveals share a deterministic SSR starting frame and ${reduced ? "disable" : "enable"} movement`, () => {
    const Reveal = load("app/(main)/components/LandingReveal.tsx", { "@/hooks/use-landing-motion": { useLandingReducedMotion: () => reduced } }).default;
    const tree = Reveal({ children: "Essential content", name: "test", delay: 0.08, duration: 0.9 });
    assert.deepEqual({ ...tree.props.initial }, { opacity: 0, y: 52, scale: 1 });
    assert.equal(tree.props.children, "Essential content");
    assert.equal(tree.props.style, undefined);
    assert.equal(tree.props.viewport.once, true);
    assert.equal(tree.props.className, "reveal");
    assert.equal(tree.props.transition.duration, reduced ? 0 : 0.9);
    assert.equal(tree.props.whileInView.opacity, 1);
    assert.equal(tree.props.whileInView.y, 0);
    assert.equal(tree.props.whileInView.scale, 1);
    if (reduced) {
      assert.equal(tree.props.animate.opacity, 1);
      assert.equal(tree.props.animate.y, 0);
      assert.equal(tree.props.animate.scale, 1);
    } else {
      assert.equal(tree.props.animate, undefined);
      assert.equal(tree.props.transition.delay, 0.08);
    }
  });
}

test("SSR reveal frames have static no-JavaScript, reduced-motion and keyboard-focus fallbacks", () => {
  const css = readFileSync(new URL("../app/(main)/components/landing-motion.module.css", import.meta.url), "utf8");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\/\*[^]*?\*\/\s*\.reveal\s*\{\s*opacity: 1 !important;\s*transform: none !important;/);
  assert.match(css, /:global\(html\.apt-reduce-motion\) \.reveal,/);
  assert.match(css, /\.reveal:focus-within,\s*\.featuredCard:focus-within\s*\{\s*opacity: 1 !important;/);
  const layout = readFileSync(new URL("../app/(landing)/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /<noscript>[^]*?\[data-landing-reveal\] \{ opacity: 1 !important; transform: none !important; \}[^]*?<\/noscript>/);
});

for (const depth of [false, true]) {
  test(`Discover uses one original MacBook and a smaller details window; scroll subscription ${depth ? "enabled on desktop" : "absent on mobile/reduced motion"}`, () => {
    let scrollSubscriptions = 0;
    const ranges = [];
    const Discover = load("app/(main)/components/DiscoverShowcase.tsx", {
      react: { useRef: () => ({ current: null }), useLayoutEffect: () => {} },
      "@/hooks/use-landing-motion": { useLandingDepth: () => depth },
      "motion/react": {
        motion: { div: "motion.div" },
        useScroll: options => {
          scrollSubscriptions++;
          assert(options.target);
          assert.deepEqual([...options.offset], ["start 0.95", "center 0.45"]);
          return { scrollYProgress: "progress" };
        },
        useTransform: (value, input, output) => { assert.equal(value, "progress"); ranges.push({ input: [...input], output: [...output] }); return `motion-value-${ranges.length}`; },
      },
    }).default;
    const all = nodes(Discover());
    assert.equal(scrollSubscriptions, depth ? 1 : 0);
    if (depth) assert.deepEqual(ranges, [
      { input: [0, 0.22], output: [0, 1] },
      { input: [0, 0.6], output: [48, 0] },
      { input: [0, 0.6], output: [0.96, 1] },
      { input: [0.3, 0.6], output: [0, 1] },
      { input: [0.3, 0.8], output: [44, 0] },
      { input: [0.3, 0.8], output: [76, 0] },
      { input: [0.3, 0.8], output: [0.92, 1] },
    ]);
    const images = all.filter(node => node.type === "Image");
    assert.equal(images.length, 2);
    assert.equal(images[0].props.src, "/landing/showcase-discover-macbook.png");
    assert.equal(images[1].props.src, "/landing/showcase-details-layer.png");
    assert.match(images[1].props.alt, /Apply Now/);
    assert.match(images[0].props.alt, /MacBook Pro.*APT.*rental listings.*map/);
    assert.equal(images[0].props.width, 1867);
    assert.equal(images[0].props.height, 1146);
    assert.equal(images[1].props.width, 1899);
    assert(images.every(image => image.props.unoptimized === true));
    assert(images.every(image => image.props.loading === "lazy"));
    assert(images.every(image => image.props.sizes === undefined));
    const reveals = all.filter(node => node.type === "LandingReveal");
    assert.equal(reveals.length, 0, "screens must not have time-based reveals");
    const layers = all.filter(node => node.props?.["data-discover-layer"]);
    assert.equal(layers.length, 2);
    assert(layers.every(node => node.props.whileInView === undefined && node.props.transition === undefined));
    assert.equal(layers[0].props.style.opacity, depth ? "motion-value-1" : undefined);
    assert.equal(layers[1].props.style.opacity, depth ? "motion-value-4" : undefined);
    const angles = all.filter(node => node.props?.["data-discover-angle"]);
    assert.equal(angles.length, 2);
    assert(angles.every(node => node.type === "div" && node.props.style === undefined));
  });
}

test("restored/anchor progress is measured from the panel, clamped before and after its reading range", () => {
  assert.equal(discoverScrollProgress(950, 1000, 500), 0);
  assert.equal(discoverScrollProgress(575, 1000, 500), 0.5);
  assert.equal(discoverScrollProgress(350, 1000, 500), 0.8);
  assert.equal(discoverScrollProgress(200, 1000, 500), 1);
  assert.equal(discoverScrollProgress(0, 1000, 500), 1);
  assert.equal(discoverScrollProgress(1200, 1000, 500), 0);
  assert.equal(discoverScrollProgress(0, 0, 500), 1);
  assert.equal(discoverScrollProgress(0, 1000, 0), 1);
  assert(discoverScrollProgress(550, 1000, 700) < discoverScrollProgress(550, 1000, 500));
});

test("Discover establishes browsing before details and retains progressive travel and a final reading interval", () => {
  const map = DISCOVER_SCROLL_MAP;
  assert(map.backOpacity.progress[1] < map.frontOpacity.progress[0]);
  assert(map.backY.progress[1] > map.frontOpacity.progress[0]);
  assert(map.backScale.progress[1] > map.backOpacity.progress[1]);
  assert(map.frontOpacity.progress[1] < map.frontY.progress[1]);
  for (const mapping of Object.values(map)) {
    assert(mapping.progress[1] <= 0.8, "final 20% stays still");
    assert.equal(mapping.values[1], mapping === map.backOpacity || mapping === map.frontOpacity || mapping === map.backScale || mapping === map.frontScale ? 1 : 0);
  }
});

for (const reduced of [false, true]) {
  test(`featured cards ${reduced ? "stay static under reduced motion" : "animate visible slides once without touching the rail"}`, () => {
    const ref = { current: false };
    const events = new Map();
    const animations = [];
    let onEnter;
    let cleanup;
    let observerStopped = false;
    const root = {};
    const cards = [{ id: "a", style: {} }, { id: "offscreen", style: {} }, { id: "b", style: {} }];
    const api = {
      rootNode: () => root,
      slideNodes: () => cards.map(card => ({ querySelector: selector => { assert.equal(selector, "[data-featured-card]"); return card; } })),
      slidesInView: () => [0, 2],
      on: (name, callback) => events.set(name, callback),
      off: (name, callback) => { assert.equal(events.get(name), callback); events.delete(name); },
    };
    const { useFeaturedCardEntrance } = load("hooks/use-featured-card-entrance.ts", {
      react: { useRef: () => ref, useEffect: effect => { cleanup = effect(); } },
      "@/hooks/use-landing-motion": { useLandingReducedMotion: () => reduced },
      "@/app/(main)/components/landing-motion": { LANDING_EASE: [0.22, 1, 0.36, 1] },
      "motion/react": {
        inView: (target, callback) => { assert.equal(target, root); onEnter = callback; return () => { observerStopped = true; }; },
        animate: (card, target, transition) => {
          const animation = { card, target, transition, completed: false };
          animations.push(animation);
          return { complete: () => { animation.completed = true; } };
        },
      },
    });
    useFeaturedCardEntrance(api);
    if (reduced) {
      assert.equal(onEnter, undefined);
      assert.equal(animations.length, 0);
      assert.equal(ref.current, true);
      assert(cards.every(card => card.style.opacity === "1" && card.style.transform === "none"));
      return;
    }
    assert.equal(animations.length, 0);
    onEnter();
    assert.deepEqual(animations.map(animation => animation.card.id), ["a", "b"]);
    assert.equal(animations[0].transition.duration, 1.65);
    assert.equal(animations[1].transition.duration, 1.65);
    assert.equal(animations[1].transition.delay, 0.195);
    assert.deepEqual({ ...animations[0].target }, { opacity: 1, y: 0 });
    assert.deepEqual({ ...animations[1].target }, { opacity: 1, y: 0 });
    assert.equal(cards[1].style.opacity, "1", "offscreen cards remain static");
    events.get("select")();
    events.get("slideFocus")();
    assert(animations.every(animation => animation.completed));
    assert(cards.every(card => card.style.opacity === "1" && card.style.transform === "none"));
    onEnter();
    assert.equal(animations.length, 2, "navigation/re-entry must not replay");
    cleanup();
    assert.equal(observerStopped, true);
    assert.equal(events.size, 0);
  });
}

test("featured cards share an SSR first frame instead of flashing visible before their reveal", () => {
  const css = readFileSync(new URL("../app/(main)/components/landing-motion.module.css", import.meta.url), "utf8");
  const component = readFileSync(new URL("../app/(main)/components/ApartmentCarousel.tsx", import.meta.url), "utf8");
  assert.match(css, /\.featuredCard\s*\{\s*opacity: 0;\s*transform: translateY\(11px\)/);
  assert.match(component, /data-featured-card className=\{styles.featuredCard\}/);
  assert.match(component, /<noscript><style>[^]*?data-featured-card[^]*?opacity: 1 !important/);
  assert.match(css, /prefers-reduced-motion: reduce[^]*\.featuredCard\s*\{\s*opacity: 1 !important/);
  assert.match(css, /apt-reduce-motion\) \.featuredCard/);
});

test("OS and APT reduced motion both disable desktop depth", () => {
  for (const system of [false, true]) for (const app of [false, true]) for (const desktop of [false, true]) {
    const hooks = load("hooks/use-landing-motion.ts", {
      react: { useSyncExternalStore: (subscribe) => subscribe.name === "subscribeDesktopDepth" ? desktop : subscribe.name === "subscribeSystemMotion" ? system : app },
      "motion/react": { useReducedMotion: () => system },
      "@/lib/reduced-motion": { subscribeReducedMotion: () => {}, getReducedMotion: () => app },
    });
    assert.equal(hooks.useLandingReducedMotion(), system || app);
    assert.equal(hooks.useLandingDepth(), desktop && !system && !app);
  }
});

test("the aligned Discover stage and card hover stay independent from animated wrappers", () => {
  const css = readFileSync(new URL("../app/(main)/components/landing-motion.module.css", import.meta.url), "utf8");
  const discoverCss = readFileSync(new URL("../app/(main)/components/discover-showcase.module.css", import.meta.url), "utf8");
  assert.doesNotMatch(discoverCss, /rotate\(/);
  assert(!/perspective\(|rotate[XYZ]\(/.test(discoverCss));
  assert.match(discoverCss, /\.panel\s*\{[^}]*aspect-ratio: 10 \/ 9/);
  assert.match(discoverCss, /\.laptop\s*\{[^}]*width: 94%/);
  assert.match(discoverCss, /\.details\s*\{[^}]*width: 52%/);
  assert.match(discoverCss, /@media \(min-width: 1024px\)\s*\{\s*\.details\s*\{\s*width: 58%/);
  assert.match(discoverCss, /\.details\s*\{[^}]*right: 0/);
  assert.match(discoverCss, /\.details\s*\{[^}]*bottom: 2%/);
  assert.match(discoverCss, /\.panel::before\s*\{[^}]*inset: 44% 0 4%;[^}]*background: var\(--secondary\);[^}]*pointer-events: none/);
  assert.doesNotMatch(discoverCss, /animation:|transition:/);
  assert.match(discoverCss, /@media \(max-width: 639px\)[^]*display: grid;[^]*aspect-ratio: auto;[^]*width: 82%/);
  assert.match(discoverCss, /margin-top: -8px/);
  assert.match(discoverCss, /prefers-reduced-motion: reduce/);
  assert.match(discoverCss, /apt-reduce-motion/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /apt-reduce-motion/);
  assert(!css.includes("animation: infinite"));
});

test("Discover retains original PNG dimensions and alpha instead of regenerated or enlarged assets", () => {
  for (const [name, width, height] of [["showcase-discover-macbook.png", 1867, 1146], ["showcase-details-layer.png", 1899, 1073]]) {
    const png = readFileSync(new URL(`../public/landing/${name}`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.equal(png[25], 6, "original RGBA transparency is preserved");
  }
});

test("Discover matches its SSR starting frame and exposes final artwork for reduced motion and no JavaScript", () => {
  const css = readFileSync(new URL("../app/(main)/components/discover-showcase.module.css", import.meta.url), "utf8");
  assert.match(css, /min-width: 1024px[^]*hover: hover[^]*prefers-reduced-motion: no-preference/);
  assert.match(css, /translateY\(48px\) scale\(0.96\)/);
  assert.match(css, /translate\(44px, 76px\) scale\(0.92\)/);
  assert.match(css, /prefers-reduced-motion: reduce[^]*opacity: 1 !important;[^]*transform: none !important;/);
  const source = readFileSync(new URL("../app/(main)/components/DiscoverShowcase.tsx", import.meta.url), "utf8");
  assert.match(source, /<noscript><style>[^]*?#discover-showcase[^]*?opacity: 1 !important; transform: none !important;[^]*?<\/noscript>/);
});
