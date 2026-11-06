import assert from "node:assert/strict";
import test from "node:test";
import { compile, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";
import * as preferences from "./tenant-preferences.ts";

const jsx = (type, props) => ({ type, props: props ?? {} });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : !node || typeof node !== "object" ? [] : [node, ...nodes(node.props.children)];
const icons = new Proxy({}, { get: (_, key) => key });
const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));

function formHook(action) {
  const runtime = hookRuntime();
  let refreshes = 0, notifications = 0;
  const { useRentalPreferencesForm } = compile("hooks/use-rental-preferences-form.ts", {
    react: runtime.react,
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@heroui/react": { toast: { success() {}, danger() {} } }, "@repo/utils": {},
    "@/lib/tenant-preferences": preferences,
    "@/app/(onboarding)/tenant/personalize/actions": { saveTenantPreferences: action },
    "./use-user": { notifyPreferencesSaved: () => notifications++ },
  });
  return { read: () => runtime.render(() => useRentalPreferencesForm(preferences.DEFAULT_TENANT_PREFERENCES)), counts: () => ({ refreshes, notifications }) };
}

test("duplicate saves before a repaint share a synchronous submission lock, which releases on failure and success", async () => {
  let calls = 0;
  let pending = deferred();
  const { read, counts } = formHook(async () => { calls++; return pending.promise; });
  read().setCities(["Navotas"]);
  const sameRender = read();
  const first = sameRender.save();
  assert.equal(await sameRender.save(), false);
  assert.equal(calls, 1);
  assert.equal(read().isSaving, true);
  pending.resolve({ ok: false, error: "Write refused" });
  assert.equal(await first, false);
  assert.equal(read().isSaving, false);
  assert.equal(read().isDirty, true);
  assert.equal(read().saveError, "Write refused");
  assert.equal(read().selectedCities[0], "Navotas");
  assert.deepEqual(counts(), { refreshes: 0, notifications: 0 });
  pending = deferred();
  const retry = read().save();
  pending.resolve({ ok: true });
  assert.equal(await retry, true);
  assert.equal(calls, 2);
  assert.equal(read().isSaving, false);
  assert.equal(read().isDirty, false);
  assert.deepEqual(counts(), { refreshes: 1, notifications: 1 });
});

test("thrown writes and validation failures retain the draft and never leave the Save button loading", async () => {
  let calls = 0;
  const { read, counts } = formHook(async () => { calls++; throw new Error("Network unavailable"); });
  read().setCities(["Navotas"]);
  assert.equal(await read().save(), false);
  assert.equal(read().isSaving, false);
  assert.equal(read().isDirty, true);
  assert.match(read().saveError, /Couldn't save your preferences/);
  read().setBudgetRange(20000, 10000);
  assert.equal(await read().save(), false);
  assert.equal(calls, 1, "invalid budgets never reach the action");
  assert.equal(read().isSaving, false);
  assert.match(read().saveError, /budget range/);
  assert.deepEqual(counts(), { refreshes: 0, notifications: 0 });
});

test("a committed budget from the submit event wins over the previous render without changing preset boundaries", async () => {
  let submitted;
  const { read } = formHook(async value => { submitted = value; return { ok: true }; });
  const oldRender = read();
  oldRender.setBudgetRange(5000, 14999);
  assert.equal(await oldRender.save({ budgetMin: 5000, budgetMax: 14999 }), true);
  assert.equal(submitted.budgetMax, 14999);
  assert.equal(read().budgetMax, 14999);
  assert.equal(read().isDirty, false);
});

test("the action requires its own returned updated row, not merely an error-free zero-row response", async () => {
  let response = { data: null, error: null };
  let reads = 0;
  const { saveTenantPreferences } = compile("app/(onboarding)/tenant/personalize/actions.ts", {
    "@/lib/tenant-preferences": preferences,
    "@repo/constants": { CAMANAVA_CITIES: ["Navotas"], PETS: [], VEHICLE_OPTIONS: [] },
    "@repo/supabase/server": { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: "auth-a" } } }) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "profile-a", roles: ["tenant"] } }) }) }),
        update: () => ({ eq: (column, id) => {
          assert.equal(column, "user_id"); assert.equal(id, "auth-a");
          return { select: columns => { assert.equal(columns, "id"); return { maybeSingle: async () => { reads++; return response; } }; } };
        } }),
      }),
    }) },
  });
  const saved = { ...preferences.DEFAULT_TENANT_PREFERENCES, selectedCities: ["Navotas"] };
  assert.equal((await saveTenantPreferences(saved)).ok, false);
  response = { data: { id: "other-account" }, error: null };
  assert.equal((await saveTenantPreferences(saved)).ok, false);
  response = { data: null, error: { message: "Refused" } };
  assert.equal((await saveTenantPreferences(saved)).ok, false);
  response = { data: { id: "profile-a" }, error: null };
  assert.equal((await saveTenantPreferences(saved)).ok, true);
  assert.equal(reads, 4);
});

