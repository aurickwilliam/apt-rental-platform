import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const ROOT = new URL("../app/tenant/my-rental/", import.meta.url);
const componentSource = name => readFileSync(new URL(name, ROOT), "utf8");
const transpile = file => ts.transpileModule(componentSource(file), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

// Local modules compiled for real; every other local module is a string stand-in
// named by its path, so the tree keeps showing where it would render.
const REAL_MODULES = new Set([
  "components/PaymentSummaryCard", "components/RentalQuickActions", "components/RentalLandlordCard",
  "components/RentalMaintenanceCard", "components/PaymentHistoryCard", "components/RentalApplications",
  "components/LeaseOverviewCard", "rental-summary", "utils", "maintenance-preview", "lease-progress",
]);

const children = element => [element.props?.children].flat(Infinity);
/** Fully expanded: function components are called, so their markup is searchable. */
const nodes = element => !element || typeof element !== "object" ? [] :
  [element, ...[typeof element.type === "function" ? element.type(element.props) : null].filter(Boolean).flatMap(nodes),
    ...children(element).flatMap(nodes)];
/** As written in the page: function components stay as nodes. */
const rawNodes = element => !element || typeof element !== "object" ? [] : [element, ...children(element).flatMap(rawNodes)];
const typeName = node => typeof node?.type === "function" ? node.type.name : node?.type;

function renderRentalRoot({ paid = false, bill = null, payments = [], effects = [], maintenance = { requests: [], loading: false, error: null }, noTenancy = false, noLandlord = false, quickActionIds = ["receipts", "repairs", "message-landlord", "signed-lease", "my-rental"], applicationsLoading = false, financeLoading = false, financeError = null, paymentError = null } = {}) {
  const jsx = (type, props) => ({ type, props });
  const noOp = () => {};
  const tenancy = {
    bill,
    id: "tenancy", lease_start: "2026-10-20", lease_end: "2027-10-20", rent_due_day: 5, monthly_rent: 15000,
    signed_lease_path: null,
    apartment: { id: "apartment", name: "Cozy Cove", apartment_images: [] },
    landlord: noLandlord ? null : { id: "landlord", first_name: "Test", last_name: "Owner" },
  };
  const Table = Object.assign(noOp, Object.fromEntries(
    ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"].map(name => [name, `Table.${name}`]),
  ));
  const modules = {
    react: { useState: initial => [initial, noOp], useMemo: fn => fn(), useEffect: callback => effects.push(callback), useRef: value => ({ current: value }), Suspense: "Suspense" },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@heroui/react": {
      Button: "Button", Link: "Link", Spinner: "Spinner", Table, buttonVariants: () => "button",
      Modal: Object.fromEntries(["Backdrop", "Container", "Dialog", "Header", "Heading", "Body"].map(name => [name, `Modal.${name}`])),
      useOverlayState: () => ({ isOpen: false, setOpen: noOp }), toast: { info: noOp },
    },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/constants": { MAINTENANCE_URGENCY: [{ value: "low", label: "Low" }, { value: "high", label: "High" }] },
    "@repo/utils": {
      formatPesoDisplay: amount => `₱ ${amount}`,
      // The shared Payment History rule, as in packages/utils/src/paymentHistory.ts.
      filterPaymentHistory: (rows, showFailed) => rows.filter(row => {
        const status = row.status.toLowerCase();
        return status !== "pending" && !(status === "failed" && !showFailed);
      }),
      getCurrentRentStatus: () => bill
        ? { monthlyRent: bill.monthlyRent, isFullyPaid: bill.rentPaid, periodStart: bill.periodStart, dueDate: bill.dueDate }
        : { monthlyRent: 15500, isFullyPaid: paid, periodStart: "2026-11-01", dueDate: "2026-11-05" },
      nextPaymentPeriod: periodStart => periodStart.startsWith("2026-10")
        ? { periodStart: "2026-11-01", dueDate: "2026-11-05" }
        : { periodStart: "2026-12-01", dueDate: "2026-12-05" },
      nextUnpaidRentPeriod: () => ({ periodStart: "2026-12-01", dueDate: "2026-12-05" }),
    },
    "@/hooks/use-tenancy": { useTenancy: () => ({ tenancy: noTenancy ? null : tenancy, payments, loading: false, error: null, financeLoading, financeError, paymentError, refetch: noOp, revalidate: noOp, retryFinance: noOp }) },
    "@/hooks/use-auth-identity": { useAuthIdentity: () => ({ authUserId: "auth-a", generation: 0 }) },
    "@/hooks/use-tenant-applications": { useTenantApplications: () => ({ applications: [], loading: applicationsLoading, error: null }) },
    "@/hooks/use-rental-quick-actions": { useRentalQuickActions: () => ({ ids: quickActionIds, save: () => true }) },
    "@/hooks/use-payments": { usePayment: () => ({ data: null, loading: false, error: null }) },
    "@/hooks/use-maintenance-request-history": { useMaintenanceRequestHistory: () => maintenance },
    "@/hooks/use-signed-lease-viewer": { useSignedLeaseViewer: () => ({ viewSignedLease: noOp, viewing: false }) },
    "@/lib/conversation-contacts": { getContactConversationKey: (peer, apartment) => `${peer}:${apartment ?? "none"}` },
    "@/lib/public-profile": { landlordProfileHref: (portal, id, apartment) => `/${portal}/landlords/${id}?apartmentId=${apartment}` },
    "../maintenance/data/maintenance-data": { CATEGORIES: [{ id: "structural", label: "Structural" }] },
    "../../maintenance/data/maintenance-data": { CATEGORIES: [{ id: "structural", label: "Structural" }] },
  };
  const cache = new Map();
  const load = (file, dir) => {
    if (cache.has(file)) return cache.get(file).exports;
    const context = { exports: {}, require: name => resolve(name, dir) };
    cache.set(file, context);
    vm.runInNewContext(transpile(file), context);
    return context.exports;
  };
  const resolve = (name, dir) => {
    if (modules[name]) return modules[name];
    if (!name.startsWith(".")) return { default: name };
    const path = new URL(name, new URL(`${dir}/`, "file:///")).pathname.slice(1);
    const normalized = path.replace(/^\/+/, "");
    if (REAL_MODULES.has(normalized)) {
      const file = existsSync(new URL(`${normalized}.tsx`, ROOT)) ? `${normalized}.tsx` : `${normalized}.ts`;
      return load(file, normalized.includes("/") ? normalized.slice(0, normalized.lastIndexOf("/")) : "");
    }
    return { default: normalized.startsWith("..") ? name : `./${normalized}` };
  };
  const client = load("MyRentalClient.tsx", "");
  const tree = client.default({ initialContext: { authUserId: "auth-a", tenancy, error: null, renderedAt: "2026-11-12T04:00:00.000Z" } });
  return tree.type(tree.props);
}

