import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as navigation from "../app/components/chat/replyNavigation.ts";

const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const compile = (file, modules, globals = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => modules[name], console, AbortController, ...globals });
  return exports;
};

function hookRunner(factory) {
  const cells = [];
  let index = 0, props, pending = [];
  const cell = init => cells[index++] ?? (cells[index - 1] = init());
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useState(initial) { const entry = cell(() => ({ value: initial })); return [entry.value, next => { entry.value = typeof next === "function" ? next(entry.value) : next; }]; },
    useRef(initial) { return cell(() => ({ current: initial })); },
    useEffect(effect, deps) { const entry = cell(() => ({})); if (!same(entry.deps, deps)) { entry.deps = deps; pending.push(() => { entry.cleanup?.(); entry.cleanup = effect(); }); } },
    useMemo(compute, deps) { const entry = cell(() => ({})); if (!same(entry.deps, deps)) { entry.deps = deps; entry.value = compute(); } return entry.value; },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
  };
  const hook = factory(react);
  return {
    render(next = props) { props = next; index = 0; pending = []; const result = hook(props); pending.forEach(run => run()); return result; },
    unmount() { cells.forEach(entry => entry.cleanup?.()); },
  };
}

test("loaded originals require no history query; older lookup stops exactly when found", async () => {
  let pages = 0, found = true;
  const options = { signal: new AbortController().signal, findTarget: () => found, hasEarlier: () => true, loadEarlier: async () => { pages++; found = pages === 2; return { messageIds: ["older"], hasEarlier: true }; } };
  assert.equal(await navigation.locateReplyMessage(options), "found");
  assert.equal(pages, 0);
  found = false;
  assert.equal(await navigation.locateReplyMessage(options), "found");
  assert.equal(pages, 2);
});

test("history lookup is bounded and distinguishes unavailable, failed and cancelled reads", async () => {
  let pages = 0;
  const base = { signal: new AbortController().signal, findTarget: () => false, hasEarlier: () => true, loadEarlier: async () => { pages++; return { messageIds: ["older"], hasEarlier: true }; } };
  assert.equal(await navigation.locateReplyMessage(base), "limit");
  assert.equal(pages, navigation.MAX_REPLY_LOOKUP_PAGES);
  assert.equal(await navigation.locateReplyMessage({ ...base, hasEarlier: () => false }), "unavailable");
  assert.equal(await navigation.locateReplyMessage({ ...base, loadEarlier: async () => ({ messageIds: [], hasEarlier: false }) }), "unavailable");
  assert.equal(await navigation.locateReplyMessage({ ...base, loadEarlier: async () => null }), "error");
  const controller = new AbortController();
  assert.equal(await navigation.locateReplyMessage({ ...base, signal: controller.signal, loadEarlier: async () => { controller.abort(); return null; } }), "cancelled");
});

test("cancellation stops waiting on unresolved media work", async () => {
  const controller = new AbortController(), work = deferred();
  const result = navigation.waitForReplyWork(work.promise, controller.signal);
  controller.abort();
  assert.equal(await result, null);
  work.resolve("late");
});

function navHarness({ load = async () => ({ messageIds: [], hasEarlier: false }), reduced = false } = {}) {
  const targets = new Map(), timers = new Map(), positions = [], scrolls = [];
  let top = 100, height = 500, paused = 0, calls = 0, signal;
  const container = { clientHeight: 200, get scrollHeight() { return height; }, get scrollTop() { return top; }, set scrollTop(value) { top = value; positions.push(value); }, getBoundingClientRect: () => ({ top: 0 }), querySelectorAll: () => [...targets.values()], scrollTo: options => scrolls.push(options) };
  const options = { conversationKey: "account:peer:a", scrollRef: { current: container }, hasEarlierMessages: true, pauseFollowing: () => paused++, loadEarlierMessages: async next => { calls++; signal = next; return load(next); } };
  let timerId = 0;
  const runner = hookRunner(react => compile("../app/components/chat/useReplyNavigation.ts", { react, "./replyNavigation": navigation }, {
    requestAnimationFrame: fn => queueMicrotask(fn), window: { matchMedia: () => ({ matches: reduced }) },
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout: id => timers.delete(id),
  }).default);
  const addTarget = id => { const target = { dataset: { chatMessageId: id }, getBoundingClientRect: () => ({ top: 150, height: 40 }), focus: args => { target.focused = args; } }; targets.set(id, target); return target; };
  return { runner, options, addTarget, timers, positions, scrolls, container, setHeight: next => { height = next; }, calls: () => calls, signal: () => signal, paused: () => paused, render: (next = options) => runner.render(next) };
}

