import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const jsx = (type, props) => ({ type, props });
const Disclosure = Object.assign(() => {}, { Heading: "DisclosureHeading", Trigger: "DisclosureTrigger", Content: "DisclosureContent" });
const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
const text = (node) => typeof node === "string" ? node : !node || typeof node !== "object" ? "" : [node.props?.children].flat(Infinity).map(text).join(" ");
const requests = [
  { id: "resolved", title: "Leaking tap", category: "plumbing", status: "Resolved", urgency: "medium", created_at: "2026-11-01", message: "Water leaks under the sink.", image_paths: ["tenant/tap"], image_urls: [], resolved_at: "2026-11-02", resolution_notes: "Replaced the seal." },
  { id: "cancelled", title: "Broken light", category: "electrical", status: "Cancelled", urgency: "low", created_at: "2026-11-01", message: "Bulb is broken.", image_paths: ["tenant/light"], image_urls: [], resolved_at: null },
];

function fixture(kind = "history", selectedRequests = requests) {
  const runtime = hookRuntime();
  let photoPaths;
  const History = compile("app/tenant/maintenance/components/MaintenanceHistory.tsx", {
    react: runtime.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Card: Object.assign(() => {}, { Content: "CardContent" }), Disclosure, Modal: Object.assign(() => {}, { Backdrop: "Backdrop", Container: "Container", Dialog: "Dialog", Header: "Header", Heading: "Heading", Body: "Body", Footer: "Footer" }), Spinner: "Spinner", useOverlayState: () => ({ isOpen: false }), toast: {} },
    "@tabler/icons-react": { IconTool: "IconTool", IconChevronDown: "ChevronDown", IconChevronUp: "ChevronUp" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "../data/maintenance-data": { CATEGORIES: [{ id: "plumbing", label: "Plumbing" }] },
    "@/hooks/use-maintenance-photo-urls": { useMaintenancePhotoUrls: (paths) => { photoPaths = Array.from(paths); return { urls: { "tenant/tap": "https://example.test/tap" }, loading: false, error: null }; } },
    "@/hooks/use-maintenance-request-history": { canCancelMaintenanceRequest: (status) => status === "Pending" || status === "In Progress" },
  }).default;
  const render = () => runtime.render(() => History({ requests: selectedRequests, loading: false, error: null, cancellingId: null, onCancel: async () => ({ success: true }), kind }));
  return { render, paths: () => photoPaths, runtime };
}

test("history starts as compact summary rows, retaining labels/statuses but hiding details and skipping photo reads", () => {
  const h = fixture();
  const tree = h.render();
  assert.deepEqual(h.paths(), []);
  assert.match(text(tree), /Leaking tap/);
  assert.match(text(tree), /Resolved/);
  assert.doesNotMatch(text(tree), /Water leaks|Replaced the seal/);
  const rows = nodes(tree).filter((node) => node.type === Disclosure);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => !row.props.isExpanded));
  assert.ok(rows.every((row) => row.props.className.includes("py-2.5")));
  assert.equal(nodes(tree).find((node) => node.type === "CardContent").props.style.padding, 4);
  assert.equal(nodes(tree).filter((node) => node.type === "DisclosureTrigger").length, 2);
});

test("expanding one history request shows its full details and only signs its own photos; closing hides them again", () => {
  const h = fixture();
  const row = nodes(h.render()).find((node) => node.type === Disclosure);
  row.props.onExpandedChange(true);
  const expanded = h.render();
  assert.deepEqual(h.paths(), ["tenant/tap"]);
  assert.match(text(expanded), /Water leaks under the sink/);
  assert.match(text(expanded), /Replaced the seal/);
  assert.doesNotMatch(text(expanded), /Bulb is broken/);
  assert.equal(nodes(expanded).find((node) => node.type === "img").props.src, "https://example.test/tap");
  assert.ok(nodes(expanded).some((node) => node.type === "DisclosureTrigger" && node.props["aria-label"] === "Hide details for Leaking tap"));
  nodes(expanded).find((node) => node.type === Disclosure).props.onExpandedChange(false);
  assert.doesNotMatch(text(h.render()), /Water leaks under the sink/);
  assert.deepEqual(h.paths(), []);
});

test("active request presentation keeps details visible and batch photo reads without disclosure controls, using compact outer padding", () => {
  const h = fixture("active");
  const tree = h.render();
  assert.match(text(tree), /Water leaks under the sink/);
  assert.match(text(tree), /Replaced the seal/);
  assert.deepEqual(h.paths(), ["tenant/tap", "tenant/light"]);
  assert.equal(nodes(tree).filter((node) => node.type === "DisclosureTrigger").length, 0);
  assert.equal(nodes(tree).find((node) => node.type === "CardContent").props.style.padding, 4);
});

test("an empty active list uses compact message spacing rather than a tall empty state", () => {
  const tree = fixture("active", []).render();
  const message = nodes(tree).find((node) => node.type === "p" && text(node).includes("No active maintenance requests."));
  assert.ok(message.props.className.includes("py-2"));
  assert.equal(nodes(tree).find((node) => node.type === "CardContent").props.style.padding, 4);
});

test("overview tightens padding and section gaps while preserving values, typography and errors", () => {
  let retried = false;
  const Overview = compile("app/tenant/maintenance/components/MaintenanceOverview.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Card: Object.assign(() => {}, { Content: "CardContent" }), Skeleton: "Skeleton" },
    "@tabler/icons-react": { IconReceipt: "IconReceipt", IconTool: "IconTool" },
    "@repo/utils": { formatPesoDisplay: (amount) => `₱${amount}` },
    "@/app/components/display/ErrorBanner": { default: "ErrorBanner" },
  }).default;
  const props = { data: { activeCount: 3, unpaidFees: 750 }, loading: false, error: null, onRetry: () => { retried = true; } };
  const tree = Overview(props);
  const content = nodes(tree).find((node) => node.type === "CardContent");
  assert.equal(content.props.style.padding, 4);
  assert.equal(content.props.className, "space-y-3");
  assert.equal(nodes(tree).find((node) => node.type === "dl").props.className, "space-y-3");
  assert.ok(nodes(tree).some((node) => node.props?.className === "border-t border-border pt-3"));
  assert.ok(nodes(tree).some((node) => node.type === "dd" && node.props.children === 3 && node.props.className.includes("text-3xl")));
  assert.match(text(tree), /₱750/);
  assert.match(text(tree), /including previous months/);
  const failed = Overview({ ...props, data: null, error: "Unavailable" });
  assert.equal(nodes(failed).find((node) => node.type === "ErrorBanner").props.message, "Unavailable");
  nodes(failed).find((node) => node.type === "Button").props.onPress();
  assert.equal(retried, true);
});
