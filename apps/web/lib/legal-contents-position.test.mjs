import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];

function harness(initialLayout) {
  const runtime = hookRuntime();
  const observers = [];
  const listeners = new Set();
  let layout = initialLayout;
  let height = 148;
  const window = {
    innerHeight: 200,
    addEventListener: (_event, callback) => listeners.add(callback),
    removeEventListener: (_event, callback) => listeners.delete(callback),
  };
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const Contents = compile("app/(main)/components/legal/LegalTableOfContents.tsx", {
    react: runtime.react,
    "react/jsx-runtime": jsx,
    "@heroui/react": { Accordion: { Item: "Accordion.Item", Heading: "Accordion.Heading", Trigger: "Accordion.Trigger", Indicator: "Accordion.Indicator", Panel: "Accordion.Panel", Body: "Accordion.Body" }, Card: { Header: "Card.Header", Content: "Card.Content" }, Link: "Link" },
  }, { ResizeObserver, window, document: { querySelectorAll: () => [] } }).default;
  const render = () => nodes(runtime.render(() => Contents({ items: [{ id: "p1", label: "Introduction" }], layout })));
  const nav = () => render().find(node => node.type === "nav");
  nav().props.ref.current = { getBoundingClientRect: () => ({ height }) };
  runtime.flush();
  return {
    nav, render, observers, listeners,
    measure: () => observers.filter(observer => !observer.disconnected).forEach(observer => observer.callback()),
    resize: value => { window.innerHeight = value; listeners.forEach(callback => callback()); },
    setHeight: value => { height = value; },
    setLayout: value => { layout = value; render(); runtime.flush(); },
    unmount: () => runtime.unmount(),
  };
}

test("portal Contents uses a 16px top gap and fits without reserving a missing public navbar", () => {
  const h = harness("portal");
  h.measure();
  assert.equal(h.nav().props.style.top, 16);
  assert.match(h.nav().props.className, / sticky$/);
  assert.ok(h.render().some(node => node.props?.className?.includes("lg:hidden")), "mobile contents remains an accordion");
  h.unmount();
});

test("public Contents defaults to 80px navbar clearance and includes it in its fit calculation", () => {
  const h = harness(undefined);
  h.measure();
  assert.equal(h.nav().props.style.top, 80);
  assert.doesNotMatch(h.nav().props.className, / sticky$/);
  h.resize(244);
  assert.match(h.nav().props.className, / sticky$/);
  h.resize(243);
  assert.doesNotMatch(h.nav().props.className, / sticky$/);
  h.unmount();
});

test("resizing, content changes and switching shells keep sticky position and available height aligned", () => {
  const h = harness("portal");
  h.measure();
  h.setHeight(170);
  h.measure();
  assert.doesNotMatch(h.nav().props.className, / sticky$/);
  h.setHeight(0);
  h.measure();
  assert.doesNotMatch(h.nav().props.className, / sticky$/);
  h.setHeight(148);
  h.setLayout("public");
  h.measure();
  assert.equal(h.observers[0].disconnected, true);
  assert.equal(h.nav().props.style.top, 80);
  assert.doesNotMatch(h.nav().props.className, / sticky$/);
  h.setLayout("portal");
  h.measure();
  assert.equal(h.nav().props.style.top, 16);
  assert.match(h.nav().props.className, / sticky$/);
  h.unmount();
  assert.ok(h.observers.every(observer => observer.disconnected));
  assert.equal(h.listeners.size, 0);
});
