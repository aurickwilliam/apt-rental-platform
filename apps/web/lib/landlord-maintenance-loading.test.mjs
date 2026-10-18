import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const InputGroup = compound("InputGroup", ["Prefix", "Input"]);
const Dropdown = compound("Dropdown", ["Popover"]);

function load(file, { requests = [], loading = false, error = null, filters, push = () => {}, refresh = () => {}, markViewed = () => {} } = {}) {
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const skeletons = {
    default: function MaintenanceSkeleton() { return load("components/MaintenanceSkeletons.tsx").default(); },
    MaintenanceCountSkeleton: function MaintenanceCountSkeleton() { return load("components/MaintenanceSkeletons.tsx").MaintenanceCountSkeleton(); },
    MaintenanceResultsSkeleton: function MaintenanceResultsSkeleton() { return load("components/MaintenanceSkeletons.tsx").MaintenanceResultsSkeleton(); },
  };
  const header = { default: function MaintenanceHeader() { return load("components/MaintenanceHeader.tsx").default(); } };
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": {
      useMemo: callback => callback(), useEffect: callback => callback(),
      useState: initial => [filters ? filters[stateIndex++] : initial, () => {}],
    },
    "next/navigation": { useRouter: () => ({ push }) },
    "@heroui/react": { Skeleton: "Skeleton", Table, InputGroup, Dropdown, Button: "Button", Chip: "Chip", Separator: "Separator" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatDate: value => value, getInitials: () => "T" },
    "@/hooks/use-landlord-maintenance-requests": { useLandlordMaintenanceRequests: () => ({ requests, loading, error, refresh }) },
    "@/hooks/use-landlord-action-badges": { useLandlordActionBadges: () => ({ markViewed }) },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "./lib/maintenance-status": {
      maintenanceStatusChipColor: () => "warning",
      MAINTENANCE_URGENCY_STYLE: { high: { tone: "danger", label: "High" } },
    },
    "./components/MaintenanceEmptyState": { default: function MaintenanceEmptyState() { return load("components/MaintenanceEmptyState.tsx").default(); } },
    "./MaintenanceHeader": header,
    "./components/MaintenanceHeader": header,
    "./components/MaintenanceSkeletons": skeletons,
  };
  const source = readFileSync(new URL(`../app/landlord/maintenance-requests/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
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
    "Sk", "MaintenanceHeader", "MaintenanceSkeleton", "MaintenanceCountSkeleton", "MaintenanceResultsSkeleton",
    "MaintenanceTableSkeleton", "MaintenanceCardSkeleton", "MaintenanceEmptyState",
  ].includes(element.type.name);
  const children = expand ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

test("Maintenance route skeleton keeps its header and mirrors desktop columns and mobile cards", () => {
  const elements = nodes(load("loading.tsx").default());
  assert.ok(text(elements.find(node => node.type === "h1")).includes("Maintenance Requests"));
  assert.ok(elements.some(node => node.props["aria-busy"] === "true" && node.props["aria-label"] === "Loading maintenance requests"));
  assert.deepEqual(elements.filter(node => node.type === "Table.Column").map(node => node.props.children), [
    "Issue", "Property", "Tenant", "Reported", "Urgency", "Status",
  ]);
  assert.equal(elements.filter(node => node.type === "Table.Row").length, 5);
  assert.equal(elements.find(node => node.props.className === "grid gap-3 md:hidden").props.children.length, 3);
  assert.ok(elements.some(node => node.props.className === "hidden md:block"));
  const blocks = elements.filter(node => node.type === "Skeleton");
  assert.ok(blocks.length > 0);
  assert.ok(blocks.every(node => node.props.className.includes("bg-grey-300!")));
  assert.ok(elements.some(node => node.type === "Table.ScrollContainer" && node.props.className.includes("overflow-x-auto")));
});

test("client loading uses shimmer rows/cards and hides the unknown total while keeping controls and badge behavior", () => {
  const viewed = [];
  const tree = load("page.tsx", { loading: true, markViewed: category => viewed.push(category) }).default();
  const elements = nodes(tree);
  assert.equal(tree.props["aria-busy"], true);
  assert.ok(elements.some(node => node.type === "Table.Row"));
  assert.ok(elements.some(node => node.type === "InputGroup.Input"));
  assert.ok(elements.some(node => node.type === "Button" && text(node).includes("Filters")));
  assert.ok(!text(tree).includes("Total:"));
  assert.ok(!text(tree).includes("No maintenance requests"));
  assert.deepEqual(viewed, ["maintenance"]);
});

test("settled empty state and error Retry still work without loading placeholders", () => {
  const empty = load("page.tsx").default();
  assert.equal(empty.props["aria-busy"], false);
  assert.ok(text(empty).includes("Total:"));
  assert.ok(text(empty).includes("No maintenance requests"));
  assert.ok(!nodes(empty).some(node => node.type === "Skeleton"));
  let refreshes = 0;
  const failed = load("page.tsx", { error: "Unable to load requests", refresh: () => refreshes++ }).default();
  assert.ok(text(failed).includes("Unable to load requests"));
  assert.ok(!text(failed).includes("No maintenance requests"));
  nodes(failed).find(node => node.type === "Button" && node.props.children === "Retry").props.onPress();
  assert.equal(refreshes, 1);
});

test("loaded requests keep search/status/urgency/city filtering and desktop/mobile detail navigation", () => {
  const record = {
    id: "request-one", issue_title: "Sample Issue", apartment_name: "Sample Property", apartment_city: "Caloocan",
    tenant_name: "Sample Tenant", tenant_avatar_url: null, reported_at: "2026-10-18", urgency: "high", status: "Pending",
  };
  const pushes = [];
  const tree = load("page.tsx", {
    requests: [record], filters: [" sample ", "Pending", "high", "Caloocan"], push: href => pushes.push(href),
  }).default();
  const elements = nodes(tree);
  elements.find(node => node.type === "Table.Content").props.onRowAction(record.id);
  elements.find(node => node.type === "button").props.onClick();
  assert.deepEqual(pushes, ["/landlord/maintenance-requests/request-one", "/landlord/maintenance-requests/request-one"]);
  for (const filters of [["other", "All", "All", "All"], ["", "Resolved", "All", "All"], ["", "All", "low", "All"], ["", "All", "All", "Malabon"]]) {
    assert.ok(text(load("page.tsx", { requests: [record], filters }).default()).includes("No maintenance requests"));
  }
});