const renderRental = options => nodes(renderRentalRoot(options));

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
});

test("unresolved finance keeps the rental shell and hides payment actions; failures never masquerade as empty history", () => {
  const loading = renderRental({ financeLoading: true });
  assert.ok(loading.some(node => node.type === "./components/RentalHero"));
  assert.ok(loading.some(node => node.type === "./components/SignedLeaseCard"));
  assert.ok(loading.some(node => node.type === "./components/RentFinanceSkeleton"));
  assert.ok(loading.some(node => node.type === "./components/PaymentHistorySkeleton"));
  assert.ok(!loading.some(node => node.type === "./components/MyRentalSkeleton"));
  assert.ok(!content(loading).includes("Pay now"));
  for (const failure of [{ financeError: "Bill unavailable" }, { paymentError: "History unavailable" }]) {
    const failed = renderRental(failure);
    assert.ok(!content(failed).includes("Pay now"));
    assert.ok(!failed.some(node => node.props?.title === "No completed payments yet"));
    assert.ok(content(failed).includes("Payment history could not load"));
    assert.ok(failed.some(node => node.type === "./components/RentalHero"));
    assert.ok(failed.some(node => node.type === "./components/RentFinanceError"));
  }
});

test("no tenancy waits in the application region, not a second full-page skeleton, then settles honestly", () => {
  const loading = renderRental({ noTenancy: true, applicationsLoading: true });
  const list = loading.find(node => node.type === "./components/ApplicationsList");
  assert.equal(list.props.loading, true);
  assert.ok(!loading.some(node => node.type === "./components/MyRentalSkeleton"));
  assert.ok(!loading.some(node => node.type === "./components/TenancyEmptyState"));
  assert.ok(renderRental({ noTenancy: true }).some(node => node.type === "./components/TenancyEmptyState"));
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

test("the payment card lists the charges behind its total, the last confirmed payment and the following month", () => {
  const paymentText = options => content(nodes(rawNodes(renderRentalRoot(options)).find(node => typeName(node) === "PaymentSummaryCard")));
  const moveIn = paymentText({ bill: moveInBill });
  for (const label of ["October 2026 rent", "Security deposit", "November 2026 advance rent", "Maintenance fee — Plumbing problem", "Total due", "Last payment", "None yet", "Next after this", "December 2026 · Due Dec 5, 2026"]) {
    assert.ok(moveIn.includes(label), label);
  }
  const monthly = paymentText({
    bill: { ...moveInBill, kind: "monthly", periodStart: "2026-11-01", dueDate: "2026-11-05", totalDue: 15000, securityDeposit: 0, advanceRent: 0, fees: [] },
    payments: [
      { id: "older", amount: 15000, status: "paid", date: "2026-09-04", period_start: "2026-09-01" },
      { id: "newest", amount: 15000, status: "paid", date: "2026-10-03", period_start: "2026-10-01" },
      { id: "unconfirmed", amount: 15000, status: "pending", date: "2026-10-30", period_start: "2026-11-01" },
    ],
  });
  for (const label of ["November 2026 rent", "Maintenance fees", "None", "Total due", "October 2026 · Paid Oct 3, 2026", "December 2026 · Due Dec 5, 2026"]) {
    assert.ok(monthly.includes(label), label);
  }
  assert.ok(!monthly.includes("Security deposit"));
  assert.ok(!monthly.includes("Paid Oct 30"), "an unconfirmed payment is never the last payment");
});

test("My Rental identifies move-in payments correctly in its history", () => {
  const all = renderRental({ bill: moveInBill, payments: [{ id: "move-in", billing_kind: "move_in", amount: 45500, status: "paid", date: "2026-10-21", period_start: "2026-10-01" }] });
  assert.ok(content(all).includes("October 2026 - Move-in payment"));
  assert.ok(!content(all).includes("October 2026 - Monthly rent"));
});

test("quick actions are a compact mobile-style row the tenant can customize", () => {
  const all = renderRental();
  const grid = all.find(node => node.props.className?.includes("rental-quick-actions"));
  assert.match(grid.props.className, /grid-cols-5/, "five across at every width, like mobile");
  assert.doesNotMatch(grid.props.className, /@min-/, "no wide row-tile variant");
  const tiles = grid.props.children;
  assert.deepEqual([...tiles.map(tile => tile.props.children.props.label)], ["Receipts", "Repairs", "Message landlord", "Signed lease", "My rental"]);
  assert.equal(tiles[3].type, "Button", "signed lease remains an action rather than navigation");
  assert.equal(typeof tiles[3].props.onPress, "function");
  assert.equal(tiles[0].props.href, "/tenant/payment/history");
  assert.equal(tiles[1].props.href, "/tenant/maintenance");
  assert.equal(tiles[2].props.href, "/tenant/messages?conversation=landlord%3Aapartment");
  assert.equal(tiles[4].props.href, "/tenant/browse/apartment");
  for (const tile of tiles) {
    assert.match(tile.props.className, /cursor-pointer/);
    assert.match(tile.props.className, /focus-visible:outline-2/);
    assert.match(tile.props.className, /flex-col items-center/, "icon over caption");
  }
  const tileIcons = nodes(grid).filter(node => node.props.className?.includes("size-12"));
  assert.equal(tileIcons.length, 5);
  assert.ok(tileIcons.every(node => node.props.className.includes("bg-muted")), "neutral tiles, not per-action tints");
  const edit = all.find(node => node.props?.["aria-label"] === "Customize quick actions");
  assert.equal(edit.type, "Button");
  assert.equal(edit.props.isIconOnly, true);
  assert.ok(!all.some(node => node.type === "./components/RentalQuickActionsEditor"), "the editor mounts only while open");

  const noLandlord = nodes(renderRentalRoot({ noLandlord: true })).find(node => node.props.className?.includes("rental-quick-actions"));
  assert.equal(noLandlord.props.children.length, 4, "Message landlord needs a landlord");

  const custom = renderRental({ quickActionIds: ["profile", "favorites", "browse"] });
  const customGrid = custom.find(node => node.props.className?.includes("rental-quick-actions"));
  assert.deepEqual([...customGrid.props.children.map(tile => tile.props.href)], ["/tenant/profile", "/tenant/favorites", "/tenant/browse"], "the saved choice and its order are shown");
  const empty = renderRental({ quickActionIds: [] });
  assert.ok(!empty.some(node => node.props?.className?.includes("rental-quick-actions")));
  assert.ok(content(empty).includes("No quick actions chosen"));
});

test("landlord card opens the profile and messages the rental conversation, and is skipped without a landlord", () => {
  const all = renderRental();
  const links = all.filter(node => node.type === "next/link");
  assert.ok(links.some(node => node.props.href === "/tenant/landlords/landlord?apartmentId=apartment"));
  const message = links.find(node => node.props["aria-label"] === "Message Test Owner");
  assert.equal(message.props.href, "/tenant/messages?conversation=landlord%3Aapartment");
  assert.ok(content(all).includes("Landlord"));
  assert.ok(!renderRental({ noLandlord: true }).some(node => typeName(node) === "RentalLandlordCard" || node.props?.["aria-label"] === "Message Test Owner"));
});

test("photo and payment share the first row; sections follow mobile's order with supporting cards on the right", () => {
  const tracks = /@min-\[56rem\]\/rental:grid-cols-\[minmax\(0,1\.7fr\)_minmax\(20rem,1fr\)\]/;
  for (const paid of [false, true]) {
    const shell = rawNodes(renderRentalRoot({ paid })).find(node => node.props.className?.includes("@container/rental"));
    const [top, columns] = children(shell);
    assert.match(top.props.className, tracks);
    assert.deepEqual([...children(top).map(typeName)], ["./components/RentalHero", "PaymentSummaryCard"]);
    assert.match(columns.props.className, tracks, "the lower sections reuse the first row's tracks");
    assert.match(columns.props.className, /@min-\[56rem\]\/rental:items-start/);
    const [main, side] = children(columns);
    const names = column => [...children(column).filter(Boolean).map(typeName)];
    assert.deepEqual(names(main), ["RentalQuickActions", "RentalMaintenanceCard", "PaymentHistoryCard"], "quick actions open the left column");
    assert.deepEqual(names(side), ["RentalLandlordCard", "LeaseOverviewCard", "@/app/components/renewals/LeaseRenewalEntry", "Suspense"]);
    const [applications] = children(children(side)[3]);
    assert.equal(typeName(applications), "RentalApplications", "application history closes the lease column");
    assert.equal(applications.props.activeLease, true);
    const leaseCard = children(side)[1];
    const [lease] = children(leaseCard);
    assert.equal(lease.type, "./components/SignedLeaseCard", "the signed contract lives inside the lease card");
    assert.equal(lease.props.embedded, true);
    assert.equal(lease.props.tenancyId, "tenancy");
    assert.equal(typeof lease.props.onView, "function");
    assert.equal(typeof lease.props.onAcknowledged, "function");
    const renewal = children(side)[2];
    assert.equal(renewal.props.tenancyId, "tenancy");
    assert.equal(renewal.props.portal, "tenant");
    assert.ok(!rawNodes(shell).some(node => /Calendar/.test(String(typeName(node)))), "the rent calendar is gone; the due date sits in the payment card");
  }
});

test("application history opens a right-hand drawer of compact rows with filter and sort in a popover", async () => {
  const { readFile } = await import("node:fs/promises");
  const read = name => readFile(new URL(`../app/tenant/my-rental/components/${name}.tsx`, import.meta.url), "utf8");
  const [entry, drawer, row, list] = await Promise.all(["RentalApplications", "ApplicationHistoryDrawer", "ApplicationHistoryRow", "ApplicationsList"].map(read));
  assert.match(entry, /<ApplicationHistoryDrawer isOpen=\{historyDialog\.isOpen\}/);
  assert.doesNotMatch(entry, /Modal/, "the history is no longer a centred modal");
  assert.match(drawer, /<Drawer\.Content placement="right">/);
  assert.match(drawer, /filterApplicationList\(applications, filters\)/, "the drawer filters and sorts with the shared list rule");
  assert.match(drawer, /aria-label="Filter by status"/);
  assert.match(drawer, /aria-label="Sort applications"/);
  assert.match(drawer, /<Popover isOpen=\{filterOpen\}/, "filter and sort sit behind one icon button");
  assert.match(drawer, /<Button isIconOnly variant="tertiary" aria-label=\{filterLabel\}/);
  assert.ok(drawer.indexOf("aria-label={filterLabel}") < drawer.indexOf('aria-label="Close application history"'), "filter comes before Close in the header row");
  assert.doesNotMatch(drawer, /Drawer\.CloseTrigger/, "Close sits in the header's flow, so it cannot overlap the filter button");
  assert.match(drawer, /rounded-l-3xl/, "the drawer's left corners are rounded");
  assert.doesNotMatch(drawer, /replaceState|useSearchParams/, "drawer filters never touch the page URL");
  assert.match(row, /size-16/, "rows use a small square photo");
  assert.match(row, /applicationDetailHref\(/);
  assert.doesNotMatch(row, /View application</, "the whole row is the link, with no separate button");
  assert.doesNotMatch(list, /showHeader/, "the full list no longer has a modal mode");
});

test("the payment card stays compact and stretches beside the photo; lease facts live in the lease card", () => {
  for (const paid of [false, true]) {
    const root = renderRentalRoot({ paid });
    const payment = nodes(rawNodes(root).find(node => typeName(node) === "PaymentSummaryCard"));
    assert.match(payment.find(node => node.type === "section").props.className, /flex h-full min-w-0 flex-col/);
    const paymentText = content(payment);
    for (const moved of ["Lease start", "Lease end"]) assert.ok(!paymentText.includes(moved), `${moved} left the payment card`);
    assert.ok(paymentText.includes(paid ? "Payment history" : "Pay now"));
    const lease = nodes(rawNodes(root).find(node => typeName(node) === "LeaseOverviewCard"));
    const leaseText = content(lease);
    for (const label of ["Your lease", "11 months left", "Started Oct 20, 2026", "Ends Oct 20, 2027", "Monthly rent", "₱ 15000", "Due every", "5th of the month"]) {
      assert.ok(leaseText.includes(label), label);
    }
    const bar = lease.find(node => node.props.role === "progressbar");
    assert.equal(bar.props["aria-valuenow"], 6);
  }
});

test("recent payments is a short list, newest three, never a sideways-scrolling table", () => {
  const payments = ["2026-10", "2026-09", "2026-08", "2026-07"].map((month, index) => (
    { id: `p${index}`, billing_kind: "monthly", amount: 15000, status: "paid", date: `${month}-15`, period_start: `${month}-01` }
  ));
  const all = renderRental({ payments });
  const list = all.find(node => node.type === "ul" && node.props["aria-label"] === "Recent payments");
  assert.equal(list.props.children.length, 3);
  const rows = nodes(list).filter(node => node.type === "Button");
  assert.equal(rows.length, 3, "each row is one button that opens its receipt");
  assert.equal(rows[0].props["aria-label"], "View receipt for October 2026 - Monthly rent, Paid");
  assert.equal(typeof rows[0].props.onPress, "function");
  assert.match(rows[0].props.className, /cursor-pointer/);
  const chips = nodes(list).filter(node => node.type === "@/app/components/display/StatusChip");
  assert.ok(chips.every(chip => nodes(chip).some(node => node.props?.["aria-hidden"] === "true")), "every status chip carries an icon");
  assert.ok(!all.some(node => String(node.type).endsWith("ReceiptModal")), "the receipt opens only after a row is pressed");
  assert.ok(content(all).includes("Recent payments"));
  assert.ok(content(all).includes("October 2026 - Monthly rent"));
  assert.ok(!content(all).includes("July 2026 - Monthly rent"));
  assert.ok(!all.some(node => String(node.type).startsWith("Table")));
  const empty = renderRental().find(node => node.props?.title === "No completed payments yet");
  assert.ok(empty, "the shared EmptyState (icon on a circle, title, description) fills an empty list");
  assert.ok(empty.props.description.length > 0);
});

test("recent payments list the same rows as Payment History: no pending payments, no abandoned checkouts", () => {
  const rows = statuses => statuses.map((status, index) => (
    { id: `p${index}`, billing_kind: "monthly", amount: 15000, status, date: `2026-10-1${index}`, period_start: "2026-10-01" }
  ));
  const labelsOf = statuses => {
    const list = renderRental({ payments: rows(statuses) }).find(node => node.type === "ul" && node.props["aria-label"] === "Recent payments");
    return list ? nodes(list).filter(node => node.type === "Button").map(row => row.props["aria-label"].split(", ").pop()) : [];
  };
  assert.deepEqual([...labelsOf(["paid", "pending", "failed", "failed", "rejected"])], ["Paid", "Rejected"], "pending and failed are hidden, rejected cash stays");
  assert.deepEqual([...labelsOf(["pending", "failed", "failed"])], [], "only pending and failed rows leaves nothing to list");
  assert.ok(renderRental({ payments: rows(["pending", "failed"]) }).some(node => node.props?.title === "No completed payments yet"));
  assert.deepEqual([...labelsOf(["expired"])], ["Failed"], "an expired attempt that passes the rule still reads Failed, never Pending");
});

test("lease progress reports the share elapsed and a plain time-left label", () => {
  const exports = {};
  vm.runInNewContext(transpile("lease-progress.ts"), { exports, Intl, Date, Math, Number });
  const { describeLeaseProgress, formatRentDueDay } = exports;
  const at = iso => new Date(`${iso}T04:00:00Z`);
  const plain = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(describeLeaseProgress("2026-10-20", "2027-10-20", at("2026-11-12"))), { percent: 6, remainingLabel: "11 months left", ended: false });
  assert.deepEqual(plain(describeLeaseProgress("2026-10-20", "2027-10-20", at("2027-09-20"))), { percent: 92, remainingLabel: "1 month left", ended: false });
  assert.equal(describeLeaseProgress("2026-10-20", "2027-10-20", at("2027-10-08")).remainingLabel, "12 days left");
  assert.equal(describeLeaseProgress("2026-10-20", "2027-10-20", at("2027-10-19")).remainingLabel, "1 day left");
  assert.deepEqual(plain(describeLeaseProgress("2026-10-20", "2027-10-20", at("2027-11-01"))), { percent: 100, remainingLabel: "Lease ended", ended: true });
  assert.deepEqual(plain(describeLeaseProgress("2026-10-20", null, at("2026-11-12"))), { percent: null, remainingLabel: "Ongoing", ended: false });
  assert.equal(describeLeaseProgress("2026-10-20", "2027-10-20", at("2026-09-01")).percent, 0, "never negative before move-in");
  assert.deepEqual(["1", "2", "3", "4", "11", "12", "13", "21", "22", "23", "31"].map(day => formatRentDueDay(Number(day))),
    ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "31st"].map(day => `${day} of the month`));
});

test("Maintenance keeps its loading, error, empty and request states", () => {
  const requests = [{ id: "repair", title: "Broken tiles", category: "structural", urgency: "low", created_at: "2026-10-20", resolved_at: "2026-10-22", status: "Resolved" }];
  for (const maintenance of [
    { requests: [], loading: true, error: null },
    { requests: [], loading: false, error: "Could not load maintenance" },
    { requests: [], loading: false, error: null },
    { requests, loading: false, error: null },
  ]) {
    const all = renderRental({ maintenance });
    const card = nodes(rawNodes(renderRentalRoot({ maintenance })).find(node => typeName(node) === "RentalMaintenanceCard"));
    const text = content(card);
    assert.ok(text.includes("Maintenance"));
    const request = card.find(node => node.props?.["aria-label"] === "Request maintenance");
    assert.equal(request.props.href, "/tenant/maintenance", "requesting stays available in every state");
    const headerActions = card.find(node => node.type === "div" && content(nodes(node)).includes(" Active") && nodes(node).includes(request) && !nodes(node).some(child => child.type === "h2"));
    assert.ok(headerActions, "Request sits in the header beside the active count");
    assert.ok(!text.includes("View all"), "the title's chevron link replaces View all");
    const title = card.find(node => node.props?.["aria-label"] === "Maintenance, view all requests");
    assert.equal(title.props.href, "/tenant/maintenance");
    assert.ok(nodes(title).some(node => node.props?.["aria-hidden"] === "true"), "a chevron follows the title");
    assert.ok(all.length > 0);
    if (maintenance.loading) assert.ok(card.some(node => node.type === "Spinner"));
    else if (maintenance.error) assert.ok(text.includes(maintenance.error));
    else if (!maintenance.requests.length) assert.ok(card.some(node => node.props.title === "No active maintenance requests"));
    else {
      assert.ok(text.includes("Broken tiles"));
      assert.ok(text.includes("Category: Structural"));
      assert.ok(text.includes("Low Urgency"));
      assert.ok(card.some(node => node.props.children?.[0] === 0 && node.props.children?.[1] === " Active"));
      const resolved = card.find(node => node.type === "@/app/components/display/StatusChip" && node.props.tone === "success");
      assert.ok(content(nodes(resolved)).includes("Resolved"));
      assert.ok(card.filter(node => node.type === "@/app/components/display/StatusChip").every(chip => nodes(chip).some(node => node.props?.["aria-hidden"] === "true")), "status and urgency chips carry an icon");
    }
  }
});

test("the maintenance preview keeps active repairs in view and falls back to one resolved request", async () => {
  const exports = {};
  vm.runInNewContext(transpile("maintenance-preview.ts"), { exports, require: () => ({}) });
  const { selectMaintenancePreview, MAINTENANCE_PREVIEW_LIMIT } = exports;
  const make = (id, status, created, resolved = null) => ({ id, status, created_at: created, resolved_at: resolved });
  const many = [make("a", "Pending", "2026-10-05"), make("b", "In Progress", "2026-10-04"), make("c", "Pending", "2026-10-03"),
    make("d", "Pending", "2026-10-02"), make("e", "Resolved", "2026-09-01", "2026-09-02")];
  const active = selectMaintenancePreview(many);
  assert.equal(MAINTENANCE_PREVIEW_LIMIT, 3);
  assert.deepEqual(active.visible.map(request => request.id), ["a", "b", "c"]);
  assert.equal(active.activeCount, 4, "the badge counts every active request, not just the visible ones");
  const closed = selectMaintenancePreview([make("old", "Resolved", "2026-08-01", "2026-08-02"), make("new", "Resolved", "2026-07-01", "2026-09-09"),
    make("gone", "Cancelled", "2026-10-30")]);
  assert.deepEqual(closed.visible.map(request => request.id), ["new"]);
  assert.equal(closed.activeCount, 0);
  assert.deepEqual(selectMaintenancePreview([make("gone", "Cancelled", "2026-10-30")]).visible, []);
});

test("loading states mirror the two-track rows and quick action layouts", () => {
  const skeleton = componentSource("components/MyRentalSkeleton.tsx");
  assert.ok(skeleton.includes("@container/rental"));
  for (const rule of ["@min-[56rem]/rental:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]", "grid grid-cols-5 gap-1"]) {
    assert.ok(skeleton.includes(rule), `skeleton retains ${rule}`);
  }
  assert.match(componentSource("components/DashboardCard.tsx"), /@container\/dashboard min-w-0/);
  assert.match(componentSource("components/DashboardCard.tsx"), /rounded-3xl/);
});

test("loading shows the photo beside a payment card, then the two columns with quick actions first", () => {
  const jsx = (type, props) => typeof type === "function" ? type(props) : { type, props };
  const runtime = { jsx, jsxs: jsx, Fragment: "Fragment" };
  const compiled = transpile("components/MyRentalSkeleton.tsx");
  const context = { exports: {}, require: name => {
    if (name === "@heroui/react") return { Skeleton: "Skeleton" };
    if (/^\.\/(Rent|Payment)/.test(name)) {
      const child = { exports: {}, require: dependency => dependency === "@heroui/react" ? { Skeleton: "Skeleton" } : runtime };
      vm.runInNewContext(transpile(`components/${name.slice(2)}.tsx`), child);
      return child.exports;
    }
    return runtime;
  } };
  vm.runInNewContext(compiled, context);
  const all = nodes(context.exports.default({}));
  const [top, columns] = all.find(node => node.type === "Fragment").props.children;
  const [hero, payment] = top.props.children;
  assert.match(hero.props.className, /h-60 w-full rounded-3xl/);
  assert.equal(payment.props["aria-label"], "Loading rent details");
  assert.match(payment.props.className, /h-full/);
  assert.match(columns.props.className, /@min-\[56rem\]\/rental:items-start/);
  const [main, side] = columns.props.children;
  assert.equal(nodes(main.props.children[0]).filter(node => node.type === "Skeleton" && node.props.className.includes("size-12")).length, 5, "five quick action tiles open the main column");
  assert.equal(nodes(main).filter(node => node.type === "Skeleton" && node.props.className.includes("size-10") && node.props.className.includes("rounded-full")).length, 3, "recent payment rows (receipt circle, two lines, amount and chip) close the main column");
  assert.ok(nodes(side).some(node => node.type === "Skeleton" && node.props.className.includes("size-14")), "landlord avatar");
  assert.ok(nodes(side).some(node => node.type === "Skeleton" && node.props.className.includes("h-2 w-full")), "lease progress bar");
  assert.ok(!all.some(node => node.props?.["aria-label"] === "Loading rent calendar"));
});
