import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const base = new URL("../app/(main)/components/mobile-demo/", import.meta.url);
const source = (name) => readFileSync(new URL(name, base), "utf8");

function harness(selected = "rentals", environment = "development") {
  const jsx = (type, props) => ({ type, props });
  const cache = new Map();
  const load = (name) => {
    if (cache.has(name)) return cache.get(name);
    const exports = {};
    cache.set(name, exports);
    const dependencies = {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      react: { useState: (initial) => [initial === "rentals" ? selected : initial, () => {}], useRef: (value) => ({ current: value }) },
      "@heroui/react": { Button: "Button" },
      "@tabler/icons-react": new Proxy({}, { get: (_, key) => String(key) }),
      "next/image": { default: "Image" },
      "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
      "@/app/(main)/components/mobile-demo/demo-fonts": { demoInter: { variable: "inter" }, demoNunito: { variable: "nunito" } },
      "motion/react": { motion: { span: "motion.span" } },
      "next/dynamic": { default: () => "DynamicMobileDemo" },
      "./use-demo-playback": { useDemoPlayback: () => ({
        state: { screen: selected, layers: [{ id: selected, screen: selected }], revision: 0, running: false, userPaused: true },
        controller: { select() {}, pause() {}, resume() {}, replay() {} }, touch: {}, reduced: true,
      }) },
      "./mobile-demo.module.css": { default: new Proxy({}, { get: (_, key) => String(key) }) },
    };
    vm.runInNewContext(ts.transpileModule(source(name), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, {
      exports,
      process: { env: { NODE_ENV: environment } },
      require: (dependency) => {
        if (dependency in dependencies) return dependencies[dependency];
        if (dependency === "@/app/(main)/components/mobile-demo/MobileDemo") return load("MobileDemo.tsx");
        if (dependency.startsWith("./")) {
          const filename = dependency.slice(2);
          return load(`${filename}.${existsSync(new URL(`${filename}.ts`, base)) ? "ts" : "tsx"}`);
        }
        throw new Error(`Unexpected demo dependency: ${dependency}`);
      },
    });
    return exports;
  };
  return load;
}

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (typeof node.type === "function") return nodes(node.type(node.props));
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}

function text(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!node || typeof node !== "object") return "";
  if (typeof node.type === "function") return text(node.type(node.props));
  return [node.props?.children].flat(Infinity).map(text).join(" ");
}

for (const selected of ["rentals", "payments", "messages", "conversation"]) {
  test(`static ${selected} renders inside the fixed viewport with correct navigation`, () => {
    const load = harness(selected);
    const tree = load("MobileDemo.tsx").default();
    const all = nodes(tree);
    assert.equal(all.filter((node) => node.props?.["data-demo-screen"] === selected).length, 1);
    assert.equal(all.filter((node) => node.props?.["data-demo-screen"]).length, 1);
    assert.equal(all.filter((node) => node.props?.["data-demo-viewport"] === "412x915").length, 1);
    assert.equal(all.filter((node) => Object.hasOwn(node.props ?? {}, "data-demo-tab-bar")).length, ["rentals", "messages"].includes(selected) ? 1 : 0);
    const controls = all.filter((node) => node.type === "Button");
    assert.equal(controls.length, 6);
    assert.equal(controls.filter((node) => node.props["aria-pressed"]).length, 1);
    const screen = all.find((node) => node.props?.["data-demo-screen"]);
    assert.equal(nodes(screen).filter((node) => ["a", "button", "input", "textarea", "form"].includes(node.type)).length, 0);
    assert.equal(all.filter((node) => typeof node.props?.onClick === "function").length, 0);
  });
}

test("the reference contains the actual receipts/history shortcuts, not a fake Pay Now history route", () => {
  const tree = harness()("DemoDashboard.tsx").default();
  const all = nodes(tree);
  assert.equal(all.filter((node) => node.props?.["data-demo-destination"] === "payments").length, 2);
  assert.equal(all.filter((node) => node.props?.["data-demo-inert"] === "checkout").length, 1);
  for (const label of ["Monthly rent", "Quick Actions", "Receipts", "Applications", "Repairs", "Settings", "FAQ", "Maintenance"]) assert.match(text(tree), new RegExp(label));
});

test("landing presentation reuses the same screens/controller without preview chrome or wheel interception", () => {
  const tree = harness()("MobileDemo.tsx").default({ presentation: "landing" });
  const all = nodes(tree);
  assert.equal(all.filter((node) => node.type === "h1").length, 0);
  assert.equal(all.filter((node) => node.type === "Button").length, 2);
  assert.equal(all.filter((node) => node.props?.["aria-label"] === "Choose a static mobile screen").length, 0);
  const stage = all.find((node) => node.props?.id === "landing-mobile-demo");
  assert(stage);
  assert.equal(stage.props.onWheelCapture, undefined);
  assert.equal(stage.props.onPointerDownCapture, undefined);
  assert.equal(stage.props.onFocusCapture, undefined);
  const viewport = all.find((node) => node.props?.["data-demo-viewport"]);
  assert.equal(viewport.props["aria-hidden"], true);
  assert.equal(viewport.props["aria-describedby"], "landing-mobile-demo-description");
  assert(all.some((node) => node.props?.inert === true));
  assert.equal(all.find((node) => node.props?.["data-demo-screen"]).props["data-demo-screen"], "rentals");
});