test("visible target centers only the thread, focuses accessibly, highlights and clears after 1.8s", async () => {
  for (const reduced of [false, true]) {
    const h = navHarness({ reduced }), target = h.addTarget("original");
    h.render().jumpToOriginal("original");
    await flush();
    assert.equal(h.render().highlightedId, "original");
    assert.equal(h.calls(), 0);
    assert.equal(h.scrolls[0].top, 170);
    assert.equal(h.scrolls[0].behavior, reduced ? "auto" : "smooth");
    assert.deepEqual(target.focused, { preventScroll: true });
    const timer = [...h.timers.values()].find(entry => entry.delay === navigation.REPLY_HIGHLIGHT_MS);
    assert.equal(timer.delay, 1800);
    timer.fn();
    assert.equal(h.render().highlightedId, null);
    h.runner.unmount();
  }
});

test("older pages preserve the viewport anchor instead of following the bottom", async () => {
  let h, page = 0;
  h = navHarness({ load: async () => { page++; h.setHeight(page === 1 ? 800 : 1000); return { messageIds: [String(page)], hasEarlier: page < 2 }; } });
  h.render().jumpToOriginal("missing");
  await flush();
  assert.deepEqual(h.positions, [400, 600]);
  assert.equal(h.render().notice, "Original message unavailable.");
  assert.equal(h.paused(), 1);
  assert.equal(h.scrolls.length, 0);
  h.runner.unmount();
});

test("rapid repeated clicks deduplicate a lookup; cancelling or changing conversations ignores late results", async () => {
  for (const switchConversation of [false, true]) {
    const work = deferred(), h = navHarness({ load: () => work.promise });
    const ui = h.render();
    for (let i = 0; i < 5; i++) ui.jumpToOriginal("older");
    await flush();
    assert.equal(h.calls(), 1);
    assert.equal(h.render().locating, true);
    if (switchConversation) h.render({ ...h.options, conversationKey: "account:peer:another-property" });
    else h.render().dismiss();
    assert.equal(h.signal().aborted, true);
    h.addTarget("older");
    work.resolve({ messageIds: ["older"], hasEarlier: false });
    await flush();
    const state = h.runner.render();
    assert.equal(state.highlightedId, null);
    assert.equal(state.notice, null);
    assert.equal(h.scrolls.length, 0);
    assert.deepEqual(h.positions, []);
    h.runner.unmount();
  }
});

test("a different rapid target supersedes the old lookup and the timeout remains cancellable", async () => {
  const work = deferred(), h = navHarness({ load: () => work.promise });
  h.render().jumpToOriginal("older");
  await flush();
  h.addTarget("visible");
  h.render().jumpToOriginal("visible");
  await flush();
  assert.equal(h.render().highlightedId, "visible");
  work.resolve(null);
  await flush();
  assert.equal(h.render().highlightedId, "visible");
  h.runner.unmount();
  const stuck = navHarness({ load: () => new Promise(() => {}) });
  stuck.render().jumpToOriginal("unknown");
  await flush();
  [...stuck.timers.values()].find(timer => timer.delay === navigation.REPLY_LOOKUP_TIMEOUT_MS).fn();
  await flush();
  assert.equal(stuck.render().locating, false);
  assert.match(stuck.render().notice, /Please try again/);
  assert.equal(stuck.signal().aborted, true);
  stuck.runner.unmount();
});

