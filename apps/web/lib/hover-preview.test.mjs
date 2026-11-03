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

const Preview = compile("app/browse/components/ApartmentHoverPreview.tsx", {
  "react/jsx-runtime": jsxRuntime,
  react: {},
  "next/image": { default: "Image" },
  "@heroui/react": { Button: "Button", Card: "Card", Spinner: "Spinner" },
  "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
  "@repo/utils": { formatPesoDisplay: (value) => `₱${value}` },
  "@/app/components/display/StatusChip": { default: "StatusChip" },
  "@/lib/public-apartment-image": { canOptimizePublicApartmentImage: () => true },
}).default;

function render(overrides = {}) {
  const calls = { viewed: 0, favorited: 0, stopped: 0 };
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
    ...overrides,
  };
  return { tree: nodes(Preview(props)), root: Preview(props), props, calls };
}

test("the whole preview opens the apartment: no View Details button, one clickable surface", () => {
  const { tree, calls } = render();
  assert.ok(!tree.some((node) => node.type === "Button" && /View Details/.test(textOf(node))));
  assert.equal(tree.filter((node) => node.type === "Button").length, 1, "only the favorite button remains");
  const surface = tree.find((node) => node.props.role === "button");
  assert.equal(surface.props.tabIndex, 0);
  assert.match(surface.props["aria-label"], /View details of Kaunlaran Affordable Studio/);
  surface.props.onClick();
  assert.equal(calls.viewed, 1);

  let prevented = 0;
  surface.props.onKeyDown({ target: surface, currentTarget: surface, key: "Enter", preventDefault: () => prevented++ });
  assert.equal(calls.viewed, 2);
  surface.props.onKeyDown({ target: {}, currentTarget: surface, key: "Enter", preventDefault: () => prevented++ });
  assert.equal(calls.viewed, 2, "keys from the favorite button never open the apartment");
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
    assert.equal(icon.props.size, 16);
    assert.equal(icon.props.stroke, 1.75);
  }
  assert.deepEqual(
    nodes(Preview(render().props))
      .filter((node) => node.type === "span" && /gap-1.5/.test(node.props.className ?? ""))
      .map(textOf),
    ["1 BR", "1 BA", "20 sqm"],
  );
});

test("the monthly rent is the larger bottom line, after the stats", () => {
  const { tree } = render();
  const price = tree.find((node) => node.type === "p" && textOf(node) === "₱9000");
  assert.match(price.props.className, /text-xl/);
  const stats = tree.findIndex((node) => node.type === "IconMaximize");
  assert.ok(tree.indexOf(price) > stats, "rent comes below the stats");
});

test("closing and the grow-from-card scale are exposed for the CSS animation", () => {
  const open = Preview(render().props);
  assert.equal(open.props["data-closing"], undefined);
  assert.equal(open.props.style["--hover-from-scale"], 0.7);
  assert.match(open.props.className, /apt-hover-preview/);
  const closing = Preview({ ...render().props, isClosing: true });
  assert.equal(closing.props["data-closing"], "true");
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
  return { read, runtime, rect, previewPosition };
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
