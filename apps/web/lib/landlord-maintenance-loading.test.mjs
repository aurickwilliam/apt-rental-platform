import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as maintenanceList from "../app/landlord/maintenance-requests/lib/maintenance-list.ts";
import * as maintenanceStatus from "../app/landlord/maintenance-requests/lib/maintenance-status.ts";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const InputGroup = compound("InputGroup", ["Prefix", "Input"]);
const Dropdown = compound("Dropdown", ["Popover", "Menu", "Item"]);
const Card = compound("Card", []);

function load(file, options = {}) {
  const { requests = [], loading = false, error = null, filters, push = () => {}, prefetch = () => {}, refresh = () => {}, markViewed = () => {}, history = [] } = options;
  let stateIndex = 0;
  let effectRan = false;
  const params = options.params ?? new URLSearchParams();
  if (filters) ["q", "status", "urgency", "city", "property", "days", "sort"].forEach((key, index) => { if (filters[index] !== undefined) params.set(key, filters[index]); });
  let href = `https://apt.example/landlord/maintenance-requests?${params}`;
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
      Suspense: "Suspense", useMemo: callback => callback(), useEffect: callback => { if (!effectRan) { effectRan = true; callback(); } },
      useState: initial => [filters ? filters[stateIndex++] : initial, () => {}],
    },
    "next/navigation": { useRouter: () => ({ push, prefetch }), useSearchParams: () => new URL(href).searchParams, useParams: () => ({ requestId: "request-one" }) },
    "next/image": { default: "Image" },
    "@heroui/react": { Skeleton: "Skeleton", Card, Table, InputGroup, Dropdown, Button: "Button", Label: "Label", Chip: "Chip", Separator: "Separator", toast: { success: () => {}, danger: () => {} }, useOverlayState: () => ({ isOpen: false, setOpen: options.setOpen ?? (() => {}) }) },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatDate: value => value, formatPesoDisplay: value => `PHP ${value}`, getInitials: () => "T" },
    "@/hooks/use-landlord-maintenance-requests": {
      useLandlordMaintenanceRequests: () => ({ requests, loading, error, refresh, actionLoading: options.actionLoading ?? false, advanceStatus: options.advanceStatus ?? (async () => ({ success: true })), resolveRequest: options.resolveRequest ?? (async () => ({ success: true })), waiveFee: options.waiveFee ?? (async () => ({ success: true })) }),
      getNextStatus: status => status === "Pending" ? "In Progress" : status === "In Progress" ? "Resolved" : status,
    },
    "@/hooks/use-landlord-action-badges": { useLandlordActionBadges: () => ({ markViewed }) },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/app/components/settings/SettingsSelect": { default: "SettingsSelect" },
    "./lib/maintenance-status": maintenanceStatus,
    "../lib/maintenance-status": maintenanceStatus,
    "../components/PhotoGrid": { default: "PhotoGrid" },
    "../components/ResolveMaintenanceModal": { default: "ResolveMaintenanceModal" },
    "../components/WaiveMaintenanceFeeModal": { default: "WaiveMaintenanceFeeModal" },
    "./components/MaintenanceDetailSkeleton": { default: function MaintenanceDetailSkeleton() { return load("[requestId]/components/MaintenanceDetailSkeleton.tsx").default(); } },
    "./lib/maintenance-list": maintenanceList,
    "./maintenance-list": maintenanceList,
    "./lib/use-maintenance-list-filters": { default: () => load("lib/use-maintenance-list-filters.ts", options).default() },
    "./MaintenanceSummary": { default: function MaintenanceSummary(props) { return load("components/MaintenanceSummary.tsx").default(props); } },
    "./components/MaintenanceSummary": { default: function MaintenanceSummary(props) { return load("components/MaintenanceSummary.tsx").default(props); } },
    "./components/MaintenanceEmptyState": { default: function MaintenanceEmptyState() { return load("components/MaintenanceEmptyState.tsx").default(); } },
    "./MaintenanceHeader": header,
    "./components/MaintenanceHeader": header,
    "./components/MaintenanceSkeletons": skeletons,
  };
  const source = readFileSync(new URL(`../app/landlord/maintenance-requests/${file}`, import.meta.url), "utf8");
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
  return context.exports;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && [
    "Sk", "MaintenanceHeader", "MaintenanceSkeleton", "MaintenanceCountSkeleton", "MaintenanceResultsSkeleton",
    "MaintenanceTableSkeleton", "MaintenanceCardSkeleton", "MaintenanceEmptyState", "MaintenanceContent", "MaintenanceSummary",
    "MaintenanceDetailSkeleton", "MaintenanceDetailFieldSkeleton", "MaintenanceDetailSectionTitle", "SectionTitle", "DetailField",
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
    "Issue", "Property", "Location", "Tenant", "Reported", "Urgency", "Status", "Actions",
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
  assert.ok(elements.some(node => node.props["aria-busy"] === true));
  assert.ok(elements.some(node => node.type === "Table.Row"));
  assert.ok(elements.some(node => node.type === "InputGroup.Input"));
  assert.ok(elements.some(node => node.type === "Button" && text(node).includes("Filters")));
  assert.ok(!text(tree).includes("Total:"));
  assert.ok(!text(tree).includes("No maintenance requests"));
  assert.deepEqual(viewed, ["maintenance"]);
});

