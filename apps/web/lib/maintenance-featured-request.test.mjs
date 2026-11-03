import assert from "node:assert/strict";
import test from "node:test";
import { sortActiveMaintenanceRequests } from "./maintenance-featured-request.ts";
import { compile, deferred, hookRuntime } from "./test-support/hook-runtime.mjs";

const row = (id, status, created_at, updated_at = null) => ({ id, status, created_at, updated_at, title: id });

test("In Progress wins over newer Pending; the most recently updated progress request is featured", () => {
  const requests = [row("pending", "Pending", "2026-11-03"), row("old-progress", "In Progress", "2026-10-01", "2026-11-01"), row("updated-progress", "In Progress", "2026-09-01", "2026-11-02")];
  const original = requests.slice();
  assert.deepEqual(sortActiveMaintenanceRequests(requests).map((request) => request.id), ["updated-progress", "old-progress", "pending"]);
  assert.deepEqual(requests, original);
});

test("all-Pending requests use newest submission, not an incidental update; legacy progress falls back honestly", () => {
  assert.equal(sortActiveMaintenanceRequests([row("old", "Pending", "2026-10-01", "2026-11-05"), row("new", "Pending", "2026-11-03")])[0].id, "new");
  assert.equal(sortActiveMaintenanceRequests([row("legacy", "In Progress", "2026-11-02"), row("tracked", "In Progress", "2026-10-01", "2026-11-01")])[0].id, "legacy");
  assert.equal(sortActiveMaintenanceRequests([row("invalid", "In Progress", "2026-11-02", "invalid-date"), row("tracked", "In Progress", "2026-10-01", "2026-11-01")])[0].id, "invalid");
});

test("closed rows never feature, ties are deterministic, and the next active request replaces a closed featured row", () => {
  const requests = [row("b", "In Progress", "2026-11-02"), row("a", "In Progress", "2026-11-02"), row("pending", "Pending", "2026-11-03"), row("resolved", "Resolved", "2026-11-04")];
  assert.equal(sortActiveMaintenanceRequests(requests)[0].id, "b");
  assert.equal(sortActiveMaintenanceRequests(requests.map((request) => request.id === "b" ? { ...request, status: "Cancelled" } : request))[0].id, "a");
  assert.deepEqual(sortActiveMaintenanceRequests([row("closed", "Resolved", "2026-11-03")]), []);
  assert.deepEqual(sortActiveMaintenanceRequests([]), []);
});

const jsx = (type, props) => ({ type, props });
const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
const text = (node) => typeof node === "string" ? node : !node || typeof node !== "object" ? "" : [node.props?.children].flat(Infinity).map(text).join(" ");

test("the active-list modal confirms inside its own layer, locks duplicate writes and dismissals, and preserves failed cancellation for retry", async () => {
  const runtime = hookRuntime();
  const first = deferred();
  const notices = [];
  const closes = [];
  let writes = 0;
  const modalRoot = Object.assign(() => {}, Object.fromEntries(["Backdrop", "Container", "Dialog", "CloseTrigger", "Header", "Heading", "Body", "Footer"].map((key) => [key, key])));
  const Modal = compile("app/tenant/maintenance/components/ActiveMaintenanceRequestsModal.tsx", {
    react: runtime.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Modal: modalRoot, Button: "Button", Spinner: "Spinner", toast: { success: (message) => notices.push(message), danger: (message) => notices.push(message) } },
    "@/service/maintenanceService": { MAINTENANCE_HISTORY_LIMIT: 100 },
  }).default;
  const render = () => runtime.render(() => Modal({ isOpen: true, onOpenChange: (open) => closes.push(open), requests: [row("request-a", "In Progress", "2026-11-01")], loading: false, error: null, photoLoading: false, photoError: null, onCancel: () => { writes++; return writes === 1 ? first.promise : Promise.resolve({ success: true }); }, renderRequest: (request, onCancel) => jsx("RequestCard", { request, onCancel }) }));
  nodes(render()).find((node) => node.type === "RequestCard").props.onCancel();
  const selected = render();
  assert.equal(nodes(selected).filter((node) => node.type === modalRoot).length, 1, "no nested confirmation modal");
  const confirm = nodes(selected).find((node) => node.type === "Button" && text(node) === "Yes, cancel request");
  const work = confirm.props.onPress();
  await confirm.props.onPress();
  assert.equal(writes, 1);
  render().props.onOpenChange(false);
  assert.deepEqual(closes, []);
  assert.equal(nodes(render()).find((node) => node.type === "CloseTrigger").props.isDisabled, true);
  first.resolve({ success: false, error: "Request already changed." });
  await work;
  assert.ok(notices.includes("Request already changed."));
  const retry = nodes(render()).find((node) => node.type === "Button" && text(node) === "Yes, cancel request");
  assert.ok(retry);
  await retry.props.onPress();
  assert.equal(writes, 2);
  assert.ok(!nodes(render()).some((node) => node.type === "Footer"));
  render().props.onOpenChange(false);
  assert.deepEqual(closes, [false]);
  runtime.unmount();
});
