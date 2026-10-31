import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildJourneyGeometry, JOURNEY_READING_LINE, JOURNEY_ARC_PACING_WEIGHT, JOURNEY_CTA_GAP, JOURNEY_FADE_DISTANCE, journeyMarkerPoint, journeyMarkerAngle, journeyMarkerDiameter, journeyPathOpacity } from "./journey-geometry.ts";
import { CTA_HIGHLIGHT_DURATION, CTA_HIGHLIGHT_RESET_DISTANCE, CTA_ACCENT_KEYFRAMES, CTA_BUTTON_KEYFRAMES, ctaHighlightTransition } from "./cta-highlight.ts";

function fixture(width = 1232) {
  const discoverMediaRight = (width - 64) * 0.56;
  const manageCopyRight = (width - 64) * 0.44;
  return { width, height: 3400,
    featured: { top: 40, bottom: 440 },
    discover: { top: 800, bottom: 1400 },
    manage: { top: 1480, bottom: 2080 },
    workflow: { top: 2240, bottom: 3040 },
    cta: { top: 3160, bottom: 3206, left: width * .26, right: width * .74 },
    sideSpace: width >= 1232 ? 104 : 24,
    chapters: width >= 976 ? {
      introBottom: 720, introRight: (width + 768) / 2,
      discover: { copy: { left: discoverMediaRight + 64, right: width, top: 980, bottom: 1220 },
        media: { left: 0, right: discoverMediaRight, top: 800, bottom: 1400 } },
      manage: { copy: { left: 0, right: manageCopyRight, top: 1620, bottom: 1940 },
        media: { left: manageCopyRight + 64, right: width, top: 1480, bottom: 2080 } },
    } : undefined };
}

function pointAtReadingPosition(geometry, y) {
  const index = geometry.scrollProgress.findIndex(value => value * geometry.height >= y);
  assert(index > 0 && index < geometry.points.length);
  const before = geometry.scrollProgress[index - 1] * geometry.height;
  const after = geometry.scrollProgress[index] * geometry.height;
  const fraction = (y - before) / (after - before);
  return {
    x: geometry.points[index - 1].x + (geometry.points[index].x - geometry.points[index - 1].x) * fraction,
    y: geometry.points[index - 1].y + (geometry.points[index].y - geometry.points[index - 1].y) * fraction,
  };
}

for (const width of [720, 976, 1232]) {
  test(`one continuous path stays in the ${width}px layout's whitespace`, () => {
    const layout = fixture(width);
    const geometry = buildJourneyGeometry(layout);
    assert(geometry);
    assert.equal((geometry.path.match(/M /g) ?? []).length, 1);
    assert(geometry.path.includes("C "));
    for (const point of geometry.points) {
      const radius = geometry.markerDiameter / 2;
      assert(point.x - radius >= -layout.sideSpace && point.x + radius <= width + layout.sideSpace);
      if (point.y + radius > layout.workflow.top && point.y - radius < layout.workflow.bottom) {
        assert(point.x + radius <= 1e-9, "the outside lane keeps the whole badge clear of the workflow panel");
      }
      assert(point.y >= layout.featured.bottom + 24 && point.y < layout.cta.top);
      for (const name of ["discover", "manage"]) {
        const boxes = layout.chapters ? Object.values(layout.chapters[name]) : [{ ...layout[name], left: 0, right: width }];
        for (const box of boxes) {
          const nearestX = Math.max(box.left, Math.min(box.right, point.x));
          const nearestY = Math.max(box.top, Math.min(box.bottom, point.y));
          assert(Math.hypot(point.x - nearestX, point.y - nearestY) >= radius - 1e-8, `${name} copy and media stay clear of the whole badge`);
        }
      }
    }
    assert.equal(geometry.points.at(-1).x, (layout.cta.left + layout.cta.right) / 2);
    assert.equal(geometry.points.at(-1).y, layout.cta.top - geometry.markerDiameter / 2 - JOURNEY_CTA_GAP);
    assert.equal(geometry.markerDiameter, width >= 1232 ? 32 : width >= 976 ? 22 : 20);
  });
}

