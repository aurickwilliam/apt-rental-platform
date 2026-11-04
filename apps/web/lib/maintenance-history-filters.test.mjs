import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import * as filters from "../../../packages/utils/src/maintenanceHistoryFilters.ts";

const jsx = (type, props) => ({ type, props });
const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
const text = (node) => typeof node === "string" ? node : !node || typeof node !== "object" ? "" : [node.props?.children].flat(Infinity).map(text).join(" ");

test("HeroUI history filter drafts apply explicitly, reset, and reseed on reopening", () => {
  const runtime = hookRuntime();
  let applied = filters.emptyHistoryFilters();
  let writes = 0;
  const Filters = compile("app/tenant/maintenance/components/MaintenanceHistoryFilters.tsx", {
    react: runtime.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Popover: Object.assign(() => {}, { Content: "Content", Dialog: "Dialog" }) },
    "@tabler/icons-react": { IconFilter2: "IconFilter2" },
    "@repo/utils/maintenance-history": filters,
    "@/app/components/settings/SettingsSelect": { default: "SettingsSelect" },
    "@/app/components/settings/SettingsMultiSelect": { default: "SettingsMultiSelect" },
    "../data/maintenance-data": { CATEGORIES: [{ id: "appliances", label: "Appliances" }] },
  }).default;
  const render = () => runtime.render(() => Filters({ filters: applied, disabled: false, onApply: (next) => { applied = next; writes++; } }));
  let tree = render();
  assert.ok(nodes(tree).some((node) => node.type === "IconFilter2"));
  tree.props.onOpenChange(true);
  tree = render();
  nodes(tree).find((node) => node.props?.["aria-label"] === "Status: Cancelled").props.onPress();
  tree = render();
  nodes(tree).find((node) => node.type === "SettingsMultiSelect").props.onChange(["appliances"]);
  nodes(tree).find((node) => node.type === "SettingsSelect").props.onChange("week");
  assert.equal(writes, 0);
  tree = render();
  nodes(tree).find((node) => node.type === "Button" && text(node).trim() === "Apply filters").props.onPress();
  assert.equal(writes, 1);
  assert.deepEqual({ ...applied, statuses: Array.from(applied.statuses), categories: Array.from(applied.categories), urgencies: Array.from(applied.urgencies) }, { statuses: ["Cancelled"], categories: ["appliances"], urgencies: [], reportedDate: "week" });
  tree = render();
  assert.equal(tree.props.isOpen, false);
  tree.props.onOpenChange(true);
  tree = render();
  nodes(tree).find((node) => node.type === "Button" && text(node).trim() === "Reset").props.onPress();
  assert.equal(writes, 1, "Reset changes the draft only");
  tree = render();
  tree.props.onOpenChange(false);
  tree = render();
  tree.props.onOpenChange(true);
  tree = render();
  assert.equal(nodes(tree).find((node) => node.props?.["aria-label"] === "Status: Cancelled").props["aria-pressed"], true, "discarded reset reseeds the applied selections");
  nodes(tree).find((node) => node.type === "Button" && text(node).trim() === "Reset").props.onPress();
  tree = render();
  nodes(tree).find((node) => node.type === "Button" && text(node).trim() === "Apply filters").props.onPress();
  assert.equal(filters.historyFilterCount(applied), 0);
});

test("shared filtering composes dimensions and respects Manila day boundaries", () => {
  const rows = [
    { status: "Resolved", urgency: "high", category: "appliances", created_at: "2026-10-28T15:59:59Z" },
    { status: "Cancelled", urgency: "high", category: "appliances", created_at: "2026-10-28T16:00:00Z" },
    { status: "Resolved", urgency: "low", category: "appliances", created_at: "2026-11-04T00:00:00Z" },
    { status: "Pending", urgency: "high", category: "appliances", created_at: "2026-11-04T00:00:00Z" },
  ];
  const selected = { ...filters.emptyHistoryFilters(), urgencies: ["high"], categories: ["appliances"], reportedDate: "week" };
  assert.deepEqual(filters.filterMaintenanceHistory(rows, selected, Date.parse("2026-11-04T08:00:00Z")), [rows[1]]);
});