test("settled empty state and error Retry still work without loading placeholders", () => {
  const empty = load("page.tsx").default();
  assert.ok(nodes(empty).some(node => node.props["aria-busy"] === false));
  assert.ok(text(empty).includes("Total"));
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

const sampleRequest = {
  id: "request-one", apartment_id: "property-one", issue_title: "Plumbing problem", description: "Water leak under sink",
  apartment_name: "Cozy Cove", apartment_city: "Caloocan", apartment_address: "123 Test St", apartment_monthly_rent: 15000,
  apartment_thumbnail_url: "/thumb.jpg", tenant_name: "Sample Tenant", tenant_email: "tenant@example.test", tenant_avatar_url: null,
  reported_at: "2026-10-17", status: "Resolved", urgency: "low",
};

test("Maintenance reference layout includes four totals, eight columns, sorting, thumbnails and row actions", () => {
  const elements = nodes(load("page.tsx", { requests: [sampleRequest] }).default());
  const summary = elements.find(node => node.type.name === "MaintenanceSummary");
  assert.deepEqual(summary.props.summary, { total: 1, resolved: 1, inProgress: 0, cancelled: 0 });
  assert.equal(elements.filter(node => node.type === "SettingsSelect").length, 6);
  assert.ok(elements.some(node => node.type === "Image" && node.props.src === "/thumb.jpg"));
  assert.ok(elements.some(node => node.type === "Dropdown.Item" && node.props.id === "view"));
  const sortable = elements.filter(node => node.type === "Table.Column" && node.props.allowsSorting);
  assert.deepEqual(sortable.map(node => node.props.id), ["reported_at", "urgency", "status"]);
  assert.ok(elements.some(node => node.type === "Table.ScrollContainer" && node.props.className.includes("overflow-x-auto")));
});

test("Maintenance fee states map to readable chips and a pending fee can be waived", async () => {
  assert.deepEqual(maintenanceStatus.maintenanceFeeChip("pending"), {
    tone: "warning",
    label: "Added to next rent",
  });
  assert.deepEqual(maintenanceStatus.maintenanceFeeChip("paid"), { tone: "success", label: "Paid" });
  assert.deepEqual(maintenanceStatus.maintenanceFeeChip("waived"), { tone: "neutral", label: "Waived" });

  const waived = [];
  const record = {
    ...sampleRequest,
    status: "Resolved",
    resolution_notes: "Fixed the leak",
    fee_amount: 500,
    fee_status: "pending",
  };
  const tree = load("[requestId]/page.tsx", {
    requests: [record],
    waiveFee: async (id) => {
      waived.push(id);
      return { success: true };
    },
  }).default();
  const elements = nodes(tree);
  assert.ok(text(tree).includes("Added to next rent"));

  const waiveButton = elements.find(
    (node) => node.type === "Button" && node.props.children === "Waive fee",
  );
  assert.ok(waiveButton);
  waiveButton.props.onPress();

  const modal = elements.find((node) => node.type === "WaiveMaintenanceFeeModal");
  assert.equal(modal.props.feeAmount, 500);
  await modal.props.onConfirm();
  assert.deepEqual(waived, ["request-one"]);
});

test("Maintenance search and headers explicitly retain readable colors before hover", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.maintenance-list-table \.table__column\s*\{[^}]*color:\s*var\(--foreground\)/);
  assert.match(styles, /\.landlord-maintenance-page \.maintenance-search\s*\{[^}]*--field-placeholder:\s*var\(--muted-foreground\)/);
  assert.match(styles, /\.maintenance-search \.input-group__input::placeholder\s*\{[^}]*color:\s*var\(--muted-foreground\)/);
  const elements = nodes(load("page.tsx").default());
  assert.ok(elements.some(node => node.type === InputGroup && node.props.className.includes("maintenance-search")));
});

test("Maintenance filters update URL state without navigating and preserve unrelated overlay parameters", () => {
  const history = [];
  const filter = load("lib/use-maintenance-list-filters.ts", { params: new URLSearchParams("notifications=open&status=invalid&urgency=invalid&sort=invalid"), history }).default();
  assert.equal(filter.statusFilter, "All");
  assert.equal(filter.urgencyFilter, "All");
  assert.equal(filter.sort.column, "reported_at");
  filter.setPropertyFilter("property-one");
  filter.setUrgencyFilter("high");
  filter.setCityFilter("Caloocan");
  filter.setDateFilter("30");
  let params = new URL(history.at(-1), "https://apt.example").searchParams;
  assert.equal(params.get("property"), "property-one");
  assert.equal(params.get("urgency"), "high");
  assert.equal(params.get("city"), "Caloocan");
  assert.equal(params.get("days"), "30");
  filter.clearFilters();
  params = new URL(history.at(-1), "https://apt.example").searchParams;
  assert.equal(params.get("notifications"), "open");
  assert.equal(params.has("urgency"), false);
  assert.equal(params.has("property"), false);
});

