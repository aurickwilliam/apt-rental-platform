import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import { sortActiveMaintenanceRequests } from "./maintenance-featured-request.ts";
import { MAINTENANCE_HISTORY_PREVIEW_LIMIT, sortMaintenanceHistoryRequests } from "./maintenance-history-preview.ts";

const jsx = (type, props) => ({ type, props });
const Disclosure = Object.assign(() => {}, { Heading: "DisclosureHeading", Trigger: "DisclosureTrigger", Content: "DisclosureContent" });
const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
const text = (node) => typeof node === "string" || typeof node === "number" ? String(node) : !node || typeof node !== "object" ? "" : [node.props?.children].flat(Infinity).map(text).join(" ").replace(/\s+/g, " ");
const requests = [
  { id: "resolved", title: "Leaking tap", category: "plumbing", status: "Resolved", urgency: "medium", created_at: "2026-11-01", message: "Water leaks under the sink.", image_paths: ["tenant/tap"], image_urls: [], resolved_at: "2026-11-02", resolution_notes: "Replaced the seal." },
  { id: "cancelled", title: "Broken light", category: "electrical", status: "Cancelled", urgency: "low", created_at: "2026-11-01", message: "Bulb is broken.", image_paths: ["tenant/light"], image_urls: [], resolved_at: null },
];

function fixture(kind = "history", selectedRequests = requests) {
  const runtime = hookRuntime();
  let photoPaths;
  const icons = { IconTool: "IconTool", IconHistory: "IconHistory", IconChevronRight: "ChevronRight", IconChevronUp: "ChevronUp", IconStack: "IconStack", IconCalendarEvent: "IconCalendarEvent", IconBolt: "IconBolt", IconLeaf: "IconLeaf", IconCircleCheck: "IconCircleCheck", IconCircleX: "IconCircleX" };
  const HistoryRow = compile("app/tenant/maintenance/components/MaintenanceHistoryRow.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Disclosure },
    "@tabler/icons-react": icons,
    "@/app/components/display/StatusChip": { default: "StatusChip" },
  }).default;
  const renderJsx = (type, props) => type === HistoryRow ? HistoryRow(props) : jsx(type, props);
  const History = compile("app/tenant/maintenance/components/MaintenanceHistory.tsx", {
    react: runtime.react,
    "react/jsx-runtime": { jsx: renderJsx, jsxs: renderJsx },
    "@heroui/react": { Button: "Button", Card: Object.assign(() => {}, { Content: "CardContent" }), Disclosure, Modal: Object.assign(() => {}, { Backdrop: "Backdrop", Container: "Container", Dialog: "Dialog", Header: "Header", Heading: "Heading", Body: "Body", Footer: "Footer" }), Spinner: "Spinner", useOverlayState: () => ({ isOpen: false }), toast: {} },
    "@tabler/icons-react": { IconTool: "IconTool", IconHistory: "IconHistory", IconChevronRight: "ChevronRight", IconChevronUp: "ChevronUp", IconStack: "IconStack", IconCalendarEvent: "IconCalendarEvent", IconBolt: "IconBolt", IconLeaf: "IconLeaf", IconCircleCheck: "IconCircleCheck", IconCircleX: "IconCircleX" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "./ActiveMaintenanceRequestCard": { default: "ActiveMaintenanceRequestCard" },
    "./ActiveMaintenanceRequestsModal": { default: "ActiveMaintenanceRequestsModal" },
    "./MaintenanceHistoryRow": { default: HistoryRow },
    "./MaintenanceHistoryModal": { default: "MaintenanceHistoryModal" },
    "@/lib/maintenance-featured-request": { sortActiveMaintenanceRequests },
    "@/lib/maintenance-history-preview": { MAINTENANCE_HISTORY_PREVIEW_LIMIT, sortMaintenanceHistoryRequests },
    "@/service/maintenanceService": { MAINTENANCE_HISTORY_LIMIT: 100 },
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
  assert.ok(nodes(tree).some((node) => node.type === "IconHistory" && node.props.size === 24));
  assert.ok(!nodes(tree).some((node) => node.type === "IconTool"));
  assert.deepEqual(h.paths(), []);
  assert.match(text(tree), /Leaking tap/);
  assert.match(text(tree), /Resolved/);
  assert.doesNotMatch(text(tree), /Water leaks|Replaced the seal/);
  const rows = nodes(tree).filter((node) => node.type === Disclosure);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => !row.props.isExpanded));
  assert.ok(rows.every((row) => row.props.className.includes("p-4")));
  assert.equal(nodes(tree).find((node) => node.type === "CardContent").props.style.padding, 4);
  const triggers = nodes(tree).filter((node) => node.type === "Button" && node.props.slot === "trigger");
  assert.equal(triggers.length, 2);
  assert.ok(triggers.every((node) => node.props.variant === "secondary"));
  assert.ok(nodes(tree).some((node) => node.type === "IconStack"));
  assert.ok(nodes(tree).some((node) => node.type === "IconCalendarEvent"));
  assert.ok(nodes(tree).some((node) => node.type === "IconCircleCheck"));
  assert.ok(nodes(tree).some((node) => node.type === "IconCircleX"));
  assert.ok(nodes(tree).some((node) => node.type === "ChevronRight"));
  assert.ok(nodes(tree).some((node) => node.props?.className?.includes("h-6 w-1.5 shrink-0 rounded-full bg-primary")));
});

