import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

function harness() {
  const runtime = hookRuntime();
  const observations = [], reads = [];
  const panel = { hidden: false, inert: false, clientHeight: 400 };
  const end = { closest: () => panel };
  const { usePolicyScrollCompletion } = compile("hooks/use-policy-scroll-completion.ts", { react: runtime.react }, {
    IntersectionObserver: class {
      constructor(callback, options) { this.callback = callback; this.options = options; observations.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
    },
  });
  const onRead = policy => reads.push(policy);
  const render = (policy = "privacy", active = true) => {
    const ref = runtime.render(() => usePolicyScrollCompletion(policy, active, onRead));
    ref.current = end;
    runtime.flush();
  };
  const emit = (observer, ratio = 1, intersecting = true) => observer.callback([{ target: end, isIntersecting: intersecting, intersectionRatio: ratio }]);
  return { runtime, observations, reads, panel, end, render, emit };
}

test("only the loaded document's fully visible end unlocks once, scoped to its scrolling panel", () => {
  const h = harness(); h.render();
  const observer = h.observations[0];
  assert.equal(observer.options.root, h.panel);
  assert.equal(observer.options.threshold, 1);
  assert.equal(observer.target, h.end);
  h.emit(observer, 0.5); h.emit(observer, 1, false);
  assert.deepEqual(h.reads, []);
  for (const [key, value] of [["hidden", true], ["inert", true], ["clientHeight", 0]]) {
    const original = h.panel[key]; h.panel[key] = value;
    h.emit(observer); assert.deepEqual(h.reads, []);
    h.panel[key] = original;
  }
  h.emit(observer); h.emit(observer);
  assert.deepEqual(h.reads, ["privacy"]);
  assert.equal(observer.disconnected, true);
});

test("inactive tabs never observe; switching tabs and dismissal retire queued observer callbacks", () => {
  const h = harness(); h.render("terms", false);
  assert.equal(h.observations.length, 0);
  h.render("terms", true);
  const old = h.observations[0];
  h.render("terms", false);
  assert.equal(old.disconnected, true);
  h.emit(old); assert.deepEqual(h.reads, []);
  h.render("terms", true);
  const current = h.observations[1];
  h.runtime.unmount(); h.emit(current);
  assert.equal(current.disconnected, true);
  assert.deepEqual(h.reads, []);
});
