import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Card = compound("Card", ["Header", "Content", "Footer"]);
const ComboBox = compound("ComboBox", ["InputGroup", "Trigger", "Popover"]);
const ListBox = compound("ListBox", ["Item", "ItemIndicator"]);
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const Popover = compound("Popover", ["Content", "Dialog"]);
const Tabs = compound("Tabs", ["ListContainer", "List", "Tab", "Indicator"]);

function transpile(url) {
  return ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function run(compiled, dependencies) {
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

// `states` are the page's useState values in call order: tab, year, sort, unit. The
// open receipt id (`options.selected`) is appended as a fifth. `options.setCalls` records
// every value passed to a state setter.
function load(file, options = {}) {
  const units = options.units ?? { apartments: [{ id: "unit-a", name: "Unit A" }], loading: false, error: null, refresh: () => {} };
  const payments = options.payments ?? { payments: [], loading: false, error: null, refresh: () => {} };
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  // Named wrappers so `nodes` can expand them like the real components.
  const component = (path, name) => {
    const wrapper = props => load(path, options).default(props);
    Object.defineProperty(wrapper, "name", { value: name });
    return { default: wrapper };
  };
  const header = component("components/PaymentsHeader.tsx", "PaymentsHeader");
  const skeleton = {
    default: function PaymentsSkeleton() { return load("components/PaymentsSkeleton.tsx", options).default(); },
    PaymentsBodySkeleton: function PaymentsBodySkeleton() { return load("components/PaymentsSkeleton.tsx", options).PaymentsBodySkeleton(); },
    NeedsAttentionSkeleton: function NeedsAttentionSkeleton() { return load("components/PaymentsSkeleton.tsx", options).NeedsAttentionSkeleton(); },
  };
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": {
      Suspense: "Suspense", useMemo: callback => callback(),
      // Wraps so that re-expanding the same tree (text(), hrefs()) re-reads the same four values.
      useState: initial => {
        const states = file === "page.tsx" && (options.states || options.selected) ? [...(options.states ?? ["all", "all", "newest", null]).slice(0, 4), options.selected ?? null] : null;
        return [states ? states[stateIndex++ % states.length] : initial, value => options.setCalls?.push(value)];
      },
    },
    "next/link": { default: "Link" },
    "next/navigation": { useRouter: () => ({ push: href => options.pushed?.push(href) }) },
    "@heroui/react": { Badge: "Badge", Skeleton: "Skeleton", Card, ComboBox, Input: "Input", ListBox, Popover, Table, Tabs, Button: "Button", Chip: "Chip" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatPesoDisplay: value => `₱${value}` },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/app/components/display/PaymentMethodChip": { default: "PaymentMethodChip" },
    "@/app/components/settings/SettingsSelect": { default: "SettingsSelect" },
    "@/app/landlord/dashboard/components/StatTile": { default: "StatTile" },
    "@/app/tenant/payment/utils": {
      formatDateShort: value => value, formatReferenceId: value => value, methodLabel: value => value,
      paymentStatusLabel: value => value === "paid" ? "Paid" : "Pending", statusVariant: () => "neutral",
    },
    "@/hooks/use-landlord-payments": { useLandlordApartments: () => units, useLandlordPayments: () => payments },
    "@/lib/landlord-payments-view": run(transpile(new URL("./landlord-payments-view.ts", import.meta.url)), {}),
    "./PaymentsHeader": header,
    "./components/PaymentsHeader": header,
    "./components/PaymentsSkeleton": skeleton,
    "./components/PaymentsSummary": component("components/PaymentsSummary.tsx", "PaymentsSummary"),
    "./components/NeedsAttentionCard": component("components/NeedsAttentionCard.tsx", "NeedsAttentionCard"),
    "./components/PaymentsTable": component("components/PaymentsTable.tsx", "PaymentsTable"),
    "./components/PaymentReceiptModal": { default: "PaymentReceiptModal" },
  };
  return run(transpile(new URL(`../app/landlord/payments/${file}`, import.meta.url)), dependencies);
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && [
    "Sk", "PaymentsHeader", "PaymentsSkeleton", "PaymentsBodySkeleton", "NeedsAttentionSkeleton", "PaymentsContent",
    "PaymentsSummary", "NeedsAttentionCard", "PaymentsTable", "PaymentStatusChip",
  ].includes(element.type.name);
  const children = expand ? element.type(element.props ?? {}) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

const older = { apartment_id: "unit-a", apartment_name: "Unit A", id: "older", date: "2025-01-01", period_start: "2025-01-01", status: "paid", method: "gcash", amount: 5000 };
const newer = { apartment_id: "unit-a", apartment_name: "Unit A", id: "newer", date: "2026-01-01", period_start: "2026-01-01", status: "paid", method: "gcash", amount: 6000 };
const cash = { apartment_id: "unit-a", apartment_name: "Unit A", id: "cash", date: "2026-02-01", period_start: "2026-02-01", status: "pending", method: "cash", amount: 7000, tenant_name: "Ryan" };
// The payments the table is given, in the order it shows them.
const listed = tree => [...nodes(tree).find(node => node.type.name === "PaymentsTable").props.payments.map(payment => payment.id)];

test("Payments route and Suspense fallbacks share a header, unit placeholder, four tiles and the table shell", () => {
  const route = nodes(load("loading.tsx").default());
  assert.ok(route.some(node => node.type === "h1" && text(node).includes("Payments")));
  assert.ok(route.some(node => node.props["aria-label"] === "Loading payments" && node.props["aria-busy"] === "true"));
  const blocks = route.filter(node => node.type === "Skeleton");
  assert.ok(blocks.some(node => node.props.className.includes("h-10 w-full")));
  assert.ok(blocks.every(node => node.props.className.includes("bg-skeleton!")));
  assert.equal(blocks.filter(node => node.props.className.includes("h-9 w-32 rounded-lg")).length, 4);
  assert.ok(!route.some(node => node.type === "IconArrowLeft"));
  const suspense = nodes(load("page.tsx").default().props.fallback);
  assert.equal(suspense.filter(node => node.type === "Skeleton").length, blocks.length);
});

test("unit loading keeps the real heading and a disabled selector; payment loading keeps the selection (All apartments by default) and no figures", () => {
  const unitsLoading = nodes(load("page.tsx", { units: { apartments: [], loading: true } }).default());
  assert.ok(unitsLoading.some(node => node.type === "Skeleton"));
  assert.ok(unitsLoading.some(node => node.type === ComboBox && node.props.isDisabled));
  const tree = load("page.tsx", { payments: { payments: [newer], loading: true } }).default();
  const elements = nodes(tree);
  assert.ok(elements.some(node => node.type === ComboBox && node.props.selectedKey === "all"));
  assert.ok(elements.some(node => node.props["aria-label"] === "Loading payments"));
  assert.ok(!elements.some(node => node.type === "StatTile"));
  assert.ok(!text(tree).includes("No payments"));
  assert.ok(!elements.some(node => node.type === "Button" && text(node).includes("Back")));
});

test("the unit selector and Refresh sit in a controls row above the tiles; the old Filters modal is gone", () => {
  const refreshed = [];
  const elements = nodes(load("page.tsx", {
    payments: { payments: [newer], loading: false, refresh: () => refreshed.push("quiet"), reload: () => refreshed.push("payments") },
    units: { apartments: [{ id: "unit-a", name: "Unit A" }], loading: false, error: null, refresh: () => refreshed.push("units") },
  }).default());
  const heading = elements.find(node => node.type.name === "PaymentsHeader");
  assert.ok(!nodes(heading).some(node => node.type === ComboBox));
  assert.ok(elements.indexOf(elements.find(node => node.type === ComboBox)) < elements.indexOf(elements.find(node => node.type.name === "PaymentsSummary")));
  const refresh = elements.find(node => node.type === "Button" && node.props["aria-label"] === "Refresh payments");
  refresh.props.onPress();
  // The payments reload shows the skeleton; the unit list refreshes quietly.
  assert.deepEqual([...refreshed].sort(), ["payments", "units"]);
  assert.ok(!elements.some(node => node.type === "PaymentHistoryFilters"));
  assert.ok(elements.some(node => node.type === Tabs && node.props.className.includes("apt-status-tabs")));
});

test("the picker lists All apartments first, is searchable, and defaults to every unit", () => {
  const units = { apartments: [{ id: "unit-a", name: "Unit A" }, { id: "unit-b", name: "Unit B" }], loading: false };
  const elements = nodes(load("page.tsx", { units, payments: { payments: [newer], loading: false } }).default());
  const combo = elements.find(node => node.type === ComboBox);
  assert.equal(combo.props.selectedKey, "all");
  assert.ok(elements.some(node => node.type === "Input" && node.props.placeholder === "Search apartments"));
  const items = elements.filter(node => node.type === ListBox.Item).map(node => [node.props.id, node.props.textValue]);
  assert.deepEqual([...items.map(([id]) => id)], ["all", "unit-a", "unit-b"]);
  assert.equal(items[0][1], "All apartments");
  // A selection that is not in the unit list falls back to every unit.
  const stale = nodes(load("page.tsx", { states: ["all", "all", "newest", "gone"], units, payments: { payments: [newer], loading: false } }).default());
  assert.equal(stale.find(node => node.type === ComboBox).props.selectedKey, "all");
  // Clearing the input reports no key; that must not throw or unselect.
  combo.props.onSelectionChange(null);
});

test("All apartments adds the unit to rows and Needs attention; one unit does not", () => {
  const other = { ...cash, id: "cash-b", apartment_id: "unit-b", apartment_name: "Unit B" };
  const units = { apartments: [{ id: "unit-a", name: "Unit A" }, { id: "unit-b", name: "Unit B" }], loading: false };
  const all = nodes(load("page.tsx", { units, payments: { payments: [newer, other], loading: false } }).default());
  assert.equal(all.find(node => node.type.name === "PaymentsTable").props.showUnit, true);
  assert.equal(all.find(node => node.type.name === "NeedsAttentionCard").props.showUnit, true);
  assert.ok(all.some(node => node.type === "Table.Column" && node.props.children === "Unit"));
  // Each waiting payment opens its own receipt, naming its unit when several are listed.
  const opened = [];
  const card = all.find(node => node.type.name === "NeedsAttentionCard").type({ payments: [other], showUnit: true, onOpen: (payment) => opened.push(payment.id) });
  assert.ok(text(card).includes("Unit B"));
  nodes(card).find(node => node.type === "button").props.onClick();
  assert.deepEqual(opened, ["cash-b"]);
  const single = nodes(load("page.tsx", { states: ["all", "all", "newest", "unit-a"], units, payments: { payments: [newer], loading: false } }).default());
  assert.equal(single.find(node => node.type.name === "PaymentsTable").props.showUnit, false);
  assert.ok(!single.some(node => node.type === "Table.Column" && node.props.children === "Unit"));
});

test("settled empty, no-unit and error states and Retry remain intact", () => {
  assert.ok(text(load("page.tsx").default()).includes("No payments yet"));
  assert.ok(text(load("page.tsx", { units: { apartments: [], loading: false } }).default()).includes("No units found"));
  let refreshes = 0;
  const tree = load("page.tsx", {
    units: { apartments: [], loading: false, error: "Unable to load units", refresh: () => refreshes++ },
    payments: { payments: [], loading: false, reload: () => refreshes++ },
  }).default();
  assert.ok(text(tree).includes("Unable to load units"));
  nodes(tree).find(node => node.type === "Button" && node.props.children === "Try Again").props.onPress();
  assert.equal(refreshes, 2);
});

test("sorting, year and status filters decide which payments the table lists", () => {
  const units = { apartments: [{ id: "unit-a", name: "Unit A" }, { id: "unit-b", name: "Unit B" }], loading: false };
  const inUnitB = [older, newer].map(row => ({ ...row, apartment_id: "unit-b", apartment_name: "Unit B" }));
  for (const [sort, expected] of [["newest", ["newer", "older"]], ["oldest", ["older", "newer"]]]) {
    const tree = load("page.tsx", { states: ["all", "all", sort, "unit-b"], units, payments: { payments: inUnitB, loading: false } }).default();
    assert.deepEqual(listed(tree), expected);
  }
  const byYear = load("page.tsx", { states: ["all", "2026", "newest", "unit-a"], payments: { payments: [older, newer], loading: false } }).default();
  assert.deepEqual(listed(byYear), ["newer"]);
  // A remembered year the unit no longer has falls back to every year.
  const staleYear = load("page.tsx", { states: ["all", "1999", "newest", "unit-a"], payments: { payments: [older, newer], loading: false } }).default();
  assert.equal(listed(staleYear).length, 2);
  const noPending = load("page.tsx", { states: ["pending", "all", "newest", "unit-a"], payments: { payments: [older, newer], loading: false } }).default();
  assert.ok(text(noPending).includes("No payments found"));
  assert.ok(!nodes(noPending).some(node => node.type.name === "PaymentsTable"));
});

test("a table row opens that payment's receipt over the list instead of navigating", () => {
  const setCalls = [];
  const tree = load("page.tsx", { setCalls, payments: { payments: [older, newer], loading: false } }).default();
  nodes(tree).find(node => node.type === "Table.Content").props.onRowAction("older");
  assert.deepEqual(setCalls, ["older"]);
  // No link or route change is involved.
  assert.ok(!nodes(tree).some(node => node.type === "Link"));
});

test("the receipt modal shows the selected payment from the list, reloads it on change and closes with its row", () => {
  const refresh = () => {};
  const setCalls = [];
  const open = nodes(load("page.tsx", { selected: "older", setCalls, payments: { payments: [older, newer], loading: false, refresh } }).default());
  const modal = open.find(node => node.type === "PaymentReceiptModal");
  assert.equal(modal.props.payment.id, "older");
  assert.equal(modal.props.onChanged, refresh);
  modal.props.onClose();
  assert.deepEqual(setCalls, [null]);
  const none = nodes(load("page.tsx", { payments: { payments: [older, newer], loading: false } }).default());
  assert.ok(!none.some(node => node.type === "PaymentReceiptModal"));
  const gone = nodes(load("page.tsx", { selected: "removed", payments: { payments: [older], loading: false } }).default());
  assert.ok(!gone.some(node => node.type === "PaymentReceiptModal"));
});

test("summary figures follow the selected year and Needs attention ignores every filter", () => {
  const records = [older, newer, cash];
  const all = nodes(load("page.tsx", { payments: { payments: records, loading: false } }).default());
  assert.equal(all.find(node => node.type.name === "PaymentsSummary").props.summary.collected, 11000);
  const filtered = nodes(load("page.tsx", {
    states: ["paid", "2025", "newest", "unit-a"],
    payments: { payments: records, loading: false },
  }).default());
  assert.equal(filtered.find(node => node.type.name === "PaymentsSummary").props.summary.collected, 5000);
  const attention = filtered.find(node => node.type.name === "NeedsAttentionCard");
  assert.deepEqual([...attention.props.payments.map(payment => payment.id)], ["cash"]);
  const opened = [];
  const rows = nodes(attention.type({ ...attention.props, onOpen: (payment) => opened.push(payment.id) })).filter(node => node.type === "button");
  rows.forEach(row => row.props.onClick());
  assert.deepEqual(opened, ["cash"]);
});

test("tab labels carry no counts; only Pending shows a badge, and only when something is pending", () => {
  const withPending = nodes(load("page.tsx", { payments: { payments: [older, cash], loading: false } }).default());
  const badges = withPending.filter(node => node.type === "Badge");
  assert.equal(badges.length, 1);
  assert.equal(badges[0].props.children, 1);
  const labels = withPending.filter(node => node.props?.className === "apt-tab-label").map(node => node.props.children);
  assert.deepEqual([...labels], ["All", "Paid", "Pending", "Declined"]);
  const none = nodes(load("page.tsx", { payments: { payments: [older], loading: false } }).default());
  assert.equal(none.filter(node => node.type === "Badge").length, 0);
});

test("Needs attention sits in the title row beside the heading, lists its rows in a popover, and is absent while loading", () => {
  const settled = nodes(load("page.tsx", { payments: { payments: [older, cash], loading: false } }).default());
  const row = settled.find(node => node.type === "div" && node.props.className?.includes("justify-between") && nodes(node).some(n => n.type.name === "PaymentsHeader"));
  assert.ok(nodes(row).some(node => node.type.name === "NeedsAttentionCard"));
  // The table owns the full width: no side column or two-column grid remains.
  assert.ok(!settled.some(node => typeof node.props?.className === "string" && node.props.className.includes("lg:grid-cols-[1.9fr_1fr]")));
  const card = nodes(settled.find(node => node.type.name === "NeedsAttentionCard"));
  assert.ok(card.some(node => node.type === Popover));
  assert.ok(card.some(node => node.type === "Popover.Content"));
  const loading = nodes(load("page.tsx", { payments: { payments: [cash], loading: true } }).default());
  assert.ok(!loading.some(node => node.type.name === "NeedsAttentionCard"));
  // A HeroUI Skeleton holds its place meanwhile, in the same row as the heading.
  const placeholder = loading.find(node => node.type.name === "NeedsAttentionSkeleton");
  assert.ok(placeholder);
  assert.ok(nodes(placeholder).some(node => node.type === "Skeleton" && node.props.className.includes("h-[3.75rem]")));
  const route = nodes(load("loading.tsx").default());
  assert.ok(route.some(node => node.type.name === "NeedsAttentionSkeleton"));
});

test("Needs attention is a quiet all-caught-up card when no cash is waiting", () => {
  const tree = load("page.tsx", { payments: { payments: [older, newer], loading: false } }).default();
  assert.ok(text(tree).includes("all caught up"));
});

test("status chips carry an icon matching their status", () => {
  const tree = nodes(load("page.tsx", { payments: { payments: [older, cash], loading: false } }).default());
  const chips = tree.filter(node => node.type === "StatusChip");
  assert.ok(chips.length >= 2);
  for (const chip of chips) {
    const [icon, label] = [chip.props.children].flat();
    assert.ok(typeof icon.type === "string" && icon.type.startsWith("Icon"), "icon before the label");
    assert.equal(typeof label, "string");
  }
  assert.ok(chips.some(chip => chip.props.children[0].type === "IconCircleCheck" && chip.props.children[1] === "Paid"));
  assert.ok(chips.some(chip => chip.props.children[0].type === "IconClockHour4" && chip.props.children[1] === "Pending"));
});

test("each payment method has its own chip color and icon; unknown methods stay plain", () => {
  const jsx = (type, props) => ({ type, props });
  const exports = run(
    transpile(new URL("../app/components/display/PaymentMethodChip.tsx", import.meta.url)),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
      "@heroui/react": { Chip: "Chip" },
      "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
      "@/app/tenant/payment/utils": { methodLabel: value => value ?? "—" },
    },
  );
  const chip = method => exports.default({ method });
  const methods = ["gcash", "maya", "qrph", "Debit/Credit-Card", "card", "cash", "GCash"];
  const backgrounds = new Map(methods.map(method => [method, chip(method).props.style["--method-bg"]]));
  assert.equal(new Set(["gcash", "maya", "qrph", "card", "cash"].map(method => backgrounds.get(method))).size, 5);
  assert.equal(backgrounds.get("Debit/Credit-Card"), backgrounds.get("card"));
  assert.equal(backgrounds.get("GCash"), backgrounds.get("gcash"));
  for (const method of methods) {
    assert.ok(chip(method).props.className.includes("method-chip"));
    assert.ok(chip(method).props.children[0], `${method} has an icon`);
  }
  const unknown = chip("bank-transfer");
  assert.equal(unknown.props.style, undefined);
  assert.ok(!unknown.props.className.includes("method-chip"));
  assert.equal(unknown.props.children[0], null);
});
