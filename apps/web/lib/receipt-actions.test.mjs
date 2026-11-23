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
  const log = { toasts: [], viewers: [], refs: 0, set: [], written: [], shared: [], downloads: [], revoked: 0, cleared: 0, rendered: [] };
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
  const source = readFileSync(new URL("../app/tenant/payment/components/ReceiptActions.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" }, react,
    "@heroui/react": { Button: "Button", toast: { success: (message, options) => log.toasts.push([message, options?.description]) } }, "@tabler/icons-react": icons,
    "@/hooks/use-hydrated": { useHydrated: () => env.hydrated !== false },
    "@/lib/receipt-data": { receiptData: (payment, viewer) => { log.viewers.push(viewer); return data; } },
    "@/lib/receipt-image": { renderReceiptImage: async (receipt, fonts) => { log.rendered.push(fonts); return { type: "image/png", size: 10 }; } },
  };
  const context = { exports: {}, ...globals, require: name => { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name]; } };
  vm.runInNewContext(compiled, context);
  const render = () => { log.set.index = -1; log.refs = 0; return context.exports.default({ payment: { id: "p" } }); };
  return { render, log };
}

const settle = () => new Promise(setImmediate);

test("Save downloads the receipt PNG straight away, made for the tenant, and confirms it", async () => {
  const { render, log } = load();
  const tree = render();
  assert.ok(text(buttonNamed(tree, "Save receipt")).includes("Save receipt"));
  buttonNamed(tree, "Save receipt").props.onPress();
  await settle();
  assert.deepEqual(log.downloads, ["receipt-APT-ABCD1234.png"]);
  assert.equal(log.revoked, 0, "the object URL is released after the click, not before");
  assert.deepEqual(log.viewers, ["tenant"], "worded for the tenant, naming the landlord");
  assert.deepEqual(log.rendered.map(fonts => fonts.heading), ["Nunito"]);
  assert.deepEqual(log.shared, []);
  assert.deepEqual(log.toasts, [["Receipt saved", "receipt-APT-ABCD1234.png was downloaded to your device."]], "a toast confirms the download");
  assert.ok(log.set.some(([index, value]) => index === 1 && value === "saved"));
  assert.ok(log.set.some(([index, value]) => index === 0 && value === "save") && log.set.some(([index, value]) => index === 0 && value === null), "busy while saving, free after");
});

test("Share hands the PNG file to the system share sheet with the reference as its title", async () => {
  const { render, log } = load();
  const tree = render();
  assert.ok(text(buttonNamed(tree, "Share receipt")).includes("Share receipt"));
  buttonNamed(tree, "Share receipt").props.onPress();
  await settle();
  assert.equal(log.shared.length, 1);
  assert.equal(log.shared[0].files[0].name, "receipt-APT-ABCD1234.png");
  assert.equal(log.shared[0].files[0].type, "image/png");
  assert.equal(log.shared[0].title, "Receipt APT-ABCD1234");
  assert.ok(log.set.some(([index, value]) => index === 1 && value === "shared"));
  assert.deepEqual(log.downloads, [], "sharing never also downloads");
  assert.deepEqual(log.toasts, [], "the system share sheet is its own feedback");
  assert.deepEqual(log.written, []);
});

test("without file sharing the same button copies the picture, never a second download", async () => {
  for (const env of [{ canShare: false }, { canShareFiles: false }]) {
    const { render, log } = load({ env });
    const tree = render();
    if (env.canShare === false) {
      assert.equal(buttonNamed(tree, "Share receipt"), undefined);
      assert.ok(text(buttonNamed(tree, "Copy receipt")).includes("Copy receipt"));
      buttonNamed(tree, "Copy receipt").props.onPress();
      await settle();
      assert.equal(log.written.length, 1);
      assert.equal((await log.written[0][0].items["image/png"]).type, "image/png");
      assert.deepEqual(log.downloads, []);
      assert.deepEqual(log.toasts.map(([message]) => message), ["Receipt copied"]);
      assert.ok(log.set.some(([index, value]) => index === 1 && value === "copied"));
    } else {
      // The browser has the share function but refuses files: fall back to a download.
      buttonNamed(tree, "Share receipt").props.onPress();
      await settle();
      assert.deepEqual(log.shared, []);
      assert.deepEqual(log.downloads, ["receipt-APT-ABCD1234.png"]);
      assert.deepEqual(log.toasts.map(([message]) => message), ["Receipt saved"]);
    }
  }
});

test("with neither sharing nor clipboard images only Save is offered", () => {
  const { render } = load({ env: { canShare: false, noClipboard: true } });
  const tree = render();
  assert.deepEqual(buttons(tree).map(button => text(button).trim()), ["Save receipt"]);
});

test("closing the share sheet is not an error, but a real failure is reported", async () => {
  const aborted = load({ env: { shareError: new DOMException("closed", "AbortError") } });
  buttonNamed(aborted.render(), "Share receipt").props.onPress();
  await settle();
  assert.ok(!aborted.log.set.some(([index, value]) => index === 2 && value));
  assert.ok(!aborted.log.set.some(([index, value]) => index === 1 && value === "shared"));

  const failed = load({ env: { shareError: new Error("boom") } });
  buttonNamed(failed.render(), "Share receipt").props.onPress();
  await settle();
  assert.ok(failed.log.set.some(([index, value]) => index === 2 && /couldn't be shared/.test(value)));
  assert.deepEqual(failed.log.toasts, [], "no success toast for a failure");

  const copyFailed = load({ env: { canShare: false, copyFails: true } });
  buttonNamed(copyFailed.render(), "Copy receipt").props.onPress();
  await settle();
  assert.ok(copyFailed.log.set.some(([index, value]) => index === 2 && /couldn't be shared/.test(value)));
});

test("the buttons are disabled while one runs, and nothing is offered before hydration", () => {
  const busy = load({ states: { 0: "save" } }).render();
  assert.ok(buttons(busy).every(button => button.props.isDisabled));
  const early = load({ env: { hydrated: false } }).render();
  assert.equal(buttonNamed(early, "Share receipt"), undefined, "no browser-only guess before hydration");
  assert.equal(buttonNamed(early, "Copy receipt"), undefined);
  assert.ok(buttonNamed(early, "Save receipt").props.isDisabled);
});

test("the receipt shows the actions in its footer, and the actions are the only footer buttons", async () => {
  const { readFile } = await import("node:fs/promises");
  const read = name => readFile(new URL(`../app/tenant/payment/components/${name}.tsx`, import.meta.url), "utf8");
  const [card, view] = await Promise.all([read("ReceiptCard"), read("ReceiptView")]);
  assert.match(view, /actions=\{<ReceiptActions payment=\{payment\} \/>\}/);
  assert.doesNotMatch(card, /Save to Photos|onSave|onShare/, "no inert buttons left in the card");
});
