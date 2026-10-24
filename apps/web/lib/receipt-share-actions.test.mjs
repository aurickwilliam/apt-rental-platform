import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props });
const icons = new Proxy({}, { get: (_, key) => key });

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}
const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");
const buttons = tree => nodes(tree).filter(node => node.type === "Button");
const buttonNamed = (tree, label) => buttons(tree).find(node => text(node).includes(label));

class FakeClipboardItem { constructor(items) { this.items = items; } }
class FakeFile { constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type; } }

// `states` is [busy, feedback, error]. `env` describes the browser.
function load({ env = {}, states = {} } = {}) {
  const log = { refs: 0, set: [], written: [], shared: [], downloads: [], revoked: 0, cleared: 0, rendered: [] };
  const react = {
    useState: initial => {
      const index = log.set.index = (log.set.index ?? -1) + 1;
      return [Object.hasOwn(states, index % 3) ? states[index % 3] : initial, value => log.set.push([index % 3, value])];
    },
    // The first ref is the hidden font probe; the second is the feedback timer.
    useRef: initial => ({ current: log.refs++ % 2 === 0 ? { parentElement: {} } : initial }),
    useEffect() {},
  };
  const data = { filename: "receipt-APT-ABCD1234.png", reference: "APT-ABCD1234" };
  const globals = {
    console: { error() {} },
    getComputedStyle: () => ({ fontFamily: "Nunito" }),
    setTimeout: () => 0, clearTimeout: () => { log.cleared += 1; },
    File: FakeFile, DOMException,
    URL: { createObjectURL: () => "blob:x", revokeObjectURL: () => { log.revoked += 1; } },
    document: { createElement: () => ({ click() { log.downloads.push(this.download); } }) },
    ClipboardItem: env.noClipboard ? undefined : FakeClipboardItem,
    navigator: {
      clipboard: env.noClipboard ? undefined : { write: async items => { if (env.copyFails) throw new Error("denied"); log.written.push(items); } },
      share: env.canShare === false ? undefined : async options => { if (env.shareError) throw env.shareError; log.shared.push(options); },
      canShare: env.canShare === false ? undefined : () => env.canShareFiles !== false,
    },
  };
  const source = readFileSync(new URL("../app/landlord/payments/components/ReceiptShareActions.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" }, react,
    "@heroui/react": { Button: "Button" }, "@tabler/icons-react": icons,
    "@/hooks/use-hydrated": { useHydrated: () => env.hydrated !== false },
    "../lib/receiptData": { receiptData: () => data },
    "../lib/receiptImage": { renderReceiptImage: async (receipt, fonts) => { log.rendered.push(fonts); return { type: "image/png", size: 10 }; } },
  };
  const context = { exports: {}, ...globals, require: name => { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name]; } };
  vm.runInNewContext(compiled, context);
  const render = () => { log.set.index = -1; log.refs = 0; return context.exports.default({ payment: { id: "p" } }); };
  return { render, log };
}

const settle = () => new Promise(setImmediate);

test("Copy image puts a PNG on the clipboard through a promise-backed ClipboardItem and confirms it", async () => {
  const { render, log } = load();
  const tree = render();
  buttonNamed(tree, "Copy image").props.onPress();
  await settle();
  assert.equal(log.written.length, 1);
  const item = log.written[0][0];
  assert.ok(item instanceof FakeClipboardItem === false || item.items["image/png"], "an image/png entry");
  assert.equal((await item.items["image/png"]).type, "image/png");
  assert.deepEqual(log.rendered.map(fonts => fonts.heading), ["Nunito"]);
  assert.ok(log.set.some(([index, value]) => index === 1 && value === "copied"));
  assert.ok(log.set.some(([index, value]) => index === 0 && value === "copy") && log.set.some(([index, value]) => index === 0 && value === null), "busy while copying, free after");
});

test("a refused copy shows a message and points to Save image", async () => {
  const { render, log } = load({ env: { copyFails: true } });
  buttonNamed(render(), "Copy image").props.onPress();
  await settle();
  assert.ok(log.set.some(([index, value]) => index === 2 && /couldn't be copied/.test(value)));
  assert.ok(!log.set.some(([index, value]) => index === 1 && value === "copied"));
});

test("Copy image is not offered where the browser cannot copy images", () => {
  const { render } = load({ env: { noClipboard: true } });
  const tree = render();
  assert.equal(buttonNamed(tree, "Copy image"), undefined);
  assert.ok(buttonNamed(tree, "Share"), "sharing is still offered");
});

test("Share hands the PNG file to the system share sheet with the reference as its title", async () => {
  const { render, log } = load();
  const tree = render();
  assert.ok(text(buttonNamed(tree, "Share")).includes("Share"));
  buttonNamed(tree, "Share").props.onPress();
  await settle();
  assert.equal(log.shared.length, 1);
  assert.equal(log.shared[0].files[0].name, "receipt-APT-ABCD1234.png");
  assert.equal(log.shared[0].files[0].type, "image/png");
  assert.equal(log.shared[0].title, "Receipt APT-ABCD1234");
  assert.ok(log.set.some(([index, value]) => index === 1 && value === "shared"));
  assert.deepEqual(log.downloads, []);
});

test("without file sharing the same button saves the image instead", async () => {
  for (const env of [{ canShare: false }, { canShareFiles: false }]) {
    const { render, log } = load({ env });
    const tree = render();
    if (env.canShare === false) assert.ok(text(buttonNamed(tree, "Save image")).includes("Save image"));
    buttonNamed(tree, env.canShare === false ? "Save image" : "Share").props.onPress();
    await settle();
    assert.deepEqual(log.shared, []);
    assert.deepEqual(log.downloads, ["receipt-APT-ABCD1234.png"]);
    assert.ok(log.set.some(([index, value]) => index === 1 && value === "saved"));
  }
});

test("closing the share sheet is not an error, but a real failure is reported", async () => {
  const aborted = load({ env: { shareError: new DOMException("closed", "AbortError") } });
  buttonNamed(aborted.render(), "Share").props.onPress();
  await settle();
  assert.ok(!aborted.log.set.some(([index, value]) => index === 2 && value));
  assert.ok(!aborted.log.set.some(([index, value]) => index === 1 && value === "shared"));

  const failed = load({ env: { shareError: new Error("boom") } });
  buttonNamed(failed.render(), "Share").props.onPress();
  await settle();
  assert.ok(failed.log.set.some(([index, value]) => index === 2 && /couldn't be shared/.test(value)));
});

test("the buttons are disabled while one runs, and Share waits for hydration", () => {
  const busy = load({ states: { 0: "copy" } }).render();
  assert.ok(buttons(busy).every(button => button.props.isDisabled));
  const early = load({ env: { hydrated: false } }).render();
  assert.equal(buttonNamed(early, "Copy image"), undefined, "no browser-only guess before hydration");
  assert.ok(buttonNamed(early, "Save image").props.isDisabled);
});