test("arc-length lookup is finite, strictly ordered and reversible without a playback clock", () => {
  const geometry = buildJourneyGeometry(fixture());
  assert(geometry);
  assert.equal(geometry.scrollProgress.length, geometry.drawProgress.length);
  assert.equal(geometry.drawProgress[0], 0);
  assert.equal(geometry.drawProgress.at(-1), 1);
  for (let index = 1; index < geometry.scrollProgress.length; index++) {
    assert(geometry.scrollProgress[index] > geometry.scrollProgress[index - 1]);
    assert(geometry.drawProgress[index] > geometry.drawProgress[index - 1]);
  }
  assert.equal(JOURNEY_READING_LINE, 0.72);
  const sameLayout = buildJourneyGeometry(fixture());
  assert.deepEqual(geometry, sameLayout, "scroll direction does not alter or retire geometry");
});

test("responsive geometry is recomputed from anchors, not one screenshot's giant path", () => {
  const initial = buildJourneyGeometry(fixture());
  const taller = fixture(720);
  taller.discover.bottom += 300;
  for (const name of ["manage", "workflow", "cta"]) {
    taller[name].top += 300;
    taller[name].bottom += 300;
  }
  taller.height += 300;
  const updated = buildJourneyGeometry(taller);
  assert(updated);
  assert.notEqual(initial.path, updated.path);
  assert.equal(updated.points.at(-1).y, taller.cta.top - updated.markerDiameter / 2 - JOURNEY_CTA_GAP);
});

test("chapter-local pacing stays near the reading position and budgets the short sidestep", () => {
  const geometry = buildJourneyGeometry(fixture());
  assert.equal(JOURNEY_ARC_PACING_WEIGHT, .3);
  for (let index = 0; index < geometry.scrollProgress.length; index++) {
    assert(Math.abs(geometry.scrollProgress[index] * geometry.height - geometry.points[index].y) <= 96);
  }
  const from = geometry.scrollProgress[64 * 3] * geometry.height;
  const to = geometry.scrollProgress[64 * 4] * geometry.height;
  assert.equal(to - from, 144, "the 80px chapter gap receives a 144px scroll interval");
  assert(Math.abs(geometry.scrollProgress[0] * geometry.height - geometry.points[0].y) < 1e-8);
  assert(Math.abs(geometry.scrollProgress.at(-1) * geometry.height - geometry.points.at(-1).y) < 1e-8);
});

test("the marker remains beside each chapter's copy throughout its reading interval", () => {
  for (const width of [976, 1232]) {
    const layout = fixture(width);
    const geometry = buildJourneyGeometry(layout);
    for (const name of ["discover", "manage"]) {
      const { copy, media } = layout.chapters[name];
      const lane = name === "discover" ? (copy.left + media.right) / 2 : (copy.right + media.left) / 2;
      for (const fraction of [.1, .25, .5, .75, .9]) {
        const y = copy.top + (copy.bottom - copy.top) * fraction;
        const marker = pointAtReadingPosition(geometry, y);
        assert(Math.abs(marker.x - lane) < 1e-8);
        assert(Math.abs(marker.y - y) < 32, "earlier curves must not pull the marker out of this reading interval");
      }
    }
    const altered = fixture(width);
    altered.chapters.discover.copy.top += 20;
    const laterReadingY = layout.chapters.manage.copy.top + 100;
    assert.deepEqual(pointAtReadingPosition(geometry, laterReadingY), pointAtReadingPosition(buildJourneyGeometry(altered), laterReadingY));
  }
});

test("crowded, mobile or invalid layouts hide the decoration instead of crossing content", () => {
  assert.equal(buildJourneyGeometry(fixture(327)), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), height: 0 }), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), width: NaN }), null);
  const crowded = fixture();
  crowded.cta.top = crowded.workflow.bottom + 50;
  assert.equal(buildJourneyGeometry(crowded), null);
  const invalid = fixture();
  invalid.workflow.bottom = invalid.workflow.top - 1;
  assert.equal(buildJourneyGeometry(invalid), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), sideSpace: 10 }), null);
  assert.equal(buildJourneyGeometry({ ...fixture(), chapters: undefined }), null);
  const narrow = fixture();
  narrow.chapters.discover.copy.left = narrow.chapters.discover.media.right + 20;
  assert.equal(buildJourneyGeometry(narrow), null);
  const overlap = fixture();
  overlap.manage.top = overlap.discover.bottom + 10;
  overlap.chapters.manage.media.top = overlap.manage.top;
  assert.equal(buildJourneyGeometry(overlap), null, "crowded transition must hide rather than intersect devices");
});

