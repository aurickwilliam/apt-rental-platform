import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };
// Flattens a rendered tree, expanding function components.
const nodes = (node) => {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  const child = typeof node.type === "function" ? node.type(node.props) : node.props?.children;
  return [node, ...nodes(child)];
};
const textOf = (node) =>
  Array.isArray(node) ? node.map(textOf).join("") : typeof node === "string" || typeof node === "number" ? String(node) : node?.props ? textOf(node.props.children) : "";

const apartment = {
  id: "apt-1",
  name: "Kaunlaran Affordable Studio",
  location: "Kaunlaran, Caloocan",
  price: 9000,
  rating: 3.5,
  isVerified: true,
  image: "/photo.jpg",
  bedrooms: 1,
  bathrooms: 1,
  areaSqm: 20,
};

const hitStack = [];
const Preview = compile("app/browse/components/ApartmentHoverPreview.tsx", {
  "react/jsx-runtime": jsxRuntime,
  react: {},
  "next/image": { default: "Image" },
  "@heroui/react": { Button: "Button", Card: "Card", Spinner: "Spinner" },
  "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
  "@repo/utils": { formatPesoDisplay: (value) => `₱${value}` },
  "@/app/components/display/StatusChip": { default: "StatusChip" },
  "@/lib/public-apartment-image": { canOptimizePublicApartmentImage: () => true },
  "@/app/components/ui/PreferenceMatchChips": { default: "PreferenceMatchChips" },
}, { document: { elementsFromPoint: () => hitStack } }).default;

function render(overrides = {}) {
  const calls = { viewed: 0, favorited: 0, stopped: 0, dismissed: 0 };
  const props = {
    apartment,
    style: { left: 10, top: 20, width: 320, fromScale: 0.7 },
    isClosing: false,
    isFavorite: false,
    isFavoriteLoading: false,
    onFavoritePress: () => calls.favorited++,
    onViewDetails: () => calls.viewed++,
    onMouseEnter() {},
    onMouseLeave() {},
    onDismiss: () => calls.dismissed++,
    ...overrides,
  };
  return { tree: nodes(Preview(props)), root: Preview(props), props, calls };
}

test("the whole preview opens the apartment: no View Details button, one clickable surface", () => {
  const { tree, calls } = render();
  assert.ok(!tree.some((node) => node.type === "Button" && /View Details/.test(textOf(node))));
  assert.equal(tree.filter((node) => node.type === "Button").length, 2, "only separate navigation and Favorite buttons; no redundant X");
  const surface = tree.find((node) => node.props["data-preview-navigation"]);
  assert.match(surface.props["aria-label"], /View details of Kaunlaran Affordable Studio/);
  surface.props.onPress();
  assert.equal(calls.viewed, 1);

  assert.equal(surface.props.children, undefined, "the navigation button never contains Favorite");
  tree.find(node => node.props["aria-label"] === "Save to favorites").props.onPress();
  assert.equal(calls.viewed, 1, "Favorite never opens the apartment");
});

test("saving does not open the apartment and sits in the photo's top right", () => {
  const { tree, calls } = render();
  const corner = tree.find((node) => node.type === "span" && /top-2 right-2/.test(node.props.className ?? ""));
  assert.ok(corner, "the favorite button is placed over the photo, top right");
  let stopped = 0;
  corner.props.onClick({ stopPropagation: () => stopped++ });
  assert.equal(stopped, 1);
  assert.equal(calls.viewed, 0);
  const photo = tree.findIndex((node) => node.type === "Image");
  assert.ok(tree.indexOf(corner) > photo, "the button follows the photo in the same card");
});

test("the verified chip is the card's StatusChip, only for verified listings", () => {
  const chip = render().tree.find((node) => node.type === "StatusChip");
  assert.equal(chip.props.tone, "success");
  assert.match(chip.props.className, /top-2 left-2/);
  assert.equal(textOf(chip), "Verified");
  assert.ok(!render({ apartment: { ...apartment, isVerified: false } }).tree.some((node) => node.type === "StatusChip"));
});

test("bed, bath and area share one icon size and stroke", () => {
  const { tree } = render();
  const icons = ["IconBed", "IconBath", "IconMaximize"].map((name) => tree.find((node) => node.type === name));
  for (const icon of icons) {
    assert.ok(icon, "each stat has an icon");
    assert.equal(icon.props.size, 14);
    assert.equal(icon.props.stroke, 1.75);
  }
  assert.deepEqual(
    nodes(Preview(render().props))
      .filter((node) => node.type === "span" && /gap-1.5/.test(node.props.className ?? ""))
      .map(textOf),
    ["1 BR", "1 BA", "20 sqm"],
  );
});