test("landing bundle boundary and static poster share a stable frame, fonts and responsive slot", () => {
  const loader = harness()("LandingMobileDemo.tsx").default({ fontClassName: "original-mobile-fonts" });
  assert.equal(loader.props.className, "original-mobile-fonts");
  assert.equal(loader.props.style.display, "contents");
  assert.equal(nodes(loader).find((node) => node.type === "DynamicMobileDemo").props.presentation, "landing");
  const poster = nodes(harness()("LandingDemoPoster.tsx").default());
  assert.equal(poster.filter((node) => node.props?.["data-demo-viewport"] === "412x915").length, 1);
  assert(poster.filter((node) => node.type === "Button").every((node) => node.props.isDisabled));
  assert.match(source("LandingMobileDemo.tsx"), /dynamic\(\(\) => import\("\.\/MobileDemo"\), \{ loading: LandingDemoPoster \}\)/);
  assert.doesNotMatch(source("LandingMobileDemo.tsx"), /ssr:\s*false/);
  const css = source("mobile-demo.module.css");
  assert.match(css, /\.embedded \.previewStage[^}]*pointer-events: none/);
  assert.match(css, /min-width: 768px[^]*\.embedded[^}]*margin: 0 48px 0 auto/);
  assert.match(css, /min-width: 1024px[^]*\.embedded[^}]*width: 416px/);
  assert.match(css, /\.embedded \.playbackControls > button[^}]*min-height: 44px/);
});

test("history is fixed, grouped and excludes pending records; messages are fictional local text", () => {
  const data = harness()("demo-data.ts");
  assert.equal(data.DEMO_PAYMENTS.length, 6);
  assert(data.DEMO_PAYMENTS.every((payment) => payment.status === "Paid"));
  assert.equal(new Set(data.DEMO_PAYMENTS.map((payment) => payment.year)).size, 2);
  assert(data.DEMO_MESSAGES.every((message) => message.id.startsWith("demo-") && typeof message.text === "string"));
  assert.equal(data.DEMO_RENTAL.cover, "/landing/hero-living-room.png");
});

test("conversation preserves actual composer wording, bubble grouping, intro and safety copy", () => {
  const tree = harness()("DemoConversation.tsx").default();
  assert.match(text(tree), /Type a message\.\.\./);
  assert.match(text(tree), /Keep payments inside APT, never through chat\./);
  const all = nodes(tree);
  assert.equal(all.filter((node) => Object.hasOwn(node.props ?? {}, "data-joins-above")).length, 8);
  assert(all.some((node) => node.props?.["data-joins-above"] === true));
  assert(all.some((node) => node.props?.["data-joins-below"] === true));
  assert.equal(all.filter((node) => node.props?.className === "systemNavigation").length, 1);
});