test("Settings closes directly on confirmed save, even before its previous dirty/saving render settles", () => {
  const runtime = hookRuntime();
  let closed = 0;
  const form = { isSaving: true, isDirty: true, reset() {} };
  const Modal = compound("Modal", ["Backdrop", "Container", "Dialog", "CloseTrigger", "Header", "Heading", "Body"]);
  const AlertDialog = compound("AlertDialog", ["Backdrop", "Container", "Dialog", "Header", "Heading", "Body", "Footer"]);
  const deps = {
    react: runtime.react, "react/jsx-runtime": jsxRuntime,
    "next/navigation": { usePathname: () => "/tenant/browse" },
    "@tabler/icons-react": icons, "@heroui/react": { Modal, AlertDialog, Button: "Button" },
    "@/hooks/use-user": { useUser: () => ({ profile: { roles: ["tenant"] }, loading: false }) },
    "@/hooks/use-rental-preferences-form": { useRentalPreferencesForm: () => form },
  };
  for (const tab of ["General", "Security", "LanguageRegion", "Notifications", "Help", "RentalPreferences", "PaymentMethods"]) deps[`./tabs/${tab}Tab`] = { default: `${tab}Tab` };
  const Settings = compile("app/components/settings/SettingsModal.tsx", deps).default;
  const read = () => runtime.render(() => nodes(Settings({ open: true, onClose: () => closed++ })));
  const general = read();
  assert.equal(general.find(node => node.type === "section").props.className, "mr-1.5 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5", "other Settings tabs keep their existing scroll/padding layout");
  general.find(node => node.type === "Button" && node.props.children[1] === "Rental Preferences").props.onClick();
  const tree = read();
  assert.match(tree.find(node => node.type === "section").props.className, /overflow-hidden/);
  assert.equal(tree.find(node => node.type === "Modal.CloseTrigger").props.isDisabled, true);
  tree.find(node => node.type === Modal).props.onOpenChange(false);
  assert.equal(closed, 0, "pending dismissal is guarded");
  tree.find(node => node.type === "RentalPreferencesTab").props.onSaved();
  assert.equal(closed, 1, "successful save does not re-enter the pending/unsaved guard");
  form.isSaving = false;
  assert.equal(read().find(node => node.type === "Modal.CloseTrigger").props.isDisabled, false);
});

test("the Rental Preferences tab closes only for a successful save and keeps its footer outside the scroll area", async () => {
  let closes = 0, calls = 0, committed = true, saved = false, received;
  const form = {
    ...preferences.DEFAULT_TENANT_PREFERENCES, isDirty: true, isSaving: false, saveError: null,
    async save(budget) { calls++; received = budget; return saved; },
    setSaveError(error) { form.saveError = error; },
  };
  const Tab = compile("app/components/settings/tabs/RentalPreferencesTab.tsx", {
    react: { useRef: () => ({ current: { commit: callback => { if (committed) callback(5000, 14999); return committed; } } }) },
    "react/jsx-runtime": jsxRuntime, "@tabler/icons-react": icons,
    "@heroui/react": { Button: "Button", Checkbox: compound("Checkbox", ["Content", "Control", "Indicator"]), CheckboxGroup: "CheckboxGroup", Input: "Input", Label: "Label" },
    "@repo/constants": { CAMANAVA_CITIES: ["Navotas"], OTHER_PET: "Other", PETS: ["Cat"], VEHICLE_OPTIONS: ["Car"] },
    "@/lib/tenant-preferences": preferences,
    "@/app/components/preferences/BudgetRangeField": { default: "Budget" },
    "../SettingsMultiSelect": { default: "MultiSelect" }, "../SettingsSelect": { default: "Select" }, "../ToggleSwitch": { default: "Switch" },
  }).default;
  const read = () => Tab({ form, onSaved: () => closes++ });
  const press = () => nodes(read()).find(node => node.type === "Button").props.onPress();
  const root = read();
  assert.equal(root.props.children[0].props["data-settings-preferences-scroll"], true);
  assert.equal(root.props.children[1].props["data-settings-save-footer"], true);
  assert.ok(!nodes(root.props.children[0]).some(node => node.props["data-settings-save-footer"]));
  assert.match(root.props.children[1].props.className, /shrink-0/);
  press(); await settle();
  assert.equal(closes, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(received)), { budgetMin: 5000, budgetMax: 14999 });
  saved = true;
  press(); await settle();
  assert.equal(closes, 1);
  committed = false;
  press(); await settle();
  assert.equal(calls, 2, "invalid draft budgets never submit");
  assert.equal(closes, 1);
  assert.match(form.saveError, /valid budget amount/);
  assert.ok(nodes(read().props.children[1]).some(node => node.props.role === "alert"), "submit validation is visible in the fixed footer");
});