test("monthly rent follows title/location and precedes the specifications", () => {
  const { tree } = render();
  const price = tree.find((node) => node.type === "span" && textOf(node) === "₱9000");
  assert.match(price.props.className, /text-2xl/);
  const stats = tree.findIndex((node) => node.type === "IconMaximize");
  const location = tree.findIndex(node => node.type === "p" && textOf(node) === apartment.location);
  assert.ok(tree.indexOf(price) > location);
  assert.ok(tree.indexOf(price) < stats);
  assert.ok(tree.some(node => node.type === "span" && textOf(node) === "/ month"));
});

test("closing and the grow-from-card scale are exposed for the CSS animation", () => {
  const open = Preview(render().props);
  assert.equal(open.props["data-closing"], undefined);
  assert.equal(open.props.style["--hover-from-scale"], 0.7);
  assert.match(open.props.className, /apt-hover-preview/);
  const closing = Preview({ ...render().props, isClosing: true });
  assert.equal(closing.props["data-closing"], "true");
});

test("preview typography prioritizes title and rent over supporting details", () => {
  const { tree } = render();
  const heading = tree.find(node => node.type === "h4");
  const location = tree.find(node => node.type === "p" && textOf(node) === apartment.location);
  const price = tree.find(node => node.type === "span" && textOf(node) === "₱9000");
  assert.match(heading.props.className, /font-nunito.*text-lg.*font-semibold/);
  assert.match(heading.props.className, /line-clamp-2/);
  assert.match(location.props.className, /text-muted-foreground/);
  assert.match(location.props.className, /text-\[13px\]/);
  assert.match(price.props.className, /font-nunito.*text-2xl.*font-semibold/);
  assert.ok(tree.some(node => node.type === "div" && node.props.className === "p-4"));
});

test("the overlay yields to an underlying real Favorite without a redundant Close button", () => {
  const { root, tree, calls } = render();
  const event = { clientX: 100, clientY: 100, currentTarget: { contains: () => false } };
  root.props.onPointerMove(event);
  assert.equal(calls.dismissed, 0);
  hitStack.push({ closest: () => ({}) });
  try { root.props.onPointerMove(event); } finally { hitStack.length = 0; }
  assert.equal(calls.dismissed, 1);
  assert.ok(!tree.some(node => node.props["aria-label"] === "Close quick preview"));
  assert.equal(calls.viewed, 0);
});

test("long titles, different rents and missing specifications retain the same compact structure", () => {
  const name = "A very long apartment title that must remain available to assistive technology while wrapping to at most two lines";
  for (const price of [5000, 18000, 1250000]) {
    const { tree } = render({ apartment: { ...apartment, name, price, bedrooms: undefined, bathrooms: undefined, areaSqm: undefined } });
    assert.equal(textOf(tree.find(node => node.type === "h4")), name);
    assert.ok(tree.some(node => node.type === "span" && textOf(node) === `₱${price}`));
    assert.ok(!tree.some(node => node.type === "IconBed"));
    assert.ok(!tree.some(node => node.type === "IconBath"));
    assert.ok(!tree.some(node => node.type === "IconMaximize"));
  }
});

// ---- hook: the preview stays mounted while it animates out ----

function hoverHook(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const runtime = hookRuntime();
  const listeners = {};
  const { useHoverPreview, previewPosition } = compile("app/browse/components/use-hover-preview.ts", { react: runtime.react }, {
    // Resolved at call time so node's mock timers (enabled above) are used.
    setTimeout: (...args) => globalThis.setTimeout(...args),
    clearTimeout: (...args) => globalThis.clearTimeout(...args),
    window: {
      innerWidth: 1280,
      innerHeight: 800,
      matchMedia: () => ({ matches: true }),
      addEventListener: (name, handler) => (listeners[name] = handler),
      removeEventListener() {},
    },
  });
  const read = () => runtime.render(() => useHoverPreview());
  const rect = { left: 100, top: 100, width: 224, height: 300 };
  return { read, runtime, rect, previewPosition, listeners };
}

