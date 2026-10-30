import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { buildJourneyGeometry, journeyMarkerPoint, journeyMarkerAngle, journeyPathOpacity, journeyScrollProgress, journeyMarkerDiameter } from "../app/(main)/components/journey/journey-geometry.ts";
import { CTA_HIGHLIGHT_DURATION, CTA_HIGHLIGHT_RESET_DISTANCE, ctaHighlightTransition, CTA_ACCENT_KEYFRAMES, CTA_BUTTON_KEYFRAMES } from "../app/(main)/components/journey/cta-highlight.ts";

const base = new URL("../app/(main)/components/journey/", import.meta.url);
const source = name => readFileSync(new URL(name, base), "utf8");
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function fixture(width = 1232) {
  const discoverMediaRight = (width - 64) * .56;
  const manageCopyRight = (width - 64) * .44;
  return { width, height: 3400, featured: { top: 40, bottom: 440 }, discover: { top: 800, bottom: 1400 },
    manage: { top: 1480, bottom: 2080 }, workflow: { top: 2240, bottom: 3040 },
    cta: { top: 3160, bottom: 3206, left: width * .26, right: width * .74 }, sideSpace: width >= 1232 ? 104 : 24,
    chapters: width >= 976 ? { introBottom: 720, introRight: (width + 768) / 2,
      discover: { copy: { left: discoverMediaRight + 64, right: width, top: 980, bottom: 1220 }, media: { left: 0, right: discoverMediaRight, top: 800, bottom: 1400 } },
      manage: { copy: { left: 0, right: manageCopyRight, top: 1620, bottom: 1940 }, media: { left: manageCopyRight + 64, right: width, top: 1480, bottom: 2080 } } } : undefined };
}

for (const width of [720, 976, 1232]) {
  test(`production journey fits measured ${width}px whitespace and the exact heading endpoint`, () => {
    const layout = fixture(width), geometry = buildJourneyGeometry(layout);
    assert(geometry);
    assert.equal((geometry.path.match(/M /g) ?? []).length, 1);
    assert.equal(geometry.points.at(-1).x, (layout.cta.left + layout.cta.right) / 2);
    assert.equal(layout.cta.top - geometry.points.at(-1).y - geometry.markerDiameter / 2, 20);
    for (let i = 1; i < geometry.points.length; i++) {
      assert(geometry.scrollProgress[i] > geometry.scrollProgress[i - 1]);
      assert(geometry.drawProgress[i] > geometry.drawProgress[i - 1]);
      assert(geometry.points[i].y > geometry.points[i - 1].y);
    }
    for (const p of geometry.points) {
      const radius = geometry.markerDiameter / 2;
      for (const rect of [layout.workflow, layout.cta].map(r => ({ left: 0, right: width, ...r }))) {
        const x = Math.max(rect.left, Math.min(rect.right, p.x)), y = Math.max(rect.top, Math.min(rect.bottom, p.y));
        assert(Math.hypot(p.x - x, p.y - y) >= radius);
      }
    }
  });
}

test("production retains approved complete timing/completion contracts independently of preview source", () => {
  const expected = { 720: "23e5cb6a8482c552c52557a1686285eda9bce1c31df5a03ef245bf017f5dd5ba", 976: "5c88e6804f4966bfb32160578398daf6b33d80f9781030cfb4cb4a88d51c7dd2", 1232: "528ab7cc4144920eefa9d54e5af3502dbc760fb035c5fb5aaf4404bbd2b8c0bb" };
  for (const width of [720, 976, 1232]) {
    const { scrollProgress, completion } = buildJourneyGeometry(fixture(width));
    assert.equal(hash({ scrollProgress, completion }), expected[width]);
  }
});

test("SVG cubic joins retain forward tangent continuity without upward hooks", () => {
  for (const width of [720, 976, 1232]) {
    const geometry = buildJourneyGeometry(fixture(width));
    const commands = geometry.path.split("C ").slice(1).map(c => c.trim().split(/\s+/).map(Number));
    for (let i = 1; i < commands.length; i++) {
      const [, , bx, by, x, y] = commands[i - 1], [cx, cy] = commands[i];
      const ax = x - bx, ay = y - by, dx = cx - x, dy = cy - y;
      const length = Math.hypot(ax, ay) * Math.hypot(dx, dy);
      assert(length > 0 && ax * dx + ay * dy > 0);
      assert(Math.abs(ax * dy - ay * dx) / length < .001);
    }
    assert.equal(commands.at(-1)[2], commands.at(-1)[4]);
  }
});

