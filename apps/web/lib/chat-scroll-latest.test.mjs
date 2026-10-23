import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Runs the hook's effect directly against a fake scroller and ResizeObserver.
function run({ conversationKey = "a", isLoading = false, hasTimeline = true } = {}) {
  const listeners = {};
  const scroller = {
    scrollTop: 0,
    scrollHeight: 1000,
    addEventListener: (type, fn) => { listeners[type] = fn; },
    removeEventListener: (type) => { delete listeners[type]; },
    querySelector: () => (hasTimeline ? { id: "timeline" } : null),
  };
  const nearBottomRef = { current: false };
  const observers = [];
  class FakeResizeObserver {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  let cleanup;
  const source = readFileSync(new URL("../app/components/chat/useScrollToLatestOnOpen.ts", import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    {
      exports,
      require: () => ({ useEffect: (effect) => { cleanup = effect(); } }),
      ResizeObserver: FakeResizeObserver,
      setTimeout, clearTimeout,
    },
  );
  exports.default({ scrollRef: { current: scroller }, nearBottomRef, conversationKey, isLoading });
  return { scroller, nearBottomRef, observers, listeners, cleanup: () => cleanup?.() };
}

test("a conversation opens at its newest message and re-arms bottom-follow", () => {
  const { scroller, nearBottomRef, cleanup } = run();
  assert.equal(scroller.scrollTop, 1000);
  assert.equal(nearBottomRef.current, true);
  cleanup();
});

test("media that sizes itself after opening keeps the thread pinned, until the reader scrolls", () => {
  const { scroller, observers, listeners, cleanup } = run();
  scroller.scrollHeight = 1400;
  observers[0].callback();
  assert.equal(scroller.scrollTop, 1400);

  listeners.wheel();
  scroller.scrollHeight = 1800;
  observers[0].callback();
  assert.equal(scroller.scrollTop, 1400, "a reader who scrolled is left where they are");
  cleanup();
});

test("nothing happens while loading or without a conversation, and cleanup releases everything", () => {
  const loading = run({ isLoading: true });
  assert.equal(loading.scroller.scrollTop, 0);
  assert.equal(loading.nearBottomRef.current, false);

  assert.equal(run({ conversationKey: null }).scroller.scrollTop, 0);

  const opened = run();
  opened.cleanup();
  assert.equal(opened.observers[0].disconnected, true);
  assert.deepEqual(Object.keys(opened.listeners), []);
});