test("history previews only the three newest rows; See more opens the remaining rows without signing collapsed or closed-modal photos", () => {
  const records = Array.from({ length: 5 }, (_, index) => ({ ...requests[0], id: `h${index}`, title: `Request ${index}`, created_at: `2026-11-0${index + 1}`, image_paths: [`tenant/photo-${index}`] }));
  const h = fixture("history", [records[2], records[0], records[4], records[1], records[3]]);
  const initial = h.render();
  const rows = nodes(initial).filter((node) => node.type === Disclosure);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => text(row).match(/Request \d/)[0]), ["Request 4", "Request 3", "Request 2"]);
  assert.doesNotMatch(text(initial), /Request [01]/);
  assert.deepEqual(h.paths(), []);
  nodes(initial).find((node) => node.type === "Button" && text(node).trim() === "See more").props.onPress();
  let modal = nodes(h.render()).find((node) => node.type === "MaintenanceHistoryModal");
  assert.equal(modal.props.isOpen, true);
  assert.deepEqual(modal.props.requests.map((row) => row.id), ["h1", "h0"]);
  const olderRow = modal.props.renderRequest(modal.props.requests[0]);
  olderRow.props.onExpandedChange(true);
  h.render();
  assert.deepEqual(h.paths(), ["tenant/photo-1"]);
  modal = nodes(h.render()).find((node) => node.type === "MaintenanceHistoryModal");
  modal.props.onOpenChange(false);
  assert.equal(nodes(h.render()).filter((node) => node.type === Disclosure).length, 3);
  assert.deepEqual(h.paths(), [], "closed modal rows cannot keep private signing active");
});

test("See more stays hidden with zero, one or exactly three history records; active rows are excluded", () => {
  for (const count of [0, 1, 3]) {
    const records = Array.from({ length: count }, (_, index) => ({ ...requests[0], id: `r${index}` }));
    const tree = fixture("history", records).render();
    assert.equal(nodes(tree).filter((node) => node.type === Disclosure).length, count);
    assert.ok(!nodes(tree).some((node) => node.type === "Button" && text(node).trim() === "See more"));
  }
  assert.deepEqual(sortMaintenanceHistoryRequests([{ ...requests[0], status: "Pending" }]), []);
});