test("streamed listing height changes move real anchors, not fixed screenshot coordinates", () => {
  const initial = fixture(), changed = fixture();
  const shift = 145;
  changed.featured.bottom += shift;
  for (const key of ["discover", "manage", "workflow", "cta"]) { changed[key].top += shift; changed[key].bottom += shift; }
  for (const chapter of Object.values(changed.chapters).filter(v => typeof v === "object")) {
    for (const rect of Object.values(chapter)) { rect.top += shift; rect.bottom += shift; }
  }
  changed.chapters.introBottom += shift;
  changed.height += shift;
  const before = buildJourneyGeometry(initial), after = buildJourneyGeometry(changed);
  assert(after);
  assert.equal(after.points[0].y - before.points[0].y, shift);
  assert.equal(after.points.at(-1).y - before.points.at(-1).y, shift);
  assert.equal(after.points.at(-1).x, before.points.at(-1).x);
});

test("narrow, unavailable or crowded geometry hides decoration rather than content", () => {
  assert.equal(buildJourneyGeometry(fixture(327)), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), height: 0 }), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), sideSpace: 10 }), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), chapters: undefined }), null);
  assert.equal(journeyMarkerDiameter(1232, 104), 32);
  assert.equal(journeyMarkerDiameter(976, 24), 22);
  assert.equal(journeyMarkerDiameter(720, 24), 20);
});

test("marker position and direction use the same actual SVG path in both directions", () => {
  const samples = [], path = { getPointAtLength(d) { samples.push(d); return { x: -d, y: d }; } };
  for (const progress of [0, .25, .5, 1, .5, .25, 0]) {
    assert.deepEqual(journeyMarkerPoint(path, 100, progress), { x: -100 * progress, y: 100 * progress });
    assert.equal(journeyMarkerAngle(path, 100, progress), 225);
  }
  assert(samples.every(d => d >= 0 && d <= 100));
  const view = source("JourneyPath.tsx");
  assert.match(view, /useMotionValueEvent\(draw, "change", positionMarker\)/);
  assert.match(view, /pathLength: draw/);
  assert.match(view, /IconNavigationFilled/);
  assert.equal((view.match(/getTotalLength\(\)/g) ?? []).length, 1);
});

test("arrival freezes draw before a complementary roof/path crossfade and reverses exactly", () => {
  const geometry = buildJourneyGeometry(fixture());
  const { arrivalProgress: arrival, fadeEndProgress: end } = geometry.completion;
  assert.equal(geometry.scrollProgress.at(-1), arrival);
  assert.equal(geometry.drawProgress.at(-1), 1);
  assert(Math.abs((end - arrival) * geometry.height - 128) < 1e-8);
  const values = [arrival, (arrival + end) / 2, end].map(p => journeyPathOpacity(p, geometry.completion));
  assert.equal(values[0], 1); assert(Math.abs(values[1] - .5) < 1e-10); assert.equal(values[2], 0);
  assert.deepEqual([end, (arrival + end) / 2, arrival].map(p => journeyPathOpacity(p, geometry.completion)), values.toReversed());
  const view = source("JourneyPath.tsx");
  assert.match(view, /useTransform\(pathOpacity, opacity => 1 - opacity\)/);
  assert.match(view, /data-journey-navigation style=\{\{ opacity: pathOpacity \}\}/);
  assert.match(view, /data-journey-roof[^>]*opacity: roofOpacity/);
  assert.match(view, /href="\/logo\/logo.svg"/);
});

test("completion highlight runs once, cancels on reverse and re-arms after 24px", () => {
  assert.equal(CTA_HIGHLIGHT_DURATION, 800); assert.equal(CTA_HIGHLIGHT_RESET_DISTANCE, 24);
  const completion = { arrivalProgress: .7, fadeEndProgress: .85 };
  let state = "armed", count = 0;
  for (const p of [.7, .84, .85, .85, 1, .849, .85]) { const next = ctaHighlightTransition(state, p, completion, 1000); state = next.state; count += Number(next.play); }
  assert.equal(count, 1);
  assert(ctaHighlightTransition(state, .849, completion, 1000).cancel);
  state = ctaHighlightTransition(state, .8, completion, 1000).state;
  assert(ctaHighlightTransition(state, .85, completion, 1000).play);
  assert.equal(CTA_ACCENT_KEYFRAMES.at(-1).opacity, 0);
  assert.equal(CTA_BUTTON_KEYFRAMES.at(-1).filter, "brightness(1)");
  const hook = source("use-cta-highlight.ts");
  assert.match(hook, /iterations: 1, fill: "none"/);
  assert.match(hook, /animation.cancel\(\)/);
  assert.doesNotMatch(hook, /setTimeout|setInterval|useState|getBoundingClientRect|useScroll/);
});