test("marker samples the real stroke at the exact effective progress, forward and backward", () => {
  const distances = [];
  const path = { getPointAtLength: distance => { distances.push(distance); return { x: distance, y: distance * 2 }; } };
  for (const progress of [0, .25, .5, .75, 1, .75, .5, .25, 0]) {
    const point = journeyMarkerPoint(path, 400, progress);
    assert.deepEqual(point, { x: 400 * progress, y: 800 * progress });
  }
  assert.deepEqual(distances, [0, 100, 200, 300, 400, 300, 200, 100, 0]);
  assert.equal(journeyMarkerPoint(path, 400, -1).x, 0);
  assert.equal(journeyMarkerPoint(path, 400, 2).x, 400);
  assert.equal(journeyMarkerPoint(path, 400, NaN).x, 0);
});

test("badge size follows the measured gutter and never enters section content", () => {
  assert.equal(journeyMarkerDiameter(1440, 104), 32);
  assert.equal(journeyMarkerDiameter(976, 24), 22);
  assert.equal(journeyMarkerDiameter(720, 24), 20);
  assert.equal(buildJourneyGeometry({ ...fixture(976), sideSpace: 20 }), null, "a gutter narrower than the badge hides it");
  const roomy = buildJourneyGeometry({ ...fixture(1232), sideSpace: 40 });
  assert(roomy);
  assert.equal(roomy.markerDiameter, 32);
});

test("refined cubics share forward tangents, including diagonal and horizontal shoulders", () => {
  for (const width of [720, 976, 1232]) {
    const layout = fixture(width);
    const geometry = buildJourneyGeometry(layout);
    const commands = geometry.path.split("C ").slice(1).map(command => command.trim().split(/\s+/).map(Number));
    assert.equal(commands.length, width >= 976 ? 10 : 4);
    for (let index = 1; index < commands.length; index++) {
      const [, , c2x, c2y, x, y] = commands[index - 1];
      const [c1x, c1y] = commands[index];
      const incoming = { x: x - c2x, y: y - c2y };
      const outgoing = { x: c1x - x, y: c1y - y };
      const product = Math.hypot(incoming.x, incoming.y) * Math.hypot(outgoing.x, outgoing.y);
      assert(product > 0, "no zero-length tangent hides a corner");
      assert(incoming.x * outgoing.x + incoming.y * outgoing.y > 0, "joins never reverse direction");
      assert(Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x) / product < .001, "G1 tangent continuity survives SVG coordinate rounding");
    }
    const [, , c2x, c2y, endX, endY] = commands.at(-1);
    assert.equal(c2x, endX, "approach the measured destination from above");
    assert(c2y < endY);
    for (let index = 0; index < geometry.points.length; index++) {
      const point = geometry.points[index];
      if (index > 0) {
        assert(point.y > geometry.points[index - 1].y, "continuous downward travel");
      }
    }
  }
});

test("desktop introduces the alternating chapters, while tablet avoids stacked content", () => {
  const layout = fixture();
  const desktop = buildJourneyGeometry(layout);
  assert(desktop.points[0].x > layout.chapters.introRight, "start near the lower outer edge of Featured Apartments");
  const laneMoves = [0, 1, 2, 3, 4, 5, 6, 7].filter(index => Math.abs(desktop.points[(index + 1) * 64].x - desktop.points[index * 64].x) > 1);
  assert.deepEqual(laneMoves, [0, 1, 3, 5, 6, 7], "the same lateral journeys now include their entry/exit shoulders, not extra loops");
  const tabletLayout = fixture(720);
  const tablet = buildJourneyGeometry(tabletLayout);
  for (const point of tablet.points) {
    if (point.y >= tabletLayout.discover.top && point.y <= tabletLayout.workflow.bottom) assert(point.x < 0);
  }
  assert.equal(desktop.points.at(-1).x, (layout.cta.left + layout.cta.right) / 2, "resolve above the heading's actual center");
});

