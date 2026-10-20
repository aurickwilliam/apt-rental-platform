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

// Small hook runner: effects are flushed explicitly to test the render before
// a unit-change effect starts, as well as responses arriving out of order.
function harness(fetchPayments) {
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
  function load(path, dependencies) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const context = { exports: {}, Error, console: { error: () => {} }, require: name => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    } };
    vm.runInNewContext(compiled, context);
    return context.exports;
  }
  const resource = load("../hooks/use-async-resource.ts", { react });
  const hooks = load("../hooks/use-landlord-payments.ts", {
    react, "@/hooks/use-async-resource": resource,
    "@/service/landlordPaymentService": { fetchLandlordPayments: fetchPayments },
  });
  return {
    render(id) { cursor = 0; return hooks.useLandlordPayments(id); },
    flush() { effects.splice(0).forEach(effect => effect()); },
  };
}

test("unit changes hide old payments before effects and ignore older responses", async () => {
  const a = deferred();
  const b = deferred();
  const calls = [];
  const hook = harness(id => { calls.push(id); return id === "a" ? a.promise : b.promise; });
  assert.equal(hook.render(null).loading, false);
  hook.flush();
  assert.equal(hook.render("a").loading, true);
  hook.flush();
  let state = hook.render("b");
  assert.equal(state.loading, true);
  assert.equal(state.payments.length, 0);
  hook.flush();
  b.resolve([{ id: "b-payment", status: "pending" }]);
  await new Promise(setImmediate);
  state = hook.render("b");
  assert.equal(state.loading, false);
  assert.equal(state.payments[0].id, "b-payment");
  a.resolve([{ id: "a-payment", status: "paid" }]);
  await new Promise(setImmediate);
  assert.equal(hook.render("b").payments[0].id, "b-payment");
  assert.deepEqual(calls, ["a", "b"]);
  assert.equal(hook.render("a").payments.length, 0);
  assert.equal(hook.render(null).payments.length, 0);
});

test("optimistic paid/rollback work and a failed unit load never exposes old rows", async () => {
  const failed = deferred();
  const rows = [{ id: "a-payment", status: "pending" }];
  const hook = harness(id => id === "a" ? Promise.resolve(rows) : failed.promise);
  hook.render("a");
  hook.flush();
  await new Promise(setImmediate);
  hook.render("a").applyOptimisticPaid("a-payment");
  assert.equal(hook.render("a").payments[0].status, "paid");
  hook.render("a").rollback(rows);
  assert.equal(hook.render("a").payments[0].status, "pending");
  assert.equal(hook.render("b").payments.length, 0);
  hook.flush();
  failed.reject(new Error("Could not load this unit"));
  await new Promise(setImmediate);
  const state = hook.render("b");
  assert.equal(state.loading, false);
  assert.equal(state.error, "Could not load this unit");
  assert.equal(state.payments.length, 0);
});
