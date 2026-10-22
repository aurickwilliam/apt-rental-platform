import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

export function compile(file, dependencies, globals = {}) {
  const context = { exports: {}, Error, console: { error() {} }, ...globals, require(name) {
    assert.ok(name in dependencies, `Unexpected dependency in ${file}: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

export const settle = () => new Promise(setImmediate);

/** Deterministic hooks with real effect cleanup, including scope handovers. */
export function hookRuntime() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const same = (a, b) => a?.length === b.length && b.every((value, index) => Object.is(value, a[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, update => { slots[index].value = typeof update === "function" ? update(slots[index].value) : update; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) {
        const cleanup = slots[index]?.cleanup;
        slots[index] = { deps };
        effects.push(() => { cleanup?.(); slots[index].cleanup = callback(); });
      }
    },
  };
  react.useMemo = (callback, deps) => {
    const index = cursor++;
    if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { value: callback(), deps };
    return slots[index].value;
  };
  return {
    react,
    render(callback) { cursor = 0; return callback(); },
    flush() { const pending = effects; effects = []; pending.forEach(effect => effect()); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); effects = []; },
  };
}
