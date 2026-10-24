import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Modal = compound("Modal", ["Root", "Backdrop", "Container", "Dialog", "CloseTrigger", "Body"]);

function compile(file, dependencies, globals = {}) {
  const source = readFileSync(new URL(`../app/landlord/payments/components/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, console, ...globals, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

const jsx = (type, props) => ({ type, props });
const runtime = { "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" } };
const icons = new Proxy({}, { get: (_, key) => key });

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && ["PaymentReceipt", "CopyReference", "Row"].includes(element.type.name);
  const children = expand ? element.type(element.props ?? {}) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}
const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");
const buttons = tree => nodes(tree).filter(node => node.type === "Button");
const buttonNamed = (tree, label) => buttons(tree).find(node => text(node).includes(label));

const payment = (change = {}) => ({
  id: "pay-1", apartment_id: "unit-a", apartment_name: "Unit A", tenant_name: "Ryan", amount: 6000, status: "pending", method: "cash",
  date: "2026-03-05", created_at: "2026-03-05T02:00:00Z", due_date: "2026-03-05", period_start: "2026-03-01", reference_id: "APT-ABCD1234", billing_kind: null, ...change,
});

function loadModal({ step, action = {}, confirmation = {} } = {}) {
  const calls = { confirm: [], reject: [], steps: [], cleared: 0, revalidate: null, overlay: null };
  const react = { useState: initial => [step ?? initial, value => calls.steps.push(value)] };
  const deps = {
    ...runtime, react, "@tabler/icons-react": icons, "@repo/utils": { formatPesoDisplay: value => `₱${value}` },
    "@heroui/react": { Button: "Button", Modal, useOverlayState: config => (calls.overlay = config) },
    "@/app/components/display/ReconciliationNotice": { default: "ReconciliationNotice" },
    "@/hooks/use-landlord-payments": {
      useLandlordPaymentConfirmation: () => ({
        confirm: async id => { calls.confirm.push(id); return true; },
        reject: async id => { calls.reject.push(id); return true; },
        pending: false, error: null, clearError: () => { calls.cleared += 1; }, ...confirmation,
      }),
    },
    "@/hooks/use-reconciled-action": {
      useReconciledAction: revalidate => {
        calls.revalidate = revalidate;
        return { run: async write => { await write(); return "confirmed"; }, retry() {}, pending: false, error: null, blocked: false, ...action };
      },
    },
    "./PaymentReceipt": { default: "PaymentReceipt" },
    "./ReceiptShareActions": { default: "ReceiptShareActions" },
  };
  return { module: compile("PaymentReceiptModal.tsx", deps), calls };
}

const render = (loaded, props) => loaded.module.default({ onClose() {}, onChanged: async () => true, payment: payment(), ...props });
const footerOf = tree => nodes(tree).find(node => node.type === "PaymentReceipt").props.footer;

test("a cash payment waiting for the landlord offers Decline and Mark as paid, then asks before acting", async () => {
  const idle = loadModal();
  const footer = footerOf(render(idle));
  assert.ok(buttonNamed(footer, "Decline"));
  buttonNamed(footer, "Mark as paid").props.onPress();
  assert.deepEqual(idle.calls.steps, ["confirm"]);
  assert.equal(idle.calls.cleared, 1, "an earlier error is cleared when choosing");
  assert.equal(idle.calls.confirm.length, 0, "choosing never writes");

  const confirming = loadModal({ step: "confirm" });
  const confirmFooter = footerOf(render(confirming));
  assert.ok(text(confirmFooter).includes("Confirm you received ₱6000 in cash from Ryan"));
  assert.ok(!buttonNamed(confirmFooter, "Mark as paid"));
  buttonNamed(confirmFooter, "Yes, I received it").props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(confirming.calls.confirm, ["pay-1"]);
  assert.deepEqual(confirming.calls.reject, []);
  assert.deepEqual([...confirming.calls.steps], ["idle"], "the receipt returns to its first step once reconciled");
});

test("declining asks first and calls the reject action; Back changes nothing", async () => {
  const declining = loadModal({ step: "decline" });
  const footer = footerOf(render(declining));
  assert.ok(text(footer).includes("Decline this ₱6000 cash payment? Ryan can submit another request."));
  buttonNamed(footer, "Back").props.onPress();
  assert.deepEqual(declining.calls.steps, ["idle"]);
  buttonNamed(footer, "Yes, decline").props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(declining.calls.reject, ["pay-1"]);
  assert.deepEqual(declining.calls.confirm, []);
});

test("payments the landlord cannot act on show a note and no action buttons", () => {
  for (const [change, note] of [
    [{ status: "paid" }, "recorded in your income"],
    [{ status: "pending", method: "gcash" }, "payment provider"],
    [{ status: "rejected" }, "No money was recorded"],
  ]) {
    const footer = footerOf(render(loadModal(), { payment: payment(change) }));
    assert.ok(text(footer).includes(note), note);
    assert.equal(buttons(footer).length, 0);
  }
});

test("while an action is running or unverified every action button is disabled", () => {
  for (const [action, confirmation] of [[{ blocked: true }, {}], [{}, { pending: true }]]) {
    const idle = footerOf(render(loadModal({ action, confirmation })));
    assert.ok(buttons(idle).every(button => button.props.isDisabled));
    const step = footerOf(render(loadModal({ step: "confirm", action, confirmation })));
    assert.ok(buttons(step).every(button => button.props.isDisabled));
  }
});

test("a failed write shows its message, and the list is reloaded through the reconciled action", () => {
  const loaded = loadModal({ confirmation: { error: "Could not update payment status." }, step: "confirm" });
  const onChanged = async () => true;
  const footer = footerOf(render(loaded, { onChanged }));
  assert.ok(text(footer).includes("Could not update payment status."));
  assert.equal(loaded.calls.revalidate, onChanged);
});

test("only the receipt shows: a transparent dialog, no Done button, dismissed by the X, a tap outside or Escape", () => {
  let closed = 0;
  const loaded = loadModal();
  const tree = render(loaded, { onClose: () => { closed += 1; } });
  assert.equal(buttonNamed(tree, "Done"), undefined);
  const dialog = nodes(tree).find(node => node.type === "Modal.Dialog");
  assert.equal(dialog.props.style.backgroundColor, "transparent");
  assert.equal(dialog.props.style.boxShadow, "none");
  assert.equal(nodes(tree).find(node => node.type === "Modal.Backdrop").props.isDismissable, true);
  assert.ok(nodes(tree).some(node => node.type === "Modal.CloseTrigger"));
  loaded.calls.overlay.onOpenChange(false);
  loaded.calls.overlay.onOpenChange(true);
  assert.equal(closed, 1, "only closing reports back");
  assert.equal(loaded.calls.overlay.isOpen, true);
});

const formatters = {
  "@repo/utils": { formatPesoDisplay: value => `₱${value}`, paymentBreakdown: p => p.breakdown ?? [] },
  "@/app/tenant/payment/utils": {
    formatDateFull: value => `full:${value}`, formatReferenceId: value => value ?? "—", formatTimeShort: () => "10:00 AM",
    methodLabel: value => ({ cash: "Cash", gcash: "GCash" })[value] ?? value,
    paymentStatusLabel: value => ({ paid: "Paid", pending: "Pending", rejected: "Rejected", failed: "Failed" })[value] ?? "Pending",
    statusVariant: () => "neutral",
  },
  "@/lib/landlord-payments-view": { ledgerPeriodLabel: value => `period:${value}` },
};
const receiptDataModule = () => compile("../lib/receiptData.ts", { ...formatters });

function loadReceipt() {
  const react = { useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }), useEffect() {} };
  const deps = {
    ...runtime, react, "@tabler/icons-react": icons, ...formatters,
    "@/app/components/display/PaymentMethodChip": { default: "PaymentMethodChip" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/app/tenant/payment/components/ZigzagEdge": { default: "ZigzagEdge" },
    "../lib/receiptData": receiptDataModule(),
  };
  return { module: compile("PaymentReceipt.tsx", deps) };
}

test("the receipt names the tenant and unit, titles the status for a landlord and shows the reference", () => {
  const { module } = loadReceipt();
  const view = (change, footer = "FOOTER") => module.default({ payment: payment(change), footer });
  const paid = view({ status: "paid" });
  const body = text(paid);
  for (const expected of ["Payment received", "₱6000", "Ryan", "Unit A", "Tenant", "Apartment", "Paid on", "APT-ABCD1234", "Reference No.", "FOOTER"]) {
    assert.ok(body.includes(expected), expected);
  }
  // The edge is white paper hanging below the receipt, and the paper casts no box-shadow that could show through it.
  const edge = nodes(paid).find(node => node.type === "ZigzagEdge");
  assert.equal(edge.props.hanging, true);
  assert.equal(edge.props.cutColor, "#ffffff");
  assert.ok(!/shadow/.test(nodes(paid).find(node => node.type === "article").props.className));
  assert.ok(nodes(paid).some(node => node.type === "PaymentMethodChip" && node.props.method === "cash"));
  assert.ok(nodes(paid).some(node => node.type === "StatusChip"));
  assert.ok(text(view({ status: "pending" })).includes("Recorded on"));
  assert.ok(text(view({ status: "pending" })).includes("Payment pending"));
  assert.ok(text(view({ status: "rejected" })).includes("Payment declined"));
  assert.ok(text(view({ status: "failed" })).includes("Payment failed"));
});

test("the receipt shows a breakdown with a total only when the payment has one, and the move-in label", () => {
  const { module } = loadReceipt();
  const plain = text(module.default({ payment: payment({ status: "paid" }), footer: null }));
  assert.ok(!plain.includes("Total"));
  const moveIn = text(module.default({
    payment: payment({ status: "paid", billing_kind: "move_in", amount: 18000, breakdown: [{ label: "First month’s rent", amount: 6000 }, { label: "Security deposit (held separately)", amount: 12000 }] }),
    footer: null,
  }));
  for (const expected of ["Move-in payment", "First month’s rent", "Security deposit (held separately)", "Total", "₱18000"]) assert.ok(moveIn.includes(expected), expected);
});

test("missing tenant or unit show a dash and the copy control is labelled", () => {
  const { module } = loadReceipt();
  const tree = module.default({ payment: payment({ tenant_name: null, apartment_name: null }), footer: null });
  assert.ok(text(tree).includes("—"));
  assert.ok(nodes(tree).some(node => node.type === "button" && node.props["aria-label"] === "Copy reference"));
});

test("the receipt data is plain text with landlord wording, a filename and a total only when there is a breakdown", () => {
  const { receiptData } = receiptDataModule();
  const paid = receiptData(payment({ status: "paid" }));
  assert.deepEqual(
    { title: paid.title, tone: paid.tone, amount: paid.amount, period: paid.period, tenant: paid.tenant, apartment: paid.apartment, dateLabel: paid.dateLabel, method: paid.method, reference: paid.reference, filename: paid.filename },
    { title: "Payment received", tone: "success", amount: "₱6000", period: "period:2026-03-05", tenant: "Ryan", apartment: "Unit A", dateLabel: "Paid on", method: "Cash", reference: "APT-ABCD1234", filename: "receipt-APT-ABCD1234.png" },
  );
  assert.equal(paid.breakdown.length, 0);
  assert.equal(receiptData(payment({ status: "rejected" })).tone, "danger");
  assert.equal(receiptData(payment({ status: "pending" })).tone, "warning");
  assert.equal(receiptData(payment({ status: "pending" })).dateLabel, "Recorded on");
  assert.equal(receiptData(payment({ tenant_name: null, apartment_name: null })).tenant, "—");
  const moveIn = receiptData(payment({ status: "paid", billing_kind: "move_in", breakdown: [{ label: "Rent", amount: 6000 }] }));
  assert.equal(moveIn.period, "Move-in payment");
  assert.deepEqual([...moveIn.breakdown.map(line => [line.label, line.value])], [["Rent", "₱6000"]]);
  assert.equal(receiptData(payment({ reference_id: "a/b c" })).filename, "receipt-abc.png");
});

function fakeCanvas() {
  const calls = { text: [], paths: 0, fills: 0, scale: null, lineDash: [] };
  const context = new Proxy({}, {
    get(target, key) {
      if (key === "measureText") return text => ({ width: String(text).length * 7 });
      if (key === "fillText") return (text, x, y) => calls.text.push({ text, x, y });
      if (key === "scale") return (x, y) => { calls.scale = [x, y]; };
      if (key === "fill") return () => { calls.fills += 1; };
      if (key === "beginPath") return () => { calls.paths += 1; };
      if (key === "setLineDash") return dash => calls.lineDash.push([...dash]);
      return key in target ? target[key] : () => {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob: callback => callback({ type: "image/png", size: 1 }) };
  return { canvas, calls };
}

const imageModule = (globals) => compile("../lib/receiptImage.ts", {}, globals);
const fonts = { heading: "Nunito", body: "Inter" };

test("the receipt image is drawn from the same data, sized to its content, at twice the resolution", () => {
  const { receiptData } = receiptDataModule();
  const { drawReceipt, receiptImageSize, RECEIPT_IMAGE } = imageModule();
  const plain = receiptData(payment({ status: "paid" }));
  const { canvas, calls } = fakeCanvas();
  drawReceipt(canvas, plain, fonts);
  const size = receiptImageSize(plain);
  assert.equal(canvas.width, size.width * RECEIPT_IMAGE.scale);
  assert.equal(canvas.height, size.height * RECEIPT_IMAGE.scale);
  assert.deepEqual([...calls.scale], [2, 2]);
  const written = calls.text.map(item => item.text);
  for (const expected of ["Payment received", "₱6000", "period:2026-03-05", "Tenant", "Ryan", "Apartment", "Unit A", "Paid on", "Method", "Cash", "Status", "Paid", "Reference No.", "APT-ABCD1234"]) {
    assert.ok(written.includes(expected) || written.some(text => text.includes(expected)), expected);
  }
  assert.ok(!written.includes("Total"), "no total without a breakdown");
  assert.ok(calls.fills >= 1, "the paper is filled");
  assert.ok(calls.lineDash.length > 0, "dashed dividers are drawn");
  // Nothing is drawn outside the image.
  assert.ok(calls.text.every(item => item.y > 0 && item.y < size.height && item.x >= 0 && item.x <= size.width));
});

test("a move-in receipt is taller, lists its breakdown and a total, and long values are shortened to fit", () => {
  const { receiptData } = receiptDataModule();
  const { drawReceipt, receiptImageSize } = imageModule();
  const plain = receiptData(payment({ status: "paid" }));
  const moveIn = receiptData(payment({
    status: "paid", billing_kind: "move_in", apartment_name: "A very long apartment name that would never fit on one line of the receipt image",
    breakdown: [{ label: "First month’s rent", amount: 6000 }, { label: "Maintenance fees", amount: 500 }],
  }));
  assert.ok(receiptImageSize(moveIn).height > receiptImageSize(plain).height);
  const { canvas, calls } = fakeCanvas();
  drawReceipt(canvas, moveIn, fonts);
  const written = calls.text.map(item => item.text);
  for (const expected of ["Move-in payment", "First month’s rent", "Maintenance fees", "Total"]) assert.ok(written.includes(expected), expected);
  const apartment = written.find(text => text.startsWith("A very long"));
  assert.ok(apartment.endsWith("…") && apartment.length < moveIn.apartment.length);
});

test("renderReceiptImage waits for fonts and resolves a PNG blob, and rejects if the canvas cannot encode", async () => {
  const { receiptData } = receiptDataModule();
  const data = receiptData(payment({ status: "paid" }));
  let fontsReady = false;
  const { canvas } = fakeCanvas();
  const document = { fonts: { ready: Promise.resolve().then(() => { fontsReady = true; }) }, createElement: () => canvas };
  const blob = await imageModule({ document }).renderReceiptImage(data, fonts);
  assert.equal(fontsReady, true);
  assert.equal(blob.type, "image/png");
  canvas.toBlob = callback => callback(null);
  await assert.rejects(imageModule({ document }).renderReceiptImage(data, fonts), /Couldn't create the receipt image/);
});
