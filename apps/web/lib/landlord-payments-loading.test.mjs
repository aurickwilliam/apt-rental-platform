import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Card = compound("Card", ["Header", "Content", "Footer"]);
const Select = compound("Select", ["Trigger", "Value", "Indicator", "Popover"]);
const ListBox = compound("ListBox", ["Item"]);

function load(file, options = {}) {
  const units = options.units ?? { apartments: [{ id: "unit-a", name: "Unit A" }], loading: false, error: null, refresh: () => {} };
  const payments = options.payments ?? { payments: [], loading: false, error: null, refresh: () => {} };
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const header = { default: function PaymentsHeader(props) { return load("components/PaymentsHeader.tsx", options).default(props); } };
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": {
      Suspense: "Suspense", useMemo: callback => callback(),
      useState: initial => [options.states ? options.states[stateIndex++] : initial, () => {}],
    },
    "next/navigation": { useRouter: () => ({ back: options.back ?? (() => {}) }) },
    "next/link": { default: "Link" },
    "@heroui/react": { Skeleton: "Skeleton", Card, Select, ListBox, Button: "Button", Chip: "Chip" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatPesoDisplay: value => `₱${value}` },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/app/tenant/payment/utils": {
      formatReferenceId: value => value, methodLabel: value => value,
      paymentStatusLabel: value => value === "paid" ? "Paid" : "Pending", periodMonthLabel: value => value,
    },
    "@/hooks/use-landlord-payments": { useLandlordApartments: () => units, useLandlordPayments: () => payments },
    "@/app/tenant/payment/components/PaymentHistoryFilters": { default: "PaymentHistoryFilters" },
    "./PaymentsHeader": header,
    "./components/PaymentsHeader": header,
    "./components/PaymentsSkeleton": {
      default: function PaymentsSkeleton() { return load("components/PaymentsSkeleton.tsx", options).default(); },
      PaymentCardsSkeleton: function PaymentCardsSkeleton() { return load("components/PaymentsSkeleton.tsx", options).PaymentCardsSkeleton(); },
    },
  };
  const source = readFileSync(new URL(`../app/landlord/payments/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && [
    "Sk", "PaymentsHeader", "PaymentsSkeleton", "PaymentCardsSkeleton", "PaymentsContent", "SectionHeader", "LandlordRowCard",
  ].includes(element.type.name);
  const children = expand ? element.type(element.props ?? {}) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

test("Payments route and Suspense fallbacks share a header, selector/year placeholders and three shimmer cards", () => {
  const route = nodes(load("loading.tsx").default());
  assert.ok(route.some(node => node.type === "h1" && text(node).includes("Payments")));
  assert.ok(route.some(node => node.props["aria-label"] === "Loading payments" && node.props["aria-busy"] === "true"));
  assert.equal(route.filter(node => node.type === Card).length, 3);
  const blocks = route.filter(node => node.type === "Skeleton");
  assert.ok(blocks.some(node => node.props.className.includes("h-10 w-full")));
  assert.ok(blocks.every(node => node.props.className.includes("bg-grey-300!")));
  const suspense = load("page.tsx").default();
  assert.equal(nodes(suspense.props.fallback).filter(node => node.type === Card).length, 3);
});

test("unit loading shows the full skeleton; payment loading keeps real selection/filter/back controls", () => {
  const unitsLoading = load("page.tsx", { units: { apartments: [], loading: true } }).default();
  assert.ok(nodes(unitsLoading).some(node => node.type === "Skeleton"));
  let backs = 0;
  const tree = load("page.tsx", { payments: { payments: [], loading: true }, back: () => backs++ }).default();
  const elements = nodes(tree);
  assert.ok(elements.some(node => node.type === Select && node.props.value === "unit-a"));
  assert.ok(elements.some(node => node.type === "Button" && text(node).includes("Filters")));
  assert.ok(!text(tree).includes("No payments found"));
  elements.find(node => node.type === "Button" && text(node).includes("Back")).props.onPress();
  assert.equal(backs, 1);
});

test("settled empty/no-unit/error states and Retry remain intact", () => {
  assert.ok(text(load("page.tsx").default()).includes("No payments found"));
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

test("payment filters/sorting and receipt links stay tied to the selected unit", () => {
  const records = [
    { id: "older", date: "2025-01-01", period_start: "2025-01-01", status: "paid", amount: 5000 },
    { id: "newer", date: "2026-01-01", period_start: "2026-01-01", status: "paid", amount: 6000 },
  ];
  for (const [sort, expected] of [["Newest", ["newer", "older"]], ["Oldest", ["older", "newer"]]]) {
    const tree = load("page.tsx", {
      states: [{ years: [], statuses: ["Paid"], sort }, false, "unit-b"],
      payments: { payments: records, loading: false },
    }).default();
    const elements = nodes(tree);
    const links = elements.filter(node => node.type === "Link");
    assert.deepEqual(links.map(node => node.props.href), expected.map(id => `/landlord/payments/${id}?apartmentId=unit-b`));
  }
  const filtered = load("page.tsx", {
    states: [{ years: ["2026"], statuses: ["Paid"], sort: "Newest" }, false, "unit-a"],
    payments: { payments: records, loading: false },
  }).default();
  assert.equal(nodes(filtered).filter(node => node.type === "Link").length, 1);
});