for (const portal of ["tenant", "landlord"]) {
  test(`${portal}: shares reply navigation without routes or extra subscriptions`, () => {
    const source = readFileSync(new URL(`../app/${portal}/messages/components/ConversationView.tsx`, import.meta.url), "utf8");
    assert.match(source, /onJumpToOriginal=\{replyNavigation.jumpToOriginal\}/);
    assert.match(source, /isReplyHighlighted=\{replyNavigation.highlightedId === msg.id\}/);
    assert.match(source, /\$\{currentUserId\}:\$\{activeContact.conversationKey\}/);
    assert.match(source, /isDisabled=\{replyNavigation.locating\}/);
    assert.match(source, /if \(replyNavigation.notice \|\| replyNavigation.highlightedId\) \{\s*nearBottomRef.current = false;\s*return;/);
  });
}

function historyHarness() {
  const requests = [], waiting = deferred();
  let slow = false;
  const supabase = { from(table) {
    const request = { table, filters: [] };
    const builder = {
      select: () => builder, order: () => builder, in: () => builder,
      or: value => { request.filters.push(["or", value]); return builder; },
      eq: (...args) => { request.filters.push(["eq", ...args]); return builder; },
      is: (...args) => { request.filters.push(["is", ...args]); return builder; },
      limit: limit => { request.limit = limit; return builder; },
      abortSignal: signal => { request.signal = signal; return builder; },
      then(resolve, reject) {
        requests.push(request);
        const older = request.filters.filter(filter => filter[0] === "or").length > 1;
        return (older && slow ? waiting.promise : Promise.resolve({ data: older ? [{ id: "older", created_at: "2026-01-01", reactions: [] }] : Array.from({ length: 100 }, (_, index) => ({ id: `current-${index}`, created_at: "2026-02-01", reactions: [] })), error: null })).then(resolve, reject);
      },
    };
    return builder;
  } };
  const runner = hookRunner(react => compile("../app/components/chat/useConversation.ts", {
    react, "@repo/supabase/browser": { createClient: () => supabase },
    "./chatReactions": { groupReactions: () => new Map(), attachReplyPreviews: rows => rows },
    "./attachments": { resolveAttachmentUrls: async () => new Map() }, "./conversationEvents": {},
  }).default);
  const options = { currentUserId: "account", otherUserId: "peer", apartmentId: "property-a" };
  return { runner, options, requests, waiting, setSlow: () => { slow = true; }, render: (next = options) => runner.render(next) };
}

test("history reuses exact authorized participant/property filters, bounded keysets and one in-flight page", async () => {
  const h = historyHarness();
  h.render(); await flush();
  h.setSlow();
  const ui = h.render(), controller = new AbortController();
  const first = ui.loadEarlierMessages(controller.signal);
  const second = ui.loadEarlierMessages(controller.signal);
  assert.equal(first, second);
  await flush();
  const page = h.requests.at(-1);
  assert.equal(page.limit, 100);
  assert.equal(page.signal, controller.signal);
  assert.ok(JSON.stringify(page.filters).includes('"eq","apartment_id","property-a"'));
  assert.ok(JSON.stringify(page.filters).includes("sender_id.eq.account,receiver_id.eq.peer"));
  assert.ok(JSON.stringify(page.filters).includes("created_at.lt."));
  h.waiting.resolve({ data: [{ id: "older", created_at: "2026-01-01", reactions: [] }], error: null });
  const result = await first;
  assert.equal(result.hasEarlier, false);
  assert.equal(h.render().messages[0].id, "older");
  h.runner.unmount();
});

test("late history from another property/account or an aborted lookup never enters the open thread", async () => {
  for (const change of ["property", "account", "abort"]) {
    const h = historyHarness();
    h.render(); await flush(); h.setSlow();
    const controller = new AbortController(), page = h.render().loadEarlierMessages(controller.signal);
    await flush();
    if (change === "abort") controller.abort();
    else { h.render({ ...h.options, ...(change === "property" ? { apartmentId: "property-b" } : { currentUserId: "another-account" }) }); await flush(); }
    h.waiting.resolve({ data: [{ id: "wrong-history", created_at: "2026-01-01", reactions: [] }], error: null });
    assert.equal(await page, null);
    assert.equal(h.runner.render().messages.some(message => message.id === "wrong-history"), false);
    h.runner.unmount();
  }
});

test("unlinked conversations keep the null-apartment filter when paging for an original", async () => {
  const h = historyHarness();
  h.render({ ...h.options, apartmentId: null });
  await flush();
  await h.runner.render().loadEarlierMessages(new AbortController().signal);
  const page = h.requests.filter(request => request.table === "chat").at(-1);
  assert.ok(JSON.stringify(page.filters).includes('["is","apartment_id",null]'));
  h.runner.unmount();
});