test("Maintenance failures show unknown statistics and details warm on hover or keyboard focus", () => {
  const failure = nodes(load("page.tsx", { error: "Could not load requests" }).default());
  assert.equal(failure.find(node => node.type.name === "MaintenanceSummary").props.summary, null);
  const warmed = [];
  const elements = nodes(load("page.tsx", { requests: [sampleRequest], prefetch: href => warmed.push(href) }).default());
  elements.find(node => node.type === "Table.Row").props.onMouseEnter();
  elements.find(node => node.type === "section").props.onFocusCapture({ target: { closest: () => ({ dataset: { requestId: sampleRequest.id } }) } });
  const card = elements.find(node => node.type === "button");
  card.props.onMouseEnter(); card.props.onFocus();
  assert.deepEqual(warmed, Array(4).fill("/landlord/maintenance-requests/request-one"));
});

test("Maintenance detail route and client loading share a matching skeleton without showing request data or actions", () => {
  for (const [file, options] of [["[requestId]/loading.tsx", {}], ["[requestId]/page.tsx", { loading: true }]]) {
    const elements = nodes(load(file, options).default());
    assert.ok(elements.some(node => node.props["aria-busy"] === "true" && node.props["aria-label"] === "Loading maintenance request details"));
    assert.equal(elements.find(node => node.type === "h1").props.children, "Maintenance Request");
    const content = text({ type: "root", props: { children: elements } });
    for (const title of ["Property & Tenant", "Issue Description", "Issue Photos", "Resolution Notes", "Maintenance Fee"]) assert.ok(content.includes(title));
    assert.equal(elements.filter(node => node.type.name === "MaintenanceDetailFieldSkeleton").length, 6);
    assert.equal(elements.filter(node => node.type === "Skeleton" && node.props.className.includes("size-24")).length, 3);
    assert.ok(elements.some(node => node.props["aria-hidden"] === "true"));
    assert.equal(elements.some(node => node.type === "Button"), false);
  }
});

test("Maintenance detail Back prefetches on pointer/focus and reliably returns to the list, including errors", () => {
  for (const options of [{ requests: [{ ...sampleRequest, photos: [], fee_amount: null }] }, { error: "Cannot load request" }]) {
    const warmed = [];
    const pushed = [];
    const elements = nodes(load("[requestId]/page.tsx", { ...options, push: href => pushed.push(href), prefetch: href => warmed.push(href) }).default());
    const back = elements.find(node => node.type === "Button");
    back.props.onHoverStart(); back.props.onFocus(); back.props.onPress();
    assert.deepEqual(warmed, ["/landlord/maintenance-requests", "/landlord/maintenance-requests"]);
    assert.deepEqual(pushed, ["/landlord/maintenance-requests"]);
  }
});

test("Maintenance detail status flow, resolution notes, fee and private photo props remain intact", async () => {
  const advanced = [];
  const opened = [];
  const resolved = [];
  const render = (status, extra = {}) => nodes(load("[requestId]/page.tsx", {
    requests: [{ ...sampleRequest, photos: ["private-signed-photo"], fee_amount: 500, fee_status: "pending", resolution_notes: "Fixed", status }],
    advanceStatus: async id => { advanced.push(id); return { success: true }; },
    setOpen: value => opened.push(value),
    resolveRequest: async (...args) => { resolved.push(args); return { success: true }; },
    ...extra,
  }).default());
  const pending = render("Pending");
  const advance = pending.find(node => node.type === "Button" && node.props.children === "Mark as In Progress");
  assert.equal(advance.props.isDisabled, false);
  await advance.props.onPress();
  assert.deepEqual(advanced, ["request-one"]);
  const inProgress = render("In Progress");
  await inProgress.find(node => node.type === "Button" && node.props.children === "Mark as Resolved").props.onPress();
  assert.deepEqual(opened, [true]);
  await inProgress.find(node => node.type === "ResolveMaintenanceModal").props.onConfirm("Fixed leak", 500);
  assert.deepEqual(resolved, [["request-one", "Fixed leak", 500]]);
  const complete = render("Resolved");
  assert.ok(text({ type: "root", props: { children: complete } }).includes("Fixed"));
  assert.ok(complete.some(node => node.type === "PhotoGrid" && node.props.photos[0] === "private-signed-photo"));
  assert.ok(complete.some(node => node.type === "StatusChip" && node.props.children === "Added to next rent"));
  for (const status of ["Resolved", "Cancelled"]) {
    assert.equal(render(status).find(node => node.type === "Button" && node.props.children === status).props.isDisabled, true);
  }
});