test("the older-history modal reuses row rendering, retains the compact Tabler close control, and handles read failures without false empty results", () => {
  const modalRoot = Object.assign(() => {}, Object.fromEntries(["Backdrop", "Container", "Dialog", "CloseTrigger", "Header", "Heading", "Body"].map((key) => [key, key])));
  const HistoryModal = compile("app/tenant/maintenance/components/MaintenanceHistoryModal.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Modal: modalRoot, Button: "Button", Spinner: "Spinner" },
    "@tabler/icons-react": { IconX: "IconX" },
    "@/service/maintenanceService": { MAINTENANCE_HISTORY_LIMIT: 100 },
  }).default;
  let retried = false;
  const closes = [];
  const props = { isOpen: true, onOpenChange: (open) => closes.push(open), requests, loading: false, error: null, photoLoading: false, photoError: null, limitReached: true, onRetry: () => { retried = true; }, renderRequest: (request) => jsx("HistoryRow", { request }) };
  const tree = HistoryModal(props);
  assert.equal(nodes(tree).filter((node) => node.type === "HistoryRow").length, requests.length);
  const close = nodes(tree).find((node) => node.type === "CloseTrigger");
  assert.equal(close.props.className, "maintenance-modal-close");
  assert.equal(close.props.children.type, "IconX");
  assert.equal(close.props.children.props.size, 16);
  assert.match(text(tree), /latest 100 requests/);
  tree.props.onOpenChange(false);
  assert.deepEqual(closes, [false]);
  const failed = HistoryModal({ ...props, error: "History unavailable" });
  assert.equal(nodes(failed).filter((node) => node.type === "HistoryRow").length, 0);
  assert.match(text(failed), /History unavailable/);
  assert.doesNotMatch(text(failed), /No more maintenance requests/);
  nodes(failed).find((node) => node.type === "Button").props.onPress();
  assert.equal(retried, true);
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
  assert.ok(nodes(expanded).some((node) => node.type === "Button" && node.props.slot === "trigger" && node.props["aria-label"] === "Hide details for Leaking tap"));
  nodes(expanded).find((node) => node.type === Disclosure).props.onExpandedChange(false);
  assert.doesNotMatch(text(h.render()), /Water leaks under the sink/);
  assert.deepEqual(h.paths(), []);
});

test("active request presentation features one request, and only loads hidden photos when View all is opened", () => {
  const h = fixture("active", requests.map((request) => ({ ...request, status: "Pending" })));
  const tree = h.render();
  const activeCard = nodes(tree).find((node) => node.type === "ActiveMaintenanceRequestCard");
  assert.ok(nodes(tree).some((node) => node.type === "IconTool" && node.props.size === 24));
  assert.ok(!nodes(tree).some((node) => node.type === "IconHistory"));
  assert.equal(activeCard.props.request.message, "Water leaks under the sink.");
  assert.equal(activeCard.props.request.resolution_notes, "Replaced the seal.");
  assert.deepEqual(Array.from(activeCard.props.imageUrls), ["https://example.test/tap"]);
  assert.deepEqual(h.paths(), ["tenant/tap"]);
  assert.equal(nodes(tree).filter((node) => node.type === "ActiveMaintenanceRequestCard").length, 1);
  const viewAll = nodes(tree).find((node) => node.type === "Button" && text(node) === "View all active requests (2)");
  assert.ok(viewAll);
  assert.ok(viewAll.props.className.includes("ml-auto"));
  assert.ok(nodes(tree).indexOf(viewAll) < nodes(tree).indexOf(activeCard), "View all belongs above the featured card");
  viewAll.props.onPress();
  const opened = h.render();
  assert.deepEqual(h.paths(), ["tenant/tap", "tenant/light"]);
  assert.equal(nodes(opened).find((node) => node.type === "ActiveMaintenanceRequestsModal").props.isOpen, true);
  assert.equal(nodes(tree).filter((node) => node.type === "DisclosureTrigger").length, 0);
  assert.equal(nodes(tree).find((node) => node.type === "CardContent").props.style.padding, 4);
});

test("an empty active list uses compact message spacing rather than a tall empty state", () => {
  const tree = fixture("active", []).render();
  const message = nodes(tree).find((node) => node.type === "p" && text(node).includes("No active maintenance requests."));
  assert.ok(message.props.className.includes("py-2"));
  assert.equal(nodes(tree).find((node) => node.type === "CardContent").props.style.padding, 4);
});

