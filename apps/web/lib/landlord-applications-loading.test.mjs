import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const InputGroup = compound("InputGroup", ["Prefix", "Input"]);
const Dropdown = compound("Dropdown", ["Popover"]);

function load(file, { applications = [], loading = false, error = null, filters, push = () => {} } = {}) {
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": { useMemo: callback => callback(), useState: initial => [filters ? filters[stateIndex++] : initial, () => {}] },
    "next/navigation": { useRouter: () => ({ push }) },
    "@heroui/react": { Skeleton: "Skeleton", Table, InputGroup, Dropdown, Button: "Button", Chip: "Chip", Separator: "Separator" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatDate: value => value, formatPesoDisplay: value => `₱${value}`, getInitials: () => "T" },
    "@/hooks/use-landlord-applications": { useLandlordApplications: () => ({ applications, loading, error }) },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "./lib/application-status": { statusChipColor: () => "neutral" },
    "./ApplicationsHeader": { default: function ApplicationsHeader() { return load("components/ApplicationsHeader.tsx").default(); } },
    "./components/ApplicationsHeader": { default: function ApplicationsHeader() { return load("components/ApplicationsHeader.tsx").default(); } },
    "./components/ApplicationsSkeleton": {
      default: function ApplicationsSkeleton() { return load("components/ApplicationsSkeleton.tsx").default(); },
      ApplicationsCountSkeleton: function ApplicationsCountSkeleton() { return load("components/ApplicationsSkeleton.tsx").ApplicationsCountSkeleton(); },
      ApplicationsResultsSkeleton: function ApplicationsResultsSkeleton() { return load("components/ApplicationsSkeleton.tsx").ApplicationsResultsSkeleton(); },
    },
  };
  const source = readFileSync(new URL(`../app/landlord/applications/${file}`, import.meta.url), "utf8");
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
    "Sk", "ApplicationsHeader", "ApplicationsSkeleton", "ApplicationsCountSkeleton", "ApplicationsResultsSkeleton",
  ].includes(element.type.name);
  const children = expand ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

test("Applications route skeleton keeps its header and mirrors desktop rows and mobile cards", () => {
  const elements = nodes(load("loading.tsx").default());
  assert.equal(elements.find(node => node.type === "h1").props.children, "Applications");
  assert.ok(elements.some(node => node.props["aria-busy"] === "true" && node.props["aria-label"] === "Loading applications"));
  assert.deepEqual(elements.filter(node => node.type === "Table.Column").map(node => node.props.children), [
    "Tenant", "Property", "Location", "Date", "Status",
  ]);
  assert.equal(elements.filter(node => node.type === "Table.Row").length, 5);
  const cards = elements.find(node => node.props.className === "grid gap-3 md:hidden");
  assert.equal(cards.props.children.length, 3);
  assert.ok(elements.some(node => node.props.className === "hidden md:block"));
  const blocks = elements.filter(node => node.type === "Skeleton");
  assert.ok(blocks.length > 0);
  assert.ok(blocks.every(node => node.props.className.includes("bg-grey-300!")));
  assert.ok(elements.some(node => node.type === "Table.ScrollContainer" && node.props.className.includes("overflow-x-auto")));
});

test("client loading reuses results skeleton, keeps controls, and never flashes a zero total or empty state", () => {
  const tree = load("page.tsx", { loading: true }).default();
  const elements = nodes(tree);
  assert.equal(tree.props["aria-busy"], true);
  assert.ok(elements.some(node => node.type === "Table.Row"));
  assert.ok(elements.some(node => node.type === "InputGroup.Input"));
  assert.ok(elements.some(node => node.type === "Button" && text(node).includes("Filters")));
  assert.ok(!text(tree).includes("Total:"));
  assert.ok(!text(tree).includes("No applications found"));
});

test("settled empty and error states remain distinct from loading", () => {
  const empty = load("page.tsx").default();
  assert.equal(empty.props["aria-busy"], false);
  assert.ok(text(empty).includes("Total:"));
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
    monthly_rent: 5000, created_at: "2026-10-18", move_in_date: "2026-11-01", status: "Applied",
  };
  const pushes = [];
  const tree = load("page.tsx", {
    applications: [record], filters: [" sample ", "Applied", "Caloocan"], push: href => pushes.push(href),
  }).default();
  const elements = nodes(tree);
  elements.find(node => node.type === "Table.Content").props.onRowAction(record.id);
  elements.find(node => node.type === "button").props.onClick();
  assert.deepEqual(pushes, ["/landlord/applications/application-one", "/landlord/applications/application-one"]);
  for (const filters of [["other", "All", "All"], ["", "Approved", "All"], ["", "All", "Malabon"]]) {
    assert.ok(text(load("page.tsx", { applications: [record], filters }).default()).includes("No applications found"));
  }
});