test("the preview opens after a dwell, animates out, then unmounts", (t) => {
  const { read, runtime, rect } = hoverHook(t);
  runtime.flush();
  let hook = read();
  hook.handleHoverCard(apartment, rect);
  t.mock.timers.tick(449);
  assert.equal(read().preview, null, "casual passes never open it");
  t.mock.timers.tick(1);
  hook = read();
  assert.equal(hook.preview.apartment.id, "apt-1");
  assert.equal(hook.isPreviewClosing, false);

  hook.handleLeaveCard();
  t.mock.timers.tick(150);
  hook = read();
  assert.equal(hook.isPreviewClosing, true, "starts the exit animation");
  assert.ok(hook.preview, "still mounted while animating out");
  t.mock.timers.tick(160);
  hook = read();
  assert.equal(hook.preview, null);
  assert.equal(hook.isPreviewClosing, false);
});

test("returning to the preview while it leaves brings it back; dismissal is immediate", (t) => {
  const { read, runtime, rect } = hoverHook(t);
  runtime.flush();
  let hook = read();
  hook.handleHoverCard(apartment, rect);
  t.mock.timers.tick(450);
  hook = read();
  hook.handleLeaveCard();
  t.mock.timers.tick(150);
  assert.equal(read().isPreviewClosing, true);
  hook.handleKeepPreview();
  t.mock.timers.tick(500);
  hook = read();
  assert.ok(hook.preview, "the preview stayed");
  assert.equal(hook.isPreviewClosing, false);

  hook.dismissPreview();
  hook = read();
  assert.equal(hook.preview, null, "scroll, Escape and navigation skip the animation");
  assert.equal(hook.isPreviewClosing, false);
});

test("the preview grows out of the card it covers and stays on screen", (t) => {
  const { previewPosition } = hoverHook(t);
  const placement = previewPosition({ left: 100, top: 100, width: 224, height: 300 });
  assert.equal(placement.width, 320);
  assert.equal(placement.fromScale, 224 / 320);
  assert.equal(previewPosition({ left: 100, top: 100, width: 400, height: 300 }).fromScale, 1, "never grows from larger than itself");
  assert.ok(previewPosition({ left: 1200, top: 100, width: 224, height: 300 }).left + 320 <= 1280);
});

test("early leave, control interaction, rapid card changes and immediate navigation cancel dwell timers", (t) => {
  const { read, rect } = hoverHook(t);
  read().handleHoverCard(apartment, rect);
  t.mock.timers.tick(200);
  read().handleLeaveCard();
  t.mock.timers.tick(500);
  assert.equal(read().preview, null);
  read().handleHoverCard(apartment, rect);
  t.mock.timers.tick(200);
  read().dismissPreview(); // Favorite or navigation, before opening
  t.mock.timers.tick(500);
  assert.equal(read().preview, null);
  read().handleHoverCard(apartment, rect);
  t.mock.timers.tick(450);
  read().handleHoverCard({ ...apartment, id: "next" }, rect);
  assert.equal(read().preview, null, "old apartment cannot float over the next one");
  t.mock.timers.tick(449);
  assert.equal(read().preview, null);
  t.mock.timers.tick(1);
  assert.equal(read().preview.apartment.id, "next");
});

test("pointer motion within one card does not restart the dwell; scroll/Escape and unmount clear timers", (t) => {
  const { read, rect, runtime, listeners } = hoverHook(t);
  read(); runtime.flush();
  read().handleHoverCard(apartment, rect);
  t.mock.timers.tick(300);
  read().handleHoverCard(apartment, rect);
  t.mock.timers.tick(150);
  assert.ok(read().preview);
  listeners.scroll();
  assert.equal(read().preview, null);
  read().handleHoverCard(apartment, rect);
  t.mock.timers.tick(450);
  listeners.keydown({ key: "Escape" });
  assert.equal(read().preview, null);
  read().handleHoverCard(apartment, rect);
  runtime.unmount();
  t.mock.timers.tick(1000);
  assert.equal(read().preview, null);
});

test("the same apartment in a different section retires recommendation context before opening", (t) => {
  const { read, rect } = hoverHook(t);
  read().handleHoverCard(apartment, rect, "for_you");
  t.mock.timers.tick(450);
  assert.equal(read().preview.sectionId, "for_you");
  read().handleHoverCard(apartment, rect, "city:Caloocan");
  assert.equal(read().preview, null, "apartment identity alone must not reuse the old summary");
  t.mock.timers.tick(450);
  assert.equal(read().preview.sectionId, "city:Caloocan");
});
