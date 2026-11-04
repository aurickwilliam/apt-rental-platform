import assert from "node:assert/strict";
import test from "node:test";
import { compile, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";

const rules = compile("lib/property-listing-visibility.ts", {});
const jsx = (type, props) => ({ type, props });
const Modal = Object.assign(() => {}, Object.fromEntries(
  ["Backdrop", "Container", "Dialog", "Header", "Heading", "Body", "Footer"].map(name => [name, `Modal.${name}`]),
));
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");
const buttons = tree => nodes(tree).filter(node => node.type === "Button");
const backdrop = tree => nodes(tree).find(node => node.type === "Modal.Backdrop");

function harness(write = async () => ({ success: true, status: "under_maintenance" }), initial = {}) {
  const runtime = hookRuntime();
  const calls = { writes: [], changed: [], toasts: [] };
  let props = { apartmentId: "unit", status: "available", hasActiveTenancy: false, ...initial };
  const { default: Action } = compile("app/landlord/properties/[apartmentId]/components/PropertyVisibilityAction.tsx", {
    react: runtime.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", Modal, toast: { success: (...args) => calls.toasts.push(args) } },
    "@tabler/icons-react": { IconEye: "Eye", IconEyeOff: "EyeOff" },
    "@repo/supabase/browser": { createClient: () => "client" },
    "@/app/components/display/ErrorBanner": { default: "ErrorBanner" },
    "@/lib/property-listing-visibility": rules,
    "@/service/propertyVisibilityService": { changePropertyVisibility: (...args) => { calls.writes.push(args); return write(...args); } },
  });
  const render = () => {
    const tree = runtime.render(() => Action({ ...props, onStatusChanged: status => {
      calls.changed.push(status);
      props = { ...props, status };
    } }));
    runtime.flush();
    return tree;
  };
  return { render, calls, unmount: runtime.unmount };
}

test("Hide Listing asks first; Cancel performs no write and keeps the property unchanged", () => {
  const ui = harness();
  assert.equal(backdrop(ui.render()).props.isOpen, false);
  buttons(ui.render())[0].props.onPress();
  let tree = ui.render();
  assert.equal(backdrop(tree).props.isOpen, true);
  assert.match(text(tree), /will not be deleted/);
  assert.equal(ui.calls.writes.length, 0);
  buttons(tree)[1].props.onPress();
  tree = ui.render();
  assert.equal(backdrop(tree).props.isOpen, false);
  assert.equal(ui.calls.changed.length, 0);
});

test("pending confirmation locks dismissal and duplicate writes; success changes the action to Show Listing", async () => {
  const pending = deferred();
  const ui = harness(() => pending.promise);
  buttons(ui.render())[0].props.onPress();
  const confirm = buttons(ui.render()).at(-1);
  confirm.props.onPress();
  confirm.props.onPress();
  let tree = ui.render();
  assert.equal(ui.calls.writes.length, 1);
  assert.equal(backdrop(tree).props.isDismissable, false);
  assert.equal(backdrop(tree).props.isKeyboardDismissDisabled, true);
  assert.equal(buttons(tree)[1].props.isDisabled, true);
  assert.equal(buttons(tree).at(-1).props.isPending, true);
  backdrop(tree).props.onOpenChange(false);
  assert.equal(backdrop(ui.render()).props.isOpen, true);
  pending.resolve({ success: true, status: "under_maintenance" });
  await settle();
  tree = ui.render();
  assert.equal(backdrop(tree).props.isOpen, false);
  assert.equal(text(buttons(tree)[0]), "Show Listing");
  assert.deepEqual(ui.calls.changed, ["under_maintenance"]);
});

test("Show Listing explains that admin restrictions remain and restores availability", async () => {
  const ui = harness(async () => ({ success: true, status: "available" }), { status: "under_maintenance" });
  buttons(ui.render())[0].props.onPress();
  const tree = ui.render();
  assert.match(text(tree), /administrator restriction will still apply/);
  buttons(tree).at(-1).props.onPress();
  await settle();
  assert.equal(text(buttons(ui.render())[0]), "Hide Listing");
  assert.deepEqual(ui.calls.changed, ["available"]);
});

test("database refusal stays inline and retryable, with no success toast or status change", async () => {
  const ui = harness(async () => ({ success: false, error: "This property has an active tenancy." }));
  buttons(ui.render())[0].props.onPress();
  buttons(ui.render()).at(-1).props.onPress();
  await settle();
  const tree = ui.render();
  assert.equal(backdrop(tree).props.isOpen, true);
  assert.equal(nodes(tree).find(node => node.type === "ErrorBanner").props.message, "This property has an active tenancy.");
  assert.equal(buttons(tree).at(-1).props.isPending, false);
  assert.equal(ui.calls.changed.length, 0);
  assert.equal(ui.calls.toasts.length, 0);
});

test("occupied properties, drifted active tenancies and unverified listings have no action", () => {
  for (const initial of [{ status: "occupied" }, { hasActiveTenancy: true }, { status: "unverified" }]) {
    assert.equal(harness(undefined, initial).render(), null);
  }
});

test("a response after leaving the property cannot update its presentation or show a toast", async () => {
  const pending = deferred();
  const ui = harness(() => pending.promise);
  buttons(ui.render())[0].props.onPress();
  buttons(ui.render()).at(-1).props.onPress();
  ui.unmount();
  pending.resolve({ success: true, status: "under_maintenance" });
  await settle();
  assert.equal(ui.calls.changed.length, 0);
  assert.equal(ui.calls.toasts.length, 0);
});