test("demo remains isolated from native/auth/services and has no backend calls or independent timers", () => {
  for (const name of readdirSync(base).filter((name) => /\.tsx?$/.test(name))) {
    const code = source(name);
    assert.doesNotMatch(code, /from\s+["'](?:react-native|expo[^"']*|@repo\/supabase|@supabase\/|.*\/hooks\/auth|.*\/service\/)/);
    assert.doesNotMatch(code, /\b(?:fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  }
});

test("the 28.8-second storyboard follows the real navigation and correct tap targets", () => {
  const { sampleDemo, DEMO_DURATION } = harness()("demo-timeline.ts");
  assert.equal(DEMO_DURATION, 28.8);
  const scenes = [[0, "rentals"], [3.8, "payments"], [10.5, "rentals"], [12.03, "messages"], [14.6, "conversation"], [23.8, "messages"], [25.23, "rentals"]];
  for (const [time, screen] of scenes) {
    const frame = sampleDemo(time);
    assert.equal(frame.screen, screen);
    assert.equal(frame.layers.length, 1, `settled scene at ${time}`);
  }
  for (const [time, target] of [[3.2, "history"], [9.9, "back"], [11.6, "messages"], [14, "landlord"], [23.2, "back"], [24.8, "rentals"]]) {
    const tap = sampleDemo(time).tap;
    assert.equal(tap.target, target);
    assert(tap.opacity > 0 && tap.press < 1);
  }
  assert.equal(sampleDemo(28.8).tap, null);
  assert.equal(sampleDemo(0).layers[0].scroll, sampleDemo(28.8).layers[0].scroll);
  assert.equal(sampleDemo(0).layers[0].opacity, sampleDemo(28.8).layers[0].opacity);
});

test("transitions are bounded, tabs never slide, and scrolls use actual normalized extents", () => {
  const { sampleDemo } = harness()("demo-timeline.ts");
  const push = sampleDemo(3.6);
  assert.equal(push.layers.length, 2);
  assert(push.layers[1].y > 0 && push.layers[1].y < 24);
  assert(push.layers[1].opacity > 0 && push.layers[1].opacity < 1);
  assert(sampleDemo(11.9).layers.every((layer) => layer.y === 0));
  assert(sampleDemo(25.1).layers.every((layer) => layer.y === 0));
  assert(sampleDemo(6.7).layers[0].scroll > 0 && sampleDemo(6.7).layers[0].scroll < 1);
  assert.equal(sampleDemo(8.3).layers[0].scroll, 1);
  assert.equal(sampleDemo(18.7).layers[0].scroll, -1);
  assert(sampleDemo(21).layers[0].scroll < 0);
  assert.equal(sampleDemo(22.1).layers[0].scroll, 0);
});

test("playback waits for visibility, foreground and assets; manual pause survives re-entry", () => {
  const { DemoPlaybackController } = harness()("demo-playback-controller.ts");
  const controller = new DemoPlaybackController();
  const calls = [];
  const detach = controller.attach({ play: () => calls.push("play"), pause: () => calls.push("pause"), stop: () => calls.push("stop"), seek: (time) => calls.push(`seek:${time}`) });
  assert.equal(controller.getSnapshot().running, false);
  controller.setEnvironment({ visible: true, documentVisible: true });
  assert.equal(controller.getSnapshot().running, false);
  controller.setEnvironment({ ready: true });
  assert.equal(controller.getSnapshot().running, true);
  controller.tick(6.4);
  const before = controller.getSnapshot();
  controller.tick(6.5);
  assert.equal(controller.getSnapshot(), before, "no React notification on each scroll frame");
  controller.pause();
  assert.equal(controller.getSnapshot().running, false);
  controller.setEnvironment({ visible: false });
  controller.setEnvironment({ visible: true });
  assert.equal(controller.getSnapshot().running, false);
  controller.resume();
  assert.equal(controller.getSnapshot().screen, "payments");
  assert.equal(controller.getSnapshot().running, true);
  controller.setEnvironment({ documentVisible: false });
  assert.equal(controller.getSnapshot().running, false);
  controller.setEnvironment({ documentVisible: true });
  assert.equal(controller.getSnapshot().running, true);
  detach();
  assert.equal(calls.at(-1), "stop");
});

test("manual selection, Replay and live reduced motion reset all timeline-driven effects", () => {
  const { DemoPlaybackController } = harness()("demo-playback-controller.ts");
  const controller = new DemoPlaybackController();
  const seeks = [];
  controller.attach({ play() {}, pause() {}, stop() {}, seek: (time) => seeks.push(time) });
  controller.setEnvironment({ visible: true, documentVisible: true, ready: true });
  controller.select("conversation");
  assert.equal(controller.getSnapshot().screen, "conversation");
  assert.equal(controller.getSnapshot().userPaused, true);
  assert.equal(seeks.at(-1), 14.6);
  controller.replay();
  assert.equal(controller.getSnapshot().screen, "rentals");
  assert.equal(controller.getSnapshot().running, true);
  assert.equal(seeks.at(-1), 0);
  controller.tick(19);
  controller.setEnvironment({ reduced: true });
  assert.equal(controller.getSnapshot().screen, "rentals");
  assert.equal(controller.getSnapshot().running, false);
  controller.resume();
  assert.equal(controller.getSnapshot().running, false);
  controller.select("messages");
  assert.equal(controller.getSnapshot().screen, "messages");
  controller.replay();
  assert.equal(controller.getSnapshot().screen, "rentals");
  assert.equal(controller.getSnapshot().running, false);
});

test("fonts are the original mobile binaries with explicit matching weights", () => {
  for (const name of ["Inter_24pt-Regular.ttf", "Nunito-Regular.ttf", "Nunito-SemiBold.ttf", "Nunito-Bold.ttf"]) {
    const original = readFileSync(new URL(`../../../../../mobile/assets/fonts/${name}`, base));
    const copied = readFileSync(new URL(`fonts/${name}`, base));
    assert.equal(Buffer.compare(original, copied), 0, name);
  }
  assert.match(source("demo-fonts.ts"), /next\/font\/local/);
  for (const weight of ["400", "600", "700"]) assert.match(source("demo-fonts.ts"), new RegExp(`weight: "${weight}"`));
});

test("source-derived light palette and fixed geometry do not depend on host theme or motion", () => {
  const css = source("mobile-demo.module.css");
  for (const color of ["#376bf5", "#2f5fe0", "#f5f7fb", "#e9ecef", "#e5eaf2", "#626b73"]) assert(css.includes(color));
  assert.match(css, /width: 412px; height: 915px;/);
  assert.match(css, /height: 257px/);
  assert.match(css, /height: 68px/);
  assert.match(css, /aspect-ratio: 436 \/ 939/);
  assert.match(css, /container-type: inline-size/);
  assert.match(css, /transform: scale\(calc\(100cqw \/ 436px\)\)/);
  assert.match(css, /flex-direction: column-reverse/);
  assert.doesNotMatch(css, /animation:|transition:|scroll-behavior:\s*smooth/);
});

test("standalone preview is available in development and absent from production", () => {
  const page = "../../../about/mobile-demo/page.tsx";
  assert(harness()(page).default());
  assert.throws(() => harness("rentals", "production")(page).default(), /NOT_FOUND/);
});