test("all approved scroll inputs and completion thresholds remain byte-for-byte unchanged", () => {
  const baseline = {
    720: "23e5cb6a8482c552c52557a1686285eda9bce1c31df5a03ef245bf017f5dd5ba",
    976: "5c88e6804f4966bfb32160578398daf6b33d80f9781030cfb4cb4a88d51c7dd2",
    1232: "528ab7cc4144920eefa9d54e5af3502dbc760fb035c5fb5aaf4404bbd2b8c0bb",
  };
  for (const width of [720, 976, 1232]) {
    const geometry = buildJourneyGeometry(fixture(width));
    const contract = { scrollProgress: geometry.scrollProgress, completion: geometry.completion };
    assert.equal(createHash("sha256").update(JSON.stringify(contract)).digest("hex"), baseline[width]);
  }
});

test("untargeted Discover reading rail, Discover-to-Manage sidestep and Manage reading rail stay unchanged", () => {
  const baseline = {
    720: "a854d1a35d55383180426fda41eeb728b0b06cfdb30b1234c9f42e88fe4c77c0",
    976: "ac90d93c6c5ccd4e6ff19100b3cf0b37a5b2477c2d8ef5a270969faeca06d038",
    1232: "16f395cb7bb8eb2c48c59613db54299aaffe1fb4296fc3efc9ff52411ff4b2a2",
  };
  for (const width of [720, 976, 1232]) {
    const geometry = buildJourneyGeometry(fixture(width));
    const protectedGeometry = width === 720 ? { path: geometry.path.split("C ").slice(0, 2), points: geometry.points.slice(0, 65) } :
      { path: geometry.path.split("C ").slice(4, 7), points: geometry.points.slice(128, 321) };
    assert.equal(createHash("sha256").update(JSON.stringify(protectedGeometry)).digest("hex"), baseline[width]);
  }
});

test("entry shoulders use only the measured right-side introduction clearance", () => {
  for (const width of [976, 1232]) {
    const layout = fixture(width);
    const geometry = buildJourneyGeometry(layout);
    const initial = geometry.points[0];
    const shoulder = geometry.points[64];
    assert(shoulder.x < initial.x, "the inward turn now begins before the old vertical-to-curve join");
    assert(initial.x - shoulder.x <= 48);
    for (const p of geometry.points) {
      if (p.y <= layout.chapters.introBottom) {
        assert(p.x - geometry.markerDiameter / 2 >= layout.chapters.introRight + 8);
      }
    }
  }
});

test("dense cubic samples clear panel corners and have no added lateral loops", () => {
  for (const width of [720, 976, 1232]) {
    const layout = fixture(width);
    const geometry = buildJourneyGeometry(layout);
    const radius = geometry.markerDiameter / 2;
    let start = geometry.points[0];
    let previous = start;
    let lateralDirection = -1;
    let directionChanges = 0;
    for (const command of geometry.path.split("C ").slice(1)) {
      const [bx, by, cx, cy, dx, dy] = command.trim().split(/\s+/).map(Number);
      for (let index = 1; index <= 512; index++) {
        const t = index / 512;
        const u = 1 - t;
        const p = { x: u ** 3 * start.x + 3 * u ** 2 * t * bx + 3 * u * t ** 2 * cx + t ** 3 * dx,
          y: u ** 3 * start.y + 3 * u ** 2 * t * by + 3 * u * t ** 2 * cy + t ** 3 * dy };
        assert(p.y >= previous.y - .01, "no upward hooks");
        const movement = p.x - previous.x;
        if (Math.abs(movement) > .0001 && Math.sign(movement) !== lateralDirection) {
          directionChanges++;
          lateralDirection = Math.sign(movement);
        }
        const nearestX = Math.max(0, Math.min(width, p.x));
        const nearestY = Math.max(layout.workflow.top, Math.min(layout.workflow.bottom, p.y));
        assert(Math.hypot(p.x - nearestX, p.y - nearestY) >= radius + .48, "the entire badge clears the workflow, including its lower-left corner");
        previous = p;
      }
      start = { x: dx, y: dy };
    }
    assert.equal(directionChanges, 1, "only the final approach changes from leftward to rightward");
  }
});