test("window scroll maps deterministically to the reading line and clamps anchor jumps", () => {
  const top = 500, height = 3000, viewport = 1000;
  assert.equal(journeyScrollProgress(top - viewport * .72, top, height, viewport), 0);
  assert.equal(journeyScrollProgress(top - viewport * .72 + height, top, height, viewport), 1);
  assert.equal(journeyScrollProgress(top - viewport * .72 + height / 2, top, height, viewport), .5);
  assert.equal(journeyScrollProgress(1e9, top, height, viewport), 1);
  assert.equal(journeyScrollProgress(-1e9, top, height, viewport), 0);
  assert.equal(journeyScrollProgress(0, top, 0, viewport), 0);
});

test("anchor/history restoration reads current scroll without per-frame layout measurements", () => {
  const view = source("JourneyPath.tsx");
  const update = view.slice(view.indexOf("const update ="), view.indexOf("measure();"));
  assert.match(view, /root.getBoundingClientRect\(\)/);
  assert.match(view, /journeyScrollProgress\(window.scrollY/);
  assert.match(view, /useMotionValue\(0\)/);
  assert.match(view, /addEventListener\("scroll", update, \{ passive: true \}\)/);
  assert.match(view, /addEventListener\("pageshow", update\)/);
  assert.match(view, /addEventListener\("popstate", update\)/);
  assert.match(view, /frame.read\(afterLayout\)/);
  assert.doesNotMatch(update, /getBoundingClientRect|querySelector|scrollHeight/);
  assert.doesNotMatch(view, /useScroll/);
  assert.match(view, /scrollYProgress\.dirty\(\)/);
  assert.match(view, /frame.postRender\(\(\) => reveal\(0\)\)/);
  assert.match(view, /attempt < 4 && draw\.get\(\) === 0/);
  assert.match(view, /if \(disposed\) return;/);
  assert.doesNotMatch(view, /(?:draw|pathOpacity|roofOpacity)\.set\(/);
  assert.doesNotMatch(view, /scrollTo|scrollIntoView|setTimeout|useSpring|useState/);
});

test("layout recalculation batches streaming/image/font/resize changes and disposes safely", () => {
  const layout = fixture(), queue = new Map(), observed = [], listeners = new Map();
  let effect, cleanup, observerCallback, fontReady, geometry, reads = 0, id = 0, disconnected = false;
  const rect = box => ({ left: 104 + (box.left ?? 0), right: 104 + (box.right ?? layout.width), top: 500 + box.top, bottom: 500 + box.bottom, width: (box.right ?? layout.width) - (box.left ?? 0), height: box.bottom - box.top });
  const element = (box, children = []) => ({ children, parentElement: {}, getBoundingClientRect() { reads++; return rect(box); } });
  const anchors = [element({ ...layout.featured, bottom: layout.featured.bottom + 48 }), element(layout.discover, Object.values(layout.chapters.discover).map(b => element(b))), element(layout.manage, Object.values(layout.chapters.manage).map(b => element(b))), element(layout.workflow), element(layout.cta)];
  const selectors = ["[data-journey-featured]", "[data-product-chapter=discover]", "[data-product-chapter=manage]", "#how-it-works > div", "[data-journey-cta] h2"];
  const root = { getBoundingClientRect() { reads++; return { left: 104, right: 1336, top: 500, width: 1232, height: 3400 }; }, querySelector: s => selectors.includes(s) ? anchors[selectors.indexOf(s)] : { offsetWidth: 768 }, addEventListener: (name, fn) => listeners.set(`root:${name}`, fn), removeEventListener: name => listeners.delete(`root:${name}`) };
  const dependencies = {
    react: { useRef: () => ({ current: root }), useState: () => [null, setter => { geometry = setter(geometry); }], useLayoutEffect: fn => { effect = fn; } },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
    "@/hooks/use-landing-motion": { useLandingReducedMotion: () => false },
    "./journey-geometry": { buildJourneyGeometry, JOURNEY_DESKTOP_WIDTH: 976, JOURNEY_READING_LINE: .72 },
    "./JourneyPath": { default: "JourneyPath" }, "./journey.module.css": { default: {} },
  };
  const context = { exports: {}, require: name => dependencies[name],
    window: { innerHeight: 1000, scrollY: 0, addEventListener: (name, fn) => listeners.set(`window:${name}`, fn), removeEventListener: name => listeners.delete(`window:${name}`) },
    document: { documentElement: { clientWidth: 1440, scrollHeight: 9000 }, fonts: { ready: { then: fn => { fontReady = fn; } } } },
    getComputedStyle: () => ({ paddingBottom: "48px", marginTop: "80px" }),
    requestAnimationFrame: fn => { queue.set(++id, fn); return id; }, cancelAnimationFrame: key => queue.delete(key),
    ResizeObserver: class { constructor(fn) { observerCallback = fn; } observe(e) { observed.push(e); } disconnect() { disconnected = true; } },
  };
  vm.runInNewContext(ts.transpileModule(source("JourneyScene.tsx"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  context.exports.default({ children: null }); cleanup = effect();
  assert.equal(reads, 0); assert.equal(queue.size, 1);
  observerCallback(); listeners.get("root:load")(); listeners.get("window:resize")(); fontReady();
  assert.equal(queue.size, 1, "all layout signals share one pending frame");
  const callback = queue.values().next().value; queue.clear(); callback();
  assert(geometry); assert.equal(geometry.points[0].y, layout.featured.bottom + 24);
  assert.equal(observed.length, 10); assert(!listeners.has("window:scroll"));
  const settledReads = reads;
  observerCallback(); assert.equal(reads, settledReads); assert.equal(queue.size, 1); cleanup(); fontReady();
  assert(disconnected); assert.equal(queue.size, 0); assert.equal(listeners.size, 0);
});

test("decorative overlay is scoped, pointer-transparent and hidden for mobile/reduced motion", () => {
  const css = source("journey.module.css"), cta = source("JourneyCta.tsx");
  assert.match(css, /\.referenceContent > :global\(section\[aria-labelledby="thriving-title"\]\)/);
  assert.match(css, /border-top-color: transparent/);
  assert.doesNotMatch(css, /border(?:-top)?: (?:0|none)|\.scene[^}]*overflow: hidden/);
  assert.match(css, /pointer-events: none/);
  assert.match(css, /max-width: 767px/); assert.match(css, /prefers-reduced-motion: reduce/); assert.match(css, /html\.apt-reduce-motion/);
  assert.match(cta, /data-cta-accents aria-hidden="true"/);
  assert.match(cta, /Your next chapter starts here\./);
  assert.match(cta, /Discover a place that fits your lifestyle with APT\./);
  assert.match(cta, /href="\/browse" prefetch=\{false\}/);
});

test("landing retains streamed real sections exactly once and places tenant CTA before owners", () => {
  const page = readFileSync(new URL("../app/(landing)/page.tsx", import.meta.url), "utf8");
  for (const name of ["HeroSection", "ProductShowcaseSection", "RentalStepsSection", "JourneyCta", "OwnerCtaSection", "AppSection", "TeamSection", "FaqSection", "ContactSection"]) assert.equal((page.match(new RegExp(`<${name}\\b`, "g")) ?? []).length, 1);
  assert(page.indexOf("<HeroSection") < page.indexOf("<JourneyScene>"));
  assert(page.indexOf("<JourneyCta") < page.indexOf("</JourneyScene>") && page.indexOf("</JourneyScene>") < page.indexOf("<OwnerCtaSection"));
  assert.match(page, /<Suspense fallback=\{<FeaturedApartmentsState state="loading" \/>\}>/);
  assert.match(page, /<FeaturedApartments supabase=\{supabase\}/);
});

test("production import graph needs neither preview directory and retains real mobile animation modules", () => {
  const web = fileURLToPath(new URL("../", import.meta.url)), visited = new Set();
  const resolve = file => [file, ...[".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"].map(ext => file + ext)].find(candidate => /\.(?:ts|tsx|js|mjs)$/.test(candidate) && existsSync(candidate));
  const visit = file => {
    if (visited.has(file)) return; visited.add(file);
    assert(!/app[\\/]about[\\/](journey-demo|mobile-demo)[\\/]/.test(file), file);
    const imports = ts.preProcessFile(readFileSync(file, "utf8"), true, true).importedFiles;
    for (const { fileName } of imports) {
      const local = fileName.startsWith("@/") ? path.join(web, fileName.slice(2)) : fileName.startsWith(".") ? path.resolve(path.dirname(file), fileName) : null;
      const target = local && resolve(local); if (target) visit(target);
    }
  };
  visit(path.join(web, "app/(landing)/page.tsx")); visit(path.join(web, "app/(landing)/layout.tsx"));
  assert(visited.has(path.join(web, "app/(main)/components/journey/JourneyPath.tsx")));
  assert(visited.has(path.join(web, "app/(main)/components/mobile-demo/MobileDemo.tsx")));
});
