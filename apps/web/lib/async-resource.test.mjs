import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness() {
  const slots = [];
  const effects = [];
  let cursor = 0;
  const same = (left, right) => left?.length === right.length && right.every((value, index) => Object.is(value, left[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, update => { slots[index].value = typeof update === "function" ? update(slots[index].value) : update; }];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) {
        slots[index] = { deps };
        effects.push(callback);
      }
    },
  };
  const source = readFileSync(new URL("../hooks/use-async-resource.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = {
    exports: {},
    console: { error: () => {} },
    require: name => {
      assert.equal(name, "react", `Unexpected dependency: ${name}`);
      return react;
    },
  };
  vm.runInNewContext(compiled, context);
  return {
    render(load) { cursor = 0; return context.exports.useAsyncResource(load, [], "load failed"); },
    flush() { effects.splice(0).forEach(effect => effect()); },
  };
}

test("revalidate refreshes in place: no loading state, and failures keep the loaded data", async () => {
  const requests = [deferred(), deferred(), deferred()];
  let call = 0;
  const load = () => requests[call++].promise;
  const hook = harness();

  assert.equal(hook.render(load).loading, true);
  hook.flush();
  requests[0].resolve(["first"]);
  await new Promise(setImmediate);
  let state = hook.render(load);
  assert.deepEqual(state.data, ["first"]);
  assert.equal(state.loading, false);

  state.revalidate();
  state = hook.render(load);
  assert.equal(state.loading, false, "a focus refetch must not unmount the page");
  requests[1].resolve(["second"]);
  await new Promise(setImmediate);
  state = hook.render(load);
  assert.deepEqual(state.data, ["second"]);
  assert.equal(state.error, null);

  state.revalidate();
  state = hook.render(load);
  requests[2].reject(new Error("offline"));
  await new Promise(setImmediate);
  state = hook.render(load);
  assert.deepEqual(state.data, ["second"], "a failed background refresh keeps what the user is reading");
  assert.equal(state.error, null);
});

test("refresh keeps its loading state and still surfaces failures", async () => {
  const requests = [deferred(), deferred()];
  let call = 0;
  const load = () => requests[call++].promise;
  const hook = harness();

  hook.render(load);
  hook.flush();
  requests[0].resolve(["first"]);
  await new Promise(setImmediate);

  let state = hook.render(load);
  const refreshing = state.refresh();
  state = hook.render(load);
  assert.equal(state.loading, true);
  requests[1].reject(new Error("boom"));
  await refreshing;
  state = hook.render(load);
  assert.equal(state.loading, false);
  assert.ok(state.error, "refresh still surfaces failures");
  assert.deepEqual(state.data, ["first"]);
});