test("endpoint centers on the measured heading and accounts for the badge radius", () => {
  for (const width of [720, 976, 1232]) {
    const layout = fixture(width);
    layout.cta = { left: 140, right: 500, top: 3180, bottom: 3280 };
    const geometry = buildJourneyGeometry(layout);
    assert(geometry);
    const end = geometry.points.at(-1);
    assert.equal(end.x, 320, "the heading center, not the viewport center");
    assert.equal(layout.cta.top - (end.y + geometry.markerDiameter / 2), 20, "bottom-edge clearance stays constant for every badge size");
  }
});

test("arrival completes traversal before the independent completion interval", () => {
  const geometry = buildJourneyGeometry(fixture());
  assert.equal(geometry.drawProgress.at(-1), 1);
  assert.equal(geometry.scrollProgress.at(-1), geometry.completion.arrivalProgress);
  assert(Math.abs((geometry.completion.fadeEndProgress - geometry.completion.arrivalProgress) * geometry.height - JOURNEY_FADE_DISTANCE) < 1e-9);
  assert.equal(journeyPathOpacity(geometry.completion.arrivalProgress, geometry.completion), 1);
  assert.equal(journeyPathOpacity(geometry.completion.fadeEndProgress, geometry.completion), 0);
});

test("completion fades continuously, clamps at both ends and reverses without a clock", () => {
  const completion = { arrivalProgress: .9, fadeEndProgress: 1 };
  assert.equal(journeyPathOpacity(.8, completion), 1);
  assert.equal(journeyPathOpacity(.9, completion), 1);
  assert(Math.abs(journeyPathOpacity(.95, completion) - .5) < 1e-12);
  assert.equal(journeyPathOpacity(1, completion), 0);
  assert.equal(journeyPathOpacity(2, completion), 0);
  const positions = Array.from({ length: 101 }, (_, index) => .9 + index / 1000);
  const forward = positions.map(progress => journeyPathOpacity(progress, completion));
  const reverse = [...positions].reverse().map(progress => journeyPathOpacity(progress, completion)).reverse();
  assert.deepEqual(forward, reverse);
  assert(forward.every((value, index) => index === 0 || value <= forward[index - 1]));
  assert.equal(journeyPathOpacity(NaN, completion), 1);
});

test("limited natural scroll shortens only the fade, never the path or its pacing", () => {
  const layout = fixture();
  const normal = buildJourneyGeometry(layout);
  const arrivalY = normal.points.at(-1).y;
  const short = buildJourneyGeometry({ ...layout, scrollLimit: arrivalY + 40 });
  assert(short);
  assert.equal(short.path, normal.path);
  assert.deepEqual(short.scrollProgress, normal.scrollProgress);
  assert.deepEqual(short.drawProgress, normal.drawProgress);
  assert(Math.abs((short.completion.fadeEndProgress - short.completion.arrivalProgress) * short.height - 32) < 1e-9);
  assert.equal(buildJourneyGeometry({ ...layout, scrollLimit: arrivalY }), null);
});

