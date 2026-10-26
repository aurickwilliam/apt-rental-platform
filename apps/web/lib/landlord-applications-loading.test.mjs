import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as applicationList from "../app/landlord/applications/lib/application-list.ts";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const InputGroup = compound("InputGroup", ["Prefix", "Input"]);
const Dropdown = compound("Dropdown", ["Popover", "Menu", "Item"]);

function load(file, options = {}) {
  const { applications = [], loading = false, error = null, filters, push = () => {}, prefetch = () => {}, history = [], refresh = () => {} } = options;
  let stateIndex = 0;
  const params = options.params ?? new URLSearchParams();
  if (filters) {
    ["q", "status", "city", "property", "days"].forEach((key, index) => { if (filters[index] !== undefined) params.set(key, filters[index]); });
    if (filters[5]) params.set("sort", filters[5]);
  }
  let href = `https://apt.example/landlord/applications?${params}`;
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "@/app/components/display/PresentationBoundary": { default: function PresentationBoundary({ children }) { return children(undefined); } },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": { Suspense: "Suspense", useMemo: callback => callback(), useState: initial => [filters ? filters[stateIndex++] : initial, () => {}] },
    "next/navigation": { useRouter: () => ({ push, prefetch }), useSearchParams: () => new URL(href).searchParams },
    "next/image": { default: "Image" },
    "@heroui/react": { Skeleton: "Skeleton", Table, InputGroup, Dropdown, Button: "Button", Label: "Label", Chip: "Chip", Separator: "Separator" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatDate: value => value, formatPesoDisplay: value => `₱${value}`, getInitials: () => "T" },
    "@/hooks/use-landlord-applications": { useLandlordApplications: () => ({ applications, loading, error, refresh }) },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/app/components/settings/SettingsSelect": { default: "SettingsSelect" },
    "./lib/application-status": { statusChipColor: () => "neutral" },
    "./lib/application-list": applicationList,
    "./application-list": applicationList,
    "./lib/use-application-list-filters": { default: () => load("lib/use-application-list-filters.ts", options).default() },
    "./components/ApplicationsSummary": { default: function ApplicationsSummary(props) { return load("components/ApplicationsSummary.tsx").default(props); } },
    "./ApplicationsHeader": { default: function ApplicationsHeader() { return load("components/ApplicationsHeader.tsx").default(); } },
    "./components/ApplicationsHeader": { default: function ApplicationsHeader() { return load("components/ApplicationsHeader.tsx").default(); } },
    "./components/ApplicationsSkeleton": {
      default: function ApplicationsSkeleton() { return load("components/ApplicationsSkeleton.tsx").default(); },
      ApplicationsCountSkeleton: function ApplicationsCountSkeleton() { return load("components/ApplicationsSkeleton.tsx").ApplicationsCountSkeleton(); },
      ApplicationsResultsSkeleton: function ApplicationsResultsSkeleton() { return load("components/ApplicationsSkeleton.tsx").ApplicationsResultsSkeleton(); },
      ApplicationsSummarySkeleton: function ApplicationsSummarySkeleton() { return load("components/ApplicationsSkeleton.tsx").ApplicationsSummarySkeleton(); },
    },
  };
  const source = readFileSync(new URL(`../app/landlord/applications/${file === "page.tsx" ? "ApplicationsClient.tsx" : file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, URL, window: {
    location: { get href() { return href; } },
    history: { replaceState: (_state, _title, value) => { href = new URL(value, href).href; history.push(value); } },
  }, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  if (file === "page.tsx") {
    const Component = context.exports.default;
    context.exports.default = () => Component({ initial: undefined });
  }
  return context.exports;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && [
    "Sk", "PresentationBoundary", "ApplicationsHeader", "ApplicationsContent", "ApplicationsSummary", "ApplicationsSummarySkeleton", "ApplicationsSkeleton", "ApplicationsCountSkeleton", "ApplicationsResultsSkeleton",
  ].includes(element.type.name);
  const children = expand ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

test("Applications search scopes readable placeholder and entered-text colors to its own field", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.landlord-applications-page \.application-search\s*\{[^}]*--field-placeholder:\s*var\(--muted-foreground\);[^}]*--field-foreground:\s*var\(--foreground\)/);
  assert.match(styles, /\.application-search \.input-group__input::placeholder\s*\{[^}]*color:\s*var\(--muted-foreground\);[^}]*opacity:\s*1/);
  const elements = nodes(load("page.tsx").default());
  assert.ok(elements.some(node => node.type === InputGroup && node.props.className.includes("application-search")));
});

test("Applications headers have readable text without hover in loaded and skeleton tables", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.application-list-table \.table__column\s*\{[^}]*color:\s*var\(--foreground\)/);
  for (const [file, options] of [
    ["loading.tsx", {}],
    ["page.tsx", { applications: [{ id: "one", apartment_id: "unit-one", tenant_name: "Tenant", apartment_name: "Property", apartment_city: "Caloocan", apartment_address: "Test St", created_at: "2026-10-01", move_in_date: "2026-11-01", status: "Applied", monthly_rent: 5000 }] }],
  ]) {
    const elements = nodes(load(file, options).default());
    assert.ok(elements.some(node => node.type === Table && node.props.className === "application-list-table"));
  }
});

test("Applications route skeleton keeps its header and mirrors desktop rows and mobile cards", () => {
  const elements = nodes(load("loading.tsx").default());
  assert.ok(text(elements.find(node => node.type === "h1")).includes("Applications"));
  assert.ok(elements.some(node => node.props["aria-busy"] === "true" && node.props["aria-label"] === "Loading applications"));
  assert.deepEqual(elements.filter(node => node.type === "Table.Column").map(node => node.props.children), [
    "Tenant", "Property", "Location", "Date", "Status", "Actions",
  ]);
  assert.equal(elements.filter(node => node.type === "Table.Row").length, 5);
  const cards = elements.find(node => node.props.className === "grid gap-3 md:hidden");
  assert.equal(cards.props.children.length, 3);
  assert.ok(elements.some(node => node.props.className === "hidden md:block"));
  const blocks = elements.filter(node => node.type === "Skeleton");
  assert.ok(blocks.length > 0);
  assert.ok(blocks.every(node => node.props.className.includes("bg-skeleton!")));
  assert.ok(elements.some(node => node.type === "Table.ScrollContainer" && node.props.className.includes("overflow-x-auto")));
});

test("client loading reuses results skeleton, keeps controls, and never flashes a zero total or empty state", () => {
  const tree = load("page.tsx", { loading: true }).default();
  const elements = nodes(tree);
  assert.ok(elements.some(node => node.props["aria-busy"] === true));
  assert.ok(elements.some(node => node.type === "Table.Row"));
  assert.ok(elements.some(node => node.type === "InputGroup.Input"));
  assert.ok(elements.some(node => node.type === "Button" && text(node).includes("Filters")));
  assert.ok(!text(tree).includes("Total:"));
  assert.ok(!text(tree).includes("No applications found"));
});

test("settled empty and error states remain distinct from loading", () => {
  const empty = load("page.tsx").default();
  assert.ok(nodes(empty).some(node => node.props["aria-busy"] === false));
  assert.ok(text(empty).includes("Total"));
  assert.ok(text(empty).includes("No applications found"));
  assert.ok(!nodes(empty).some(node => node.type === "Skeleton"));
  const failed = load("page.tsx", { error: "Unable to load applications" }).default();
  assert.ok(text(failed).includes("Unable to load applications"));
  assert.ok(!text(failed).includes("No applications found"));
});

test("loaded records still respect search, status and city filters and open the application", () => {
  const record = {
    id: "application-one", tenant_name: "Sample Tenant", tenant_email: null, tenant_avatar_url: null,
    apartment_name: "Sample Property", apartment_city: "Caloocan", apartment_address: "Sample Address",
    apartment_id: "property-one", monthly_rent: 5000, created_at: "2026-10-18", move_in_date: "2026-11-01", status: "Applied",
  };
  const pushes = [];
  const tree = load("page.tsx", {
    applications: [record], filters: [" sample ", "Applied", "Caloocan"], push: href => pushes.push(href),
  }).default();
  const elements = nodes(tree);
  elements.find(node => node.type === "Table.Content").props.onRowAction(record.id);
  elements.find(node => node.type === "Button" && node.props.className?.includes("button--bare")).props.onClick();
  assert.deepEqual(pushes, ["/landlord/applications/application-one", "/landlord/applications/application-one"]);
  for (const filters of [["other", "All", "All"], ["", "Approved", "All"], ["", "All", "Malabon"]]) {
    assert.ok(text(load("page.tsx", { applications: [record], filters }).default()).includes("No applications found"));
  }
});

test("Summary and controls match the reference while the existing heading is retained", () => {
  const source = readFileSync(new URL("../app/landlord/applications/components/ApplicationsHeader.tsx", import.meta.url), "utf8");
  assert.ok(source.includes("Applications"));
  const tree = load("page.tsx", { applications: [{
    id: "one", apartment_id: "unit-one", apartment_name: "Sample Property", apartment_city: "Caloocan", apartment_address: "Test St",
    tenant_name: "Sample Tenant", tenant_email: "test@example.test", status: "Approved", created_at: "2026-10-18", move_in_date: "2026-11-01", monthly_rent: 5000,
    apartment_thumbnail_url: "/thumbnail.jpg",
  }] }).default();
  const elements = nodes(tree);
  const summary = elements.find(node => node.type.name === "ApplicationsSummary");
  assert.deepEqual(summary.props.summary, { total: 1, approved: 1, rejected: 0, pending: 0 });
  assert.equal(elements.filter(node => node.type === "SettingsSelect").length, 5);
  assert.ok(elements.some(node => node.type === "Image" && node.props.src === "/thumbnail.jpg"));
  const columns = elements.filter(node => node.type === "Table.Column");
  assert.equal(columns.length, 6);
  assert.ok(columns.slice(0, 5).every(column => column.props.allowsSorting));
  assert.ok(text(tree).includes("Submitted:"));
  assert.ok(elements.some(node => node.type === "Dropdown.Item" && node.props.id === "view"));
});

test("URL-backed application filters preserve unrelated query state, clear defaults and validate values", () => {
  const history = [];
  const params = new URLSearchParams("notifications=open&status=invalid&days=invalid&sort=invalid");
  const filter = load("lib/use-application-list-filters.ts", { params, history }).default();
  assert.equal(filter.statusFilter, "All");
  assert.equal(filter.dateFilter, "All");
  assert.equal(filter.sort.column, "created_at");
  filter.setPropertyFilter("unit-one");
  filter.setStatusFilter("Applied");
  filter.setDateFilter("30");
  let url = new URL(history.at(-1), "https://apt.example");
  assert.equal(url.searchParams.get("notifications"), "open");
  assert.equal(url.searchParams.get("property"), "unit-one");
  assert.equal(url.searchParams.get("status"), "Applied");
  assert.equal(url.searchParams.get("days"), "30");
  filter.setSort({ column: "tenant_name", direction: "ascending" });
  assert.ok(history.at(-1).includes("tenant_name"));
  filter.clearFilters();
  url = new URL(history.at(-1), "https://apt.example");
  assert.equal(url.searchParams.has("status"), false);
  assert.equal(url.searchParams.has("property"), false);
  assert.equal(url.searchParams.has("days"), false);
  assert.equal(url.searchParams.get("notifications"), "open");
});

test("Error summaries are unknown rather than zero and Retry preserves the existing fetch path", () => {
  let retries = 0;
  const tree = load("page.tsx", { error: "Unable to load applications", refresh: () => { retries += 1; } }).default();
  const elements = nodes(tree);
  assert.equal(elements.find(node => node.type.name === "ApplicationsSummary").props.summary, null);
  assert.ok(!text(tree).includes("Total 0"));
  elements.find(node => node.type === "Button" && text(node).includes("Try Again")).props.onPress();
  assert.equal(retries, 1);
});

test("Application detail routes warm on table hover/focus and responsive card hover/focus", () => {
  const warmed = [];
  const record = { id: "application-one", apartment_id: "unit-one", tenant_name: "Tenant", apartment_name: "Property", apartment_city: "Caloocan", apartment_address: "Test St", created_at: "2026-10-01", move_in_date: "2026-11-01", status: "Applied", monthly_rent: 5000 };
  const elements = nodes(load("page.tsx", { applications: [record], prefetch: href => warmed.push(href) }).default());
  elements.find(element => element.type === "Table.Row").props.onMouseEnter();
  elements.find(element => element.type === "section").props.onFocusCapture({ target: { closest: () => ({ dataset: { applicationId: record.id } }) } });
  const card = elements.find(element => element.type === "Button" && element.props.className?.includes("button--bare"));
  card.props.onMouseEnter();
  card.props.onFocus();
  assert.deepEqual(warmed, Array(4).fill("/landlord/applications/application-one"));
});
