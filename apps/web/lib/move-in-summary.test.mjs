import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(component) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@heroui/react": { Card: Object.assign("Card", { Header: "Header", Content: "Content", Footer: "Footer" }), Chip: "Chip", Separator: "Separator", Button: "Button" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "../utils": { formatPesoDisplay: value => `₱${value.toLocaleString("en-US")}` },
    "./ZigzagEdge": { default: "ZigzagEdge" },
  };
  const compiled = ts.transpileModule(readFileSync(new URL(`../app/tenant/payment/components/${component}.tsx`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, Date, Intl, require: name => { assert.ok(name in dependencies, name); return dependencies[name]; } };
  vm.runInNewContext(compiled, context);
  return context.exports.default;
}

function text(tree) {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (!tree) return "";
  if (Array.isArray(tree)) return tree.map(text).join(" ");
  return text(typeof tree.type === "function" ? tree.type(tree.props) : tree.props?.children);
}

const bill = {
  kind: "move_in", monthlyRent: 15000, rentDue: 15000, securityDeposit: 15000, advanceRent: 15000,
  periodStart: "2026-10-01", periodEnd: "2026-10-31", dueDate: "2026-10-18",
  advancePeriodStart: "2026-11-01", advancePeriodEnd: "2026-11-30", totalDue: 45000,
  fees: [], rentPaid: false, coveredByAdvance: false, pendingPayment: null,
};

test("first payment summary shows all move-in charges and the month 2 coverage dates", () => {
  const Summary = load("PaymentSummaryCard");
  const content = text(Summary({ month: "October", year: "2026", dueDate: bill.dueDate, monthlyRent: 15000, bill }));
  for (const label of ["Move-in payment", "First month’s rent", "Security deposit", "Advance rent — month 2", "₱45,000", "November 1, 2026", "November 30, 2026", "once payment is confirmed", "no prorating"]) assert.ok(content.includes(label), label);
});

test("prepaid month 2 displays zero rent while keeping maintenance payable separately", () => {
  const Summary = load("PaymentSummaryCard");
  const fees = [{ title: "Repair", amount: 500 }];
  const prepaid = { ...bill, kind: "fees", rentDue: 0, securityDeposit: 0, advanceRent: 0, coveredByAdvance: true, rentPaid: true, totalDue: 500, fees };
  const content = text(Summary({ month: "November", year: "2026", dueDate: "2026-11-05", monthlyRent: 15000, fees, bill: prepaid }));
  assert.ok(content.includes("Covered by advance rent"));
  assert.ok(content.includes("₱0"));
  assert.ok(content.includes("₱500"));
  assert.ok(!content.includes("₱15,000"));
});

test("pending receipts display allocations without claiming payment has been received", () => {
  const Receipt = load("ReceiptCard");
  const content = text(Receipt({ apartmentName: "Unit", date: "October 18", time: "10:00", method: "Cash", amount: 45000,
    referenceNumber: "PAY-TEST", status: "Pending", paymentLabel: "Move-in payment",
    breakdown: [{ label: "First month’s rent", amount: 15000 }, { label: "Security deposit", amount: 15000 }, { label: "Advance rent — month 2", amount: 15000 }],
  }));
  for (const label of ["Payment Pending", "Payment Amount", "First month’s rent", "Security deposit", "Advance rent — month 2", "₱45,000"]) assert.ok(content.includes(label), label);
  assert.ok(!content.includes("Amount Paid"));
});