test("HeroUI overview uses two inset panels with right-aligned values while preserving totals and errors", () => {
  let retried = false;
  const Overview = compile("app/tenant/maintenance/components/MaintenanceOverview.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Card: Object.assign(() => {}, { Content: "CardContent" }), Separator: "Separator", Skeleton: "Skeleton" },
    "@tabler/icons-react": { IconReceipt: "IconReceipt", IconTool: "IconTool", IconChartBar: "IconChartBar" },
    "@repo/utils": { formatPesoDisplay: (amount) => `₱${amount}` },
    "@/app/components/display/ErrorBanner": { default: "ErrorBanner" },
  }).default;
  const props = { data: { activeCount: 3, unpaidFees: 750 }, loading: false, error: null, onRetry: () => { retried = true; } };
  const tree = Overview(props);
  const content = nodes(tree).find((node) => node.type === "CardContent");
  assert.equal(content.props.style.padding, 4);
  const panels = nodes(tree).filter((node) => node.props?.style?.gridTemplateColumns);
  assert.equal(panels.length, 2);
  assert.ok(panels.every((node) => node.props.style.display === "grid" && node.props.style.gridTemplateColumns.endsWith("fit-content(50%)")));
  assert.equal(nodes(tree).filter((node) => node.type === "Separator").length, 0);
  assert.equal(nodes(tree).filter((node) => node.type === "dd" && node.props.className?.includes("rounded-xl bg-primary/10")).length, 2);
  assert.ok(nodes(tree).some((node) => node.type === "IconChartBar"));
  assert.ok(nodes(tree).some((node) => node.type === "dd" && node.props.children === 3 && node.props.className.includes("text-3xl")));
  assert.match(text(tree), /₱750/);
  assert.match(text(tree), /including previous months/);
  const failed = Overview({ ...props, data: null, error: "Unavailable" });
  assert.equal(nodes(failed).find((node) => node.type === "ErrorBanner").props.message, "Unavailable");
  nodes(failed).find((node) => node.type === "Button").props.onPress();
  assert.equal(retried, true);
});

test("active HeroUI request card keeps metadata, photos and the bottom-right cancellation action", () => {
  let cancelled = false;
  const ActiveCard = compile("app/tenant/maintenance/components/ActiveMaintenanceRequestCard.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Card: Object.assign(() => {}, { Content: "CardContent" }) },
    "@tabler/icons-react": { IconCalendarEvent: "IconCalendarEvent", IconStack: "IconStack", IconFlag: "IconFlag", IconClock: "IconClock", IconProgress: "IconProgress", IconTrash: "IconTrash" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
  }).default;
  const props = { request: { ...requests[0], status: "Pending" }, category: "Plumbing", imageUrls: ["https://example.test/tap"], urgencyTone: "warning", statusTone: "warning", cancellable: true, cancelling: false, onCancel: () => { cancelled = true; } };
  const tree = ActiveCard(props);
  assert.match(text(tree), /Leaking tap/);
  assert.match(text(tree), /Water leaks under the sink/);
  assert.equal(nodes(tree).find((node) => node.type === "time").props.dateTime, props.request.created_at);
  assert.ok(nodes(tree).some((node) => node.type === "IconStack"));
  assert.equal(nodes(tree).find((node) => node.type === "a").props.href, "https://example.test/tap");
  assert.match(nodes(tree).find((node) => node.type === "a").props.className, /size-24 shrink-0.*sm:size-32/);
  const button = nodes(tree).find((node) => node.type === "Button");
  assert.ok(nodes(tree).some((node) => node.props?.className?.includes("sm:grid-cols-[8rem_minmax(0,1fr)]")));
  assert.ok(nodes(tree).some((node) => node.props?.className === "mt-3 flex justify-end"));
  assert.match(text(tree), /Description/);
  assert.ok(nodes(tree).some((node) => node.type === "IconTrash"));
  assert.ok(nodes(tree).some((node) => node.type === "IconFlag"));
  assert.ok(nodes(tree).some((node) => node.type === "IconClock"));
  button.props.onPress();
  assert.equal(cancelled, true);
  const saving = ActiveCard({ ...props, cancelling: true });
  assert.equal(nodes(saving).find((node) => node.type === "Button").props.isDisabled, true);
  const photoFree = ActiveCard({ ...props, imageUrls: [] });
  assert.equal(nodes(photoFree).filter((node) => node.type === "img").length, 0);
  assert.equal(nodes(photoFree).filter((node) => node.type === "Button").length, 1);
  assert.ok(!nodes(photoFree).some((node) => node.props?.className?.includes("sm:grid-cols-[8rem_minmax(0,1fr)]")));
  const multiplePhotos = ActiveCard({ ...props, imageUrls: ["https://example.test/one", "https://example.test/two"] });
  assert.equal(nodes(multiplePhotos).filter((node) => node.type === "img").length, 2);
  assert.ok(!nodes(multiplePhotos).some((node) => node.props?.className?.includes("sm:grid-cols-[8rem_minmax(0,1fr)]")));
});
