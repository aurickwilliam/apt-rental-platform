import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const componentSource = name => readFileSync(new URL(`../app/tenant/my-rental/${name}`, import.meta.url), "utf8");
const nodes = element => !element || typeof element !== "object" ? [] :
  [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];

function renderRental({ paid = false, bill = null, payments = [], effects = [] } = {}) {
  const jsx = (type, props) => ({ type, props });
  const noOp = () => {};
  const tenancy = {
    bill,
    id: "tenancy", lease_start: "2026-10-20", lease_end: "2027-10-20", rent_due_day: 5,
    signed_lease_path: null,
    apartment: { id: "apartment", name: "Cozy Cove", apartment_images: [] },
    landlord: { first_name: "Test", last_name: "Owner" },
  };
  const Table = Object.assign(noOp, Object.fromEntries(
    ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"].map(name => [name, `Table.${name}`]),
  ));
  const modules = {
    react: { useState: initial => [initial, noOp], useMemo: fn => fn(), useEffect: callback => effects.push(callback), useRef: value => ({ current: value }) },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@heroui/react": {
      Button: "Button", Link: "Link", Spinner: "Spinner", Table,
      Modal: Object.fromEntries(["Backdrop", "Container", "Dialog", "Header", "Heading", "Body"].map(name => [name, `Modal.${name}`])),
      useOverlayState: () => ({ isOpen: false, setOpen: noOp }), toast: { info: noOp },
    },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": {
      formatPesoDisplay: amount => `₱ ${amount}`,
      getCurrentRentStatus: () => bill
        ? { monthlyRent: bill.monthlyRent, isFullyPaid: bill.rentPaid, periodStart: bill.periodStart, dueDate: bill.dueDate }
        : { monthlyRent: 15500, isFullyPaid: paid, periodStart: "2026-11-01", dueDate: "2026-11-05" },
      nextPaymentPeriod: periodStart => periodStart.startsWith("2026-10")
        ? { periodStart: "2026-11-01", dueDate: "2026-11-05" }
        : { periodStart: "2026-12-01", dueDate: "2026-12-05" },
      nextUnpaidRentPeriod: () => ({ periodStart: "2026-12-01", dueDate: "2026-12-05" }),
    },
    "@/hooks/use-tenancy": { useTenancy: () => ({ tenancy, payments, loading: false, error: null, refetch: noOp }) },
    "@/hooks/use-tenant-applications": { useTenantApplications: () => ({ applications: [], loading: false, error: null }) },
    "@/hooks/use-maintenance-request-history": { useMaintenanceRequestHistory: () => ({ requests: [], loading: false, error: null }) },
    "@/hooks/use-signed-lease-viewer": { useSignedLeaseViewer: () => ({ viewSignedLease: noOp, viewing: false }) },
    "../maintenance/data/maintenance-data": { CATEGORIES: [] },
  };
  const compiled = ts.transpileModule(componentSource("page.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => modules[name] ?? { default: name } };
  vm.runInNewContext(compiled, context);
  return nodes(context.exports.default());
}

const content = all => all.flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ").replace(/\s+/g, " ");
const moveInBill = {
  kind: "move_in", periodStart: "2026-10-01", periodEnd: "2026-10-31", dueDate: "2026-10-21",
  monthlyRent: 15000, rentDue: 15000, securityDeposit: 15000, advanceRent: 15000,
  advancePeriodStart: "2026-11-01", advancePeriodEnd: "2026-11-30",
  fees: [{ id: "fee-1", title: "Plumbing problem", amount: 500 }], totalDue: 45500,
  rentPaid: false, coveredByAdvance: false, pendingPayment: null,
};

test("My Rental uses the checkout move-in total and includes each charge exactly once", () => {
  const effects = [];
  const all = renderRental({ bill: moveInBill, effects });
  const text = content(all);
  for (const label of ["Move-in payment", "₱ 45500", "October 2026 rent", "Security deposit", "November 2026 advance rent", "Plumbing problem", "Due Oct 21, 2026"]) assert.ok(text.includes(label), label);
  assert.equal(all.filter(node => node.type === "p" && node.props.children === "₱ 45500").length, 1);
  assert.ok(!text.includes("₱ 15500"));
  for (const removed of ["month 2", "held separately", "no prorating", "Advance covers", "October 2026 - Due"]) {
    assert.ok(!text.includes(removed), `removed from the card: ${removed}`);
  }
  assert.equal(effects[0](), undefined, "server bills do not start a separate maintenance-fee lookup");
  assert.equal(all.find(node => node.type === "./components/MiniCalendar").props.highlightLabel, "Move-in payment due");
});

test("My Rental pending move-in payments stay uncredited and link to their existing receipt", () => {
  for (const method of ["cash", "gcash"]) {
    const all = renderRental({ bill: { ...moveInBill, pendingPayment: { id: "payment-1", referenceId: "pay_pending", method } } });
    assert.ok(content(all).includes("₱ 45500"));
    assert.ok(content(all).includes("Awaiting confirmation"));
    assert.ok(content(all).includes("View payment"));
    assert.ok(!content(all).includes("Payment received for this month."));
    assert.ok(all.some(node => node.type === "Link" && node.props.href === (method === "cash" ? "/tenant/payment/success?referenceId=pay_pending" : "/tenant/payment/verify?sessionId=pay_pending")));
  }
});

test("My Rental shows the following payable month after a prepaid month", () => {
  const all = renderRental({ bill: { ...moveInBill, kind: "fees", periodStart: "2026-11-01", dueDate: "2026-11-05", rentDue: 0,
    securityDeposit: 0, advanceRent: 0, rentPaid: true, coveredByAdvance: true, totalDue: 0, fees: [] } });
  const text = content(all);
  assert.ok(text.includes("Covered by advance rent"));
  assert.ok(text.includes("This month’s rent was prepaid"));
  assert.ok(text.includes("Next Payment"));
  assert.ok(text.includes("December 2026"));
  assert.ok(text.includes("Due Dec 5, 2026"));
  assert.ok(text.includes("₱ 15000"));
  assert.ok(!text.includes("Pay now"));
  assert.equal(all.find(node => node.type === "./components/MiniCalendar").props.highlightDate, null);
});

test("My Rental shows the next payment after a settled month and skips the advance-covered month", () => {
  const all = renderRental({
    bill: { ...moveInBill, kind: "fees", periodStart: "2026-10-01", periodEnd: "2026-10-31",
      dueDate: "2026-10-21", rentDue: 0, securityDeposit: 0, advanceRent: 0,
      rentPaid: true, coveredByAdvance: false, totalDue: 0, fees: [] },
    payments: [{
      id: "move-in", billing_kind: "move_in", amount: 45000, status: "paid", date: "2026-10-20",
      period_start: "2026-10-01", rent_amount: 15000, advance_amount: 15000, advance_period_start: "2026-11-01",
    }],
  });
  const text = content(all);
  assert.ok(text.includes("Payment received for this month."));
  assert.ok(text.includes("Next Payment"));
  assert.ok(text.includes("December 2026"));
  assert.ok(text.includes("Due Dec 5, 2026"));
  assert.ok(text.includes("November 2026 is covered by your advance rent."));
  assert.ok(text.includes("₱ 15000"));
  assert.ok(!text.includes("Current bill"));
  assert.ok(!text.includes("No further payment is due for this period."));
  assert.equal(all.find(node => node.type === "./components/MiniCalendar").props.highlightDate, null);
});

test("prepaid rent does not hide separate maintenance, and later months bill only monthly rent", () => {
  const fees = renderRental({ bill: { ...moveInBill, kind: "fees", rentPaid: true, coveredByAdvance: true, rentDue: 0, securityDeposit: 0, advanceRent: 0, totalDue: 500 } });
  assert.ok(content(fees).includes("₱ 500"));
  assert.ok(content(fees).includes("Pay now"));
  assert.ok(!content(fees).includes("Payment received for this month."));
  const monthly = renderRental({ bill: { ...moveInBill, kind: "monthly", totalDue: 15000, securityDeposit: 0, advanceRent: 0, fees: [] } });
  assert.ok(content(monthly).includes("₱ 15000"));
  assert.ok(!content(monthly).includes("Move-in payment"));
  assert.ok(!content(monthly).includes("Security deposit"));
});

test("My Rental identifies move-in payments correctly in its history", () => {
  const all = renderRental({ bill: moveInBill, payments: [{ id: "move-in", billing_kind: "move_in", amount: 45500, status: "pending", date: "2026-10-21", period_start: "2026-10-01" }] });
  assert.ok(content(all).includes("October 2026 - Move-in payment"));
  assert.ok(!content(all).includes("October 2026 - Monthly rent"));
});

test("quick action links and button fill the same equal-height grid cells", () => {
  const all = renderRental();
  const grid = all.find(node => node.props.className?.includes("rental-quick-actions"));
  assert.match(grid.props.className, /auto-rows-fr/);
  assert.match(grid.props.className, /@min-\[28rem\]\/dashboard:grid-cols-2/);
  assert.match(grid.props.className, /@min-\[44rem\]\/dashboard:grid-cols-4/);
  const tiles = grid.props.children;
  assert.equal(tiles.length, 4);
  assert.equal(tiles[1].type, "button", "signed lease remains an action rather than navigation");
  assert.equal(typeof tiles[1].props.onClick, "function");
  assert.equal(tiles[0].props.href, "/tenant/browse/apartment");
  assert.equal(tiles[2].props.href, "/tenant/payment/history");
  assert.equal(tiles[3].props.href, "/tenant/maintenance");
  for (const tile of tiles) {
    assert.match(tile.props.className, /h-full min-h-20 w-full min-w-0/);
    assert.match(tile.props.className, /focus-visible:outline-2/);
    assert.equal(tile.props.children.type, "Fragment", "content is directly inside each tile, not a shrink-wrapped inner box");
  }
});

test("paid and unpaid layouts respond to content width and contain table scrolling", () => {
  for (const paid of [false, true]) {
    const all = renderRental({ paid });
    assert.ok(all.some(node => node.props.className?.includes("@container/rental")));
    assert.equal(all.filter(node => node.props.className?.includes("@min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]")).length, 2);
    assert.ok(all.some(node => node.props.className?.includes("@container/rent")));
    const scroll = all.find(node => node.type === "Table.ScrollContainer");
    assert.match(scroll.props.className, /max-w-full overflow-x-auto/);
    assert.match(all.find(node => node.type === "Table.Content").props.className, /min-w-\[32rem\]/);
    assert.ok(all.some(node => node.props.className?.includes(paid ? "@min-[32rem]/rent:grid-cols-2" : "@min-[36rem]/rent:grid-cols-3")));
  }
});

test("loading states mirror container-based card and quick action layouts", () => {
  const skeleton = componentSource("components/MyRentalSkeleton.tsx");
  assert.ok(skeleton.includes("@container/rental"));
  for (const rule of ["@min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]", "@min-[28rem]/dashboard:grid-cols-2", "@min-[44rem]/dashboard:grid-cols-4"]) {
    assert.ok(skeleton.includes(rule), `skeleton retains ${rule}`);
  }
  assert.match(componentSource("components/DashboardCard.tsx"), /@container\/dashboard min-w-0/);
  assert.match(componentSource("components/MiniCalendar.tsx"), /mx-auto w-full max-w-sm/);
  assert.match(componentSource("components/MiniCalendar.tsx"), /aspect-square w-full max-w-10/);
});
