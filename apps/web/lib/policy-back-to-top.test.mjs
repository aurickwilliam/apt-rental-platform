import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];

function buttonHarness({ reduceMotion = false, hasHeading = true, initialScroll = 0, server = false } = {}) {
  const runtime = hookRuntime();
  const calls = [];
  const listeners = new Set();
  const snapshots = [];
  const window = {
    scrollY: initialScroll,
    addEventListener: (event, listener, options) => {
      assert.equal(event, "scroll"); assert.equal(options.passive, true); listeners.add(listener);
    },
    removeEventListener: (event, listener) => { assert.equal(event, "scroll"); listeners.delete(listener); },
    matchMedia: query => { assert.equal(query, "(prefers-reduced-motion: reduce)"); return { matches: reduceMotion }; },
    scrollTo: options => calls.push(["scroll", options]),
  };
  const Button = compile("app/components/legal/PolicyBackToTopButton.tsx", {
    react: {
      ...runtime.react,
      useSyncExternalStore: (subscribe, getSnapshot, getServerSnapshot) => {
        runtime.react.useEffect(() => subscribe(() => snapshots.push(getSnapshot())), [subscribe]);
        return server ? getServerSnapshot() : getSnapshot();
      },
    },
    "react/jsx-runtime": jsx,
    "@heroui/react": { Button: "Button" },
    "@tabler/icons-react": { IconArrowUp: "IconArrowUp" },
  }, {
    document: { getElementById: id => { assert.equal(id, "policy-heading"); return hasHeading ? { focus: options => calls.push(["focus", options]) } : null; } },
    window,
  }).default;
  const render = () => nodes(runtime.render(() => Button({ headingId: "policy-heading" })));
  render();
  if (!server) runtime.flush();
  return {
    render, calls, listeners, snapshots,
    button: () => render().find(node => node.type === "Button"),
    scroll: value => { window.scrollY = value; listeners.forEach(listener => listener()); },
    unmount: () => runtime.unmount(),
  };
}

for (const reduceMotion of [false, true]) {
  test(`Back to top focuses the heading and ${reduceMotion ? "avoids animation" : "scrolls smoothly"}`, () => {
    const h = buttonHarness({ reduceMotion });
    h.scroll(1);
    const button = h.button();
    assert.equal(button.props.type, "button");
    assert.equal(button.props.variant, "outline");
    assert.ok(button.props.children.includes("Back to top"));
    assert.equal(nodes(button).find(node => node.type === "IconArrowUp").props["aria-hidden"], "true");
    button.props.onPress();
    assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
      ["focus", { preventScroll: true }],
      ["scroll", { top: 0, behavior: reduceMotion ? "instant" : "smooth" }],
    ]);
    h.unmount();
  });
}

test("a missing heading does not scroll or throw", () => {
  const h = buttonHarness({ hasHeading: false });
  h.scroll(1);
  assert.doesNotThrow(() => h.button().props.onPress());
  assert.equal(h.calls.length, 0);
  h.unmount();
});

test("any downward scroll reveals the fixed control; returning to the top hides it and unmount cleans up", () => {
  const h = buttonHarness();
  assert.equal(h.button(), undefined);
  assert.equal(h.listeners.size, 1);
  h.scroll(1);
  const floating = h.render().find(node => node.props?.["data-fab-clearance"] === "policy-back-to-top");
  assert.match(floating.props.className, /fixed/);
  assert.match(floating.props.style.bottom, /safe-area-inset-bottom/);
  assert.match(floating.props.style.right, /safe-area-inset-right/);
  assert.equal(h.button().props.className, "min-h-11");
  h.scroll(600);
  assert.ok(h.button(), "stays available throughout the document, not only at its end");
  assert.deepEqual(h.snapshots, [true, true], "snapshots stay boolean rather than tracking scroll pixels");
  h.scroll(0);
  assert.equal(h.button(), undefined, "hides again at the top");
  h.scroll(-10);
  assert.equal(h.button(), undefined, "top-edge overscroll does not show the button");
  const beforeUnmount = h.snapshots.length;
  h.unmount();
  assert.equal(h.listeners.size, 0);
  h.scroll(100);
  assert.equal(h.snapshots.length, beforeUnmount);
});

test("restored client scroll positions show the control immediately while the server snapshot remains hidden", () => {
  const client = buttonHarness({ initialScroll: 400 });
  assert.ok(client.button());
  client.unmount();
  const server = buttonHarness({ initialScroll: 400, server: true });
  assert.equal(server.button(), undefined);
  assert.equal(server.listeners.size, 0);
});

test("policy headings accept programmatic focus without entering the tab order", () => {
  const Hero = compile("app/(main)/components/legal/LegalHero.tsx", {
    "react/jsx-runtime": jsx, "@heroui/react": { Chip: { Label: "Chip.Label" } }, "@tabler/icons-react": {},
  }).default;
  const props = { title: "Privacy", titleAccent: "Policy", meta: {} };
  const heading = nodes(Hero({ ...props, headingId: "policy-heading" })).find(node => node.type === "h1");
  assert.equal(heading.props.id, "policy-heading");
  assert.equal(heading.props.tabIndex, -1);
  assert.match(heading.props.className, /focus-visible:outline-primary/);
  assert.equal(nodes(Hero(props)).find(node => node.type === "h1").props.tabIndex, undefined);
});

test("registration readers and the Cookie page do not mount the standalone Back to top control", () => {
  for (const file of [
    "app/(auth)/components/RegistrationPolicyContent.tsx",
    "app/(auth)/components/RegistrationPoliciesModal.tsx",
    "app/(main)/cookies/page.tsx",
  ]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /PolicyBackToTopButton/);
  }
});