test("the path group fades separately from the continuously visible outer badge", () => {
  const source = readFileSync(new URL("./JourneyPath.tsx", import.meta.url), "utf8");
  assert.match(source, /useTransform\(scrollYProgress, progress => journeyPathOpacity\(progress, geometry\.completion\)\)/);
  assert.match(source, /<motion\.g data-journey-strokes style=\{\{ opacity: pathOpacity \}\}>/);
  const groupStart = source.indexOf("<motion.g data-journey-strokes");
  const groupEnd = source.indexOf("</motion.g>", groupStart);
  const strokes = source.slice(groupStart, groupEnd);
  assert.match(strokes, /data-journey-track/);
  assert.match(strokes, /data-journey-active/);
  const markerStart = source.indexOf("<g ref={marker}");
  assert(markerStart > groupEnd);
  const markerTag = source.slice(markerStart, source.indexOf(">", markerStart));
  assert.doesNotMatch(markerTag, /opacity|pathOpacity|display:|visibility:|rotate/);
  const scene = readFileSync(new URL("./JourneyScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /geometry && !reduced \? <JourneyPath/);
  assert.match(scene, /window\.addEventListener\("resize", schedule/);
  assert.match(scene, /window\.removeEventListener\("resize", schedule\)/);
});

test("the route stays quieter than the marker in both themes", () => {
  const source = readFileSync(new URL("./JourneyPath.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/strokeWidth="1.5"/g) ?? []).length, 3);
  assert.match(source, /data-journey-track[^>]*strokeOpacity="0.07"/);
  assert.match(source, /data-journey-active[^>]*strokeOpacity="0.75"/);
  assert.equal((source.match(/stroke="var\(--brand\)"/g) ?? []).length, 2);
});

test("the approved roof asset rides the drawn stroke without another trajectory or playback clock", () => {
  const source = readFileSync(new URL("./JourneyPath.tsx", import.meta.url), "utf8");
  assert.match(source, /useMotionValueEvent\(draw, "change", positionMarker\)/);
  assert.match(source, /style=\{\{ pathLength: draw \}\}/);
  assert.match(source, /journeyMarkerPoint\(activePath\.current, totalLength\.current, progress\)/);
  assert.equal((source.match(/getTotalLength\(\)/g) ?? []).length, 1, "length is cached by the layout effect");
  assert.match(source, /href="\/logo\/logo\.svg"/);
  assert.match(source, /data-journey-marker[^>]*aria-hidden="true"/);
  assert.doesNotMatch(source, /useState|setInterval|setTimeout|useSpring/);
  assert.doesNotMatch(source.match(/<g ref=\{marker\}[^>]*>/)[0], /rotate\(/);
  const asset = readFileSync(new URL("../../../public/logo/logo.svg", import.meta.url), "utf8");
  assert.match(asset, /viewBox="0 0 1024 1024"/);
  assert.match(asset, /fill="white"/);
});

test("navigation bearing uses the exact path with a small clamped tangent window", () => {
  const distances = [];
  const vertical = { getPointAtLength(distance) { distances.push(distance); return { x: 0, y: distance }; } };
  assert.equal(journeyMarkerAngle(vertical, 100, .5), 180, "an up-facing icon rotates down on a downward spine");
  assert.deepEqual(distances, [47, 53], "only two nearby samples, not another path length read");
  distances.length = 0;
  assert.equal(journeyMarkerAngle(vertical, 100, 0), 180);
  assert.equal(journeyMarkerAngle(vertical, 100, 1), 180);
  assert.deepEqual(distances, [0, 3, 97, 100], "one-sided endpoint samples stay on the path");
  assert.equal(journeyMarkerAngle({ getPointAtLength: d => ({ x: d, y: 0 }) }, 100, .5), 90);
  assert.equal(journeyMarkerAngle({ getPointAtLength: d => ({ x: -d, y: d }) }, 100, .5), 225);
  assert.equal(journeyMarkerAngle(vertical, 0, .5), 180);
  assert.equal(journeyMarkerAngle({ getPointAtLength: () => ({ x: 0, y: 0 }) }, 100, .5), 180);
});

test("curve bearings scrub back deterministically without a 180-degree velocity flip", () => {
  const path = { getPointAtLength: d => ({ x: d * d / 100, y: d }) };
  const progress = Array.from({ length: 101 }, (_, index) => index / 100);
  const forward = progress.map(value => journeyMarkerAngle(path, 100, value));
  const reverse = [...progress].reverse().map(value => journeyMarkerAngle(path, 100, value)).reverse();
  assert.deepEqual(forward, reverse);
  assert(forward.every(angle => Number.isFinite(angle) && angle >= 90 && angle <= 270));
  assert(forward.every((angle, index) => index === 0 || Math.abs(angle - forward[index - 1]) < 3));
});

test("the arrow crossfades to the approved roof on the existing path-opacity value", () => {
  const source = readFileSync(new URL("./JourneyPath.tsx", import.meta.url), "utf8");
  assert.match(source, /IconNavigationFilled.*from "@tabler\/icons-react"/);
  assert.match(source, /useTransform\(pathOpacity, opacity => 1 - opacity\)/);
  assert.match(source, /data-journey-navigation style=\{\{ opacity: pathOpacity \}\}/);
  assert.match(source, /data-journey-roof[^>]*style=\{\{ opacity: roofOpacity \}\}/);
  assert.match(source, /arrowDirection\.current\?\.setAttribute\("transform", `rotate\(/);
  assert.match(source, /journeyMarkerAngle\(activePath\.current, totalLength\.current, progress\)/);
  assert.match(source, /href="\/logo\/logo\.svg"/);
  assert.doesNotMatch(source.match(/<motion\.g data-journey-roof[^>]*>/)[0], /rotate|scale/);
  const completion = { arrivalProgress: .9, fadeEndProgress: 1 };
  for (const progress of [.8, .9, .925, .95, .975, 1, 1.1, 1, .975, .95, .925, .9]) {
    const arrow = journeyPathOpacity(progress, completion);
    const roof = 1 - arrow;
    assert.equal(arrow + roof, 1);
    if (progress <= .9) assert.deepEqual([arrow, roof], [1, 0]);
    if (progress >= 1) assert.deepEqual([arrow, roof], [0, 1]);
  }
});

test("restoring motion waits for the existing Motion render pass without overriding live bindings", () => {
  const source = readFileSync(new URL("./JourneyPath.tsx", import.meta.url), "utf8");
  const effect = source.slice(source.indexOf("useLayoutEffect(() =>"), source.indexOf("const radius ="));
  assert.match(effect, /scrollYProgress\.set\(/);
  assert.doesNotMatch(effect, /(?:draw|pathOpacity|roofOpacity)\.set\(/, "derived Motion values must retain their scroll bindings");
  assert.doesNotMatch(effect, /\.style\.opacity|setAttribute\("stroke-dasharray"/);
  assert.match(source, /visibility="hidden"/);
  assert.match(effect, /frame\.postRender\(reveal\)/);
  assert.match(effect, /cancelFrame\(reveal\)/);
  assert.match(effect, /removeAttribute\("visibility"\)/);
});

test("divider overrides affect only the two prototype chapter rules and retain layout space", () => {
  const css = readFileSync(new URL("./journey-demo.module.css", import.meta.url), "utf8");
  assert.match(css, /\.referenceContent > :global\(section\[aria-labelledby="thriving-title"\]\),\s*\.referenceContent > :global\(#how-it-works\) \{ border-top-color: transparent; \}/);
  assert.match(css, /\.header \{[^}]*border-bottom: 1px solid var\(--border\)/);
  assert.doesNotMatch(css, /:global\(header\)|:global\(hr\)|\.referenceContent\s+\*/);
  assert.doesNotMatch(css, /border(?:-top)?:\s*(?:0|none)/);
});

test("preview is development-gated and never imported by the production landing route", () => {
  const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  assert.match(page, /process\.env\.NODE_ENV !== "development"\) notFound\(\)/);
  assert(page.indexOf("notFound();") < page.indexOf('await import("./JourneyDemo")'));
  assert.match(page, /index: false, follow: false/);
  const landing = readFileSync(new URL("../../(landing)/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(landing, /journey-demo|JourneyScene|JourneyPath/);
});

test("prototype owns no backend call, autoplay, spring, scroll handler or existing-controller rewrite", () => {
  for (const file of ["JourneyDemo.tsx", "HeroScaffold.tsx", "FeaturedScaffold.tsx", "JourneyScene.tsx", "JourneyPath.tsx"]) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /@repo\/supabase|@supabase|fetch\s*\(|setInterval|setTimeout|useSpring|onScroll|scrollIntoView/);
  }
  const scene = readFileSync(new URL("./JourneyScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /ResizeObserver/);
  assert.match(scene, /observer\.disconnect\(\); cancelAnimationFrame\(frame\)/);
  const path = readFileSync(new URL("./JourneyPath.tsx", import.meta.url), "utf8");
  assert.equal((path.match(/useScroll\(\{/g) ?? []).length, 1);
  assert.match(path, /aria-hidden="true" focusable="false"/);
  assert.match(path, /pathLength: draw/);
  const css = readFileSync(new URL("./journey-demo.module.css", import.meta.url), "utf8");
  assert.match(css, /pointer-events: none/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /html\.apt-reduce-motion/);
  assert.match(css, /max-width: 767px/);
});

test("ending uses the approved tenant copy and real browsing destination", () => {
  const source = readFileSync(new URL("./JourneyDemo.tsx", import.meta.url), "utf8");
  assert.match(source, /Your next chapter starts here\./);
  assert.match(source, /Discover a place that fits your lifestyle with APT\./);
  assert.match(source, /href="\/browse" prefetch=\{false\}/);
  assert(source.indexOf("data-journey-cta") < source.indexOf("<OwnerCtaSection />"));
});

test("CTA accents play once only after the path's full completion, never from idle updates", () => {
  const completion = { arrivalProgress: .7, fadeEndProgress: .85 };
  let state = "armed";
  let plays = 0;
  for (const progress of [0, .69, .7, .8, .84999, .85, .85, .9, 1, .9, .85]) {
    const next = ctaHighlightTransition(state, progress, completion, 1000);
    if (next.play) { plays++; assert(progress >= completion.fadeEndProgress); }
    if (progress < completion.fadeEndProgress) assert(next.cancel);
    state = next.state;
  }
  assert.equal(plays, 1);
  assert.equal(state, "played");
});

test("reverse cancels immediately but requires 24px hysteresis to re-arm and replay", () => {
  assert.equal(CTA_HIGHLIGHT_RESET_DISTANCE, 24);
  const completion = { arrivalProgress: .7, fadeEndProgress: .85 };
  const hover = ctaHighlightTransition("played", .849, completion, 1000);
  assert.deepEqual(hover, { state: "played", play: false, cancel: true });
  assert.equal(ctaHighlightTransition(hover.state, .85, completion, 1000).play, false);
  const reset = ctaHighlightTransition("played", .85 - 24 / 1000, completion, 1000);
  assert.equal(reset.state, "armed");
  assert.deepEqual(ctaHighlightTransition(reset.state, .85, completion, 1000), { state: "played", play: true, cancel: false });
  const short = { arrivalProgress: .7, fadeEndProgress: .705 };
  assert.equal(ctaHighlightTransition("played", .7, short, 1000).state, "armed", "short natural fade intervals reset at arrival");
  assert.equal(ctaHighlightTransition("armed", NaN, completion, 1000).play, false);
  assert.equal(ctaHighlightTransition("armed", .9, completion, 0).play, false);
});

test("the brief one-shot has no held end style and does not animate CTA text or the roof", () => {
  assert.equal(CTA_HIGHLIGHT_DURATION, 800);
  assert.equal(CTA_ACCENT_KEYFRAMES[0].opacity, 0);
  assert.equal(CTA_ACCENT_KEYFRAMES.at(-1).opacity, 0);
  assert(Math.max(...CTA_ACCENT_KEYFRAMES.map(frame => frame.opacity)) <= .6);
  assert.equal(CTA_BUTTON_KEYFRAMES[0].filter, "brightness(1)");
  assert.equal(CTA_BUTTON_KEYFRAMES.at(-1).filter, "brightness(1)");
  const hook = readFileSync(new URL("./use-cta-highlight.ts", import.meta.url), "utf8");
  assert.match(hook, /iterations: 1, fill: "none"/);
  assert.match(hook, /useMotionValueEvent\(progress, "change"/);
  assert.match(hook, /frame\.postRender\(play\)/);
  assert.match(hook, /animation\.cancel\(\)/);
  assert.match(hook, /cancelFrame\(play\)/);
  assert.doesNotMatch(hook, /getBoundingClientRect|getTotalLength|useScroll|setTimeout|setInterval|useState|\.finished|infinite/);
  assert.match(hook, /prefers-reduced-motion: reduce/);
  assert.match(hook, /apt-reduce-motion/);
  assert.match(hook, /window\.innerWidth < 768/);
  assert.doesNotMatch(hook, /(?:marker|roof|heading)\.animate/);
});

test("accent decoration is hidden by default, pointer transparent and absent from mobile/reduced presentation", () => {
  const source = readFileSync(new URL("./JourneyDemo.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("./journey-demo.module.css", import.meta.url), "utf8");
  assert.match(source, /data-cta-accents aria-hidden="true"/);
  assert.match(source, /preserveAspectRatio="none" focusable="false" aria-hidden="true"/);
  assert.match(source, /d="M 4 12 V 228 M 796 12 V 228"/);
  assert.match(css, /\.ctaAccents \{[^}]*position: absolute[^}]*opacity: 0[^}]*pointer-events: none/);
  assert.match(css, /@media \(max-width: 767px\) \{ \.pathLayer, \.ctaAccents \{ display: none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.pathLayer, \.ctaAccents \{ display: none/);
  assert.match(css, /html\.apt-reduce-motion\) \.ctaAccents \{ display: none/);
  assert.doesNotMatch(css, /animation:|@keyframes/);
});
