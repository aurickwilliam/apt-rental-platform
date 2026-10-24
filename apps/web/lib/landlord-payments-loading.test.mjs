import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Card = compound("Card", ["Header", "Content", "Footer"]);
const Select = compound("Select", ["Trigger", "Value", "Indicator", "Popover"]);
const ListBox = compound("ListBox", ["Item"]);
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
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

// `states` are the page's useState values in call order: tab, year, sort, unit.
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
  };
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": {
      Suspense: "Suspense", useMemo: callback => callback(),
      // Wraps so that re-expanding the same tree (text(), hrefs()) re-reads the same four values.
      useState: initial => [options.states ? options.states[stateIndex++ % options.states.length] : initial, () => {}],
    },
    "next/link": { default: "Link" },
    "next/navigation": { useRouter: () => ({ push: href => options.pushed?.push(href) }) },
    "@heroui/react": { Skeleton: "Skeleton", Card, Select, ListBox, Table, Tabs, Button: "Button", Chip: "Chip" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatPesoDisplay: value => `₱${value}` },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
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
  };
  return run(transpile(new URL(`../app/landlord/payments/${file}`, import.meta.url)), dependencies);
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && [
    "Sk", "PaymentsHeader", "PaymentsSkeleton", "PaymentsBodySkeleton", "PaymentsContent",
    "PaymentsSummary", "NeedsAttentionCard", "PaymentsTable",
  ].includes(element.type.name);
  const children = expand ? element.type(element.props ?? {}) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

const older = { id: "older", date: "2025-01-01", period_start: "2025-01-01", status: "paid", method: "gcash", amount: 5000 };
const newer = { id: "newer", date: "2026-01-01", period_start: "2026-01-01", status: "paid", method: "gcash", amount: 6000 };
const cash = { id: "cash", date: "2026-02-01", period_start: "2026-02-01", status: "pending", method: "cash", amount: 7000, tenant_name: "Ryan" };
const hrefs = tree => nodes(tree).filter(node => node.type === "Link").map(node => node.props.href);

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

test("unit loading keeps the real heading and a disabled selector; payment loading keeps the selection and no figures", () => {
  const unitsLoading = nodes(load("page.tsx", { units: { apartments: [], loading: true } }).default());
  assert.ok(unitsLoading.some(node => node.type === "Skeleton"));
  assert.ok(unitsLoading.some(node => node.type === Select && node.props.isDisabled));
  const tree = load("page.tsx", { payments: { payments: [newer], loading: true } }).default();
  const elements = nodes(tree);
  assert.ok(elements.some(node => node.type === Select && node.props.value === "unit-a"));
  assert.ok(elements.some(node => node.props["aria-label"] === "Loading payments"));
  assert.ok(!elements.some(node => node.type === "StatTile"));
  assert.ok(!text(tree).includes("No payments"));
  assert.ok(!elements.some(node => node.type === "Button" && text(node).includes("Back")));
});

test("the unit selector sits in the heading row and the old Filters modal is gone", () => {
  const elements = nodes(load("page.tsx", { payments: { payments: [newer], loading: false } }).default());
  const heading = elements.find(node => node.type.name === "PaymentsHeader");
  assert.ok(nodes(heading).some(node => node.type === Select));
  assert.ok(!elements.some(node => node.type === "PaymentHistoryFilters"));
  assert.ok(elements.some(node => node.type === Tabs));
});

test("settled empty, no-unit and error states and Retry remain intact", () => {
  assert.ok(text(load("page.tsx").default()).includes("No payments yet"));
  assert.ok(text(load("page.tsx", { units: { apartments: [], loading: false } }).default()).includes("No units found"));
  let refreshes = 0;
  const tree = load("page.tsx", {
    units: { apartments: [], loading: false, error: "Unable to load units", refresh: () => refreshes++ },
    payments: { payments: [], loading: false, refresh: () => refreshes++ },
  }).default();
  assert.ok(text(tree).includes("Unable to load units"));
  nodes(tree).find(node => node.type === "Button" && node.props.children === "Try Again").props.onPress();
  assert.equal(refreshes, 2);
});

test("sorting, year and status filters and receipt links stay tied to the selected unit", () => {
  const units = { apartments: [{ id: "unit-a", name: "Unit A" }, { id: "unit-b", name: "Unit B" }], loading: false };
  for (const [sort, expected] of [["newest", ["newer", "older"]], ["oldest", ["older", "newer"]]]) {
    const tree = load("page.tsx", { states: ["all", "all", sort, "unit-b"], units, payments: { payments: [older, newer], loading: false } }).default();
    assert.deepEqual(hrefs(tree), expected.map(id => `/landlord/payments/${id}?apartmentId=unit-b`));
  }
  const byYear = load("page.tsx", { states: ["all", "2026", "newest", "unit-a"], payments: { payments: [older, newer], loading: false } }).default();
  assert.deepEqual(hrefs(byYear), ["/landlord/payments/newer?apartmentId=unit-a"]);
  // A remembered year the unit no longer has falls back to every year.
  const staleYear = load("page.tsx", { states: ["all", "1999", "newest", "unit-a"], payments: { payments: [older, newer], loading: false } }).default();
  assert.equal(hrefs(staleYear).length, 2);
  const noPending = load("page.tsx", { states: ["pending", "all", "newest", "unit-a"], payments: { payments: [older, newer], loading: false } }).default();
  assert.ok(text(noPending).includes("No payments found"));
  assert.equal(hrefs(noPending).length, 0);
});

test("a table row opens that payment's receipt for the selected unit", () => {
  const pushed = [];
  const tree = load("page.tsx", { pushed, payments: { payments: [older, newer], loading: false } }).default();
  const content = nodes(tree).find(node => node.type === "Table.Content");
  content.props.onRowAction("older");
  assert.deepEqual(pushed, ["/landlord/payments/older?apartmentId=unit-a"]);
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
  assert.ok(hrefs(attention.type(attention.props)).includes("/landlord/payments/cash?apartmentId=unit-a"));
});

test("Needs attention is a quiet all-caught-up card when no cash is waiting", () => {
  const tree = load("page.tsx", { payments: { payments: [older, newer], loading: false } }).default();
  assert.ok(text(tree).includes("all caught up"));
});
