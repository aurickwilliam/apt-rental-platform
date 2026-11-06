import assert from "node:assert/strict";
import test from "node:test";
import { RequestCache } from "./profile-request-cache.ts";
import { compile, hookRuntime, settle } from "./test-support/hook-runtime.mjs";
import * as preferences from "./tenant-preferences.ts";

test("saved-preference notifications reload all profile consumers through one account-keyed request", async () => {
  let activeRuntime;
  let authId = "account-a";
  let saved = { selectedCities: ["Caloocan"] };
  let reads = 0;
  let profileReads = 0;
  const subscriptions = new Set();
  const supabase = {
    auth: {
      getSession: async () => ({ data: { session: authId ? { user: { id: authId } } : null } }),
      getUser: async () => { reads++; return { data: { user: authId ? { id: authId } : null } }; },
      onAuthStateChange: fn => { subscriptions.add(fn); return { data: { subscription: { unsubscribe: () => subscriptions.delete(fn) } } }; },
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => {
      profileReads++;
      return { data: { id: authId, roles: ["tenant"], preferences: saved } };
    } }) }) }),
  };
  const window = new EventTarget();
  const { useUser, notifyPreferencesSaved } = compile("hooks/use-user.ts", {
    react: new Proxy({}, { get: (_, name) => (...args) => activeRuntime.react[name](...args) }),
    "@repo/supabase/browser": { createClient: () => supabase },
    "@/app/components/profile/use-profile-photo": { PROFILE_PHOTO_UPDATED_EVENT: "photo" },
    "@/lib/profile-request-cache": { RequestCache },
  }, { window, Event });
  const first = hookRuntime();
  const second = hookRuntime();
  const read = runtime => { activeRuntime = runtime; return runtime.render(useUser); };
  read(first); first.flush();
  read(second); second.flush();
  await settle();
  assert.equal(reads, 1);
  assert.equal(profileReads, 1);
  assert.equal(read(first).profile.preferences.selectedCities[0], "Caloocan");
  saved = { selectedCities: ["Malabon"] };
  notifyPreferencesSaved();
  await settle();
  assert.equal(reads, 2, "the notification invalidates once, not once per consumer");
  assert.equal(profileReads, 2);
  for (const runtime of [first, second]) assert.equal(read(runtime).profile.preferences.selectedCities[0], "Malabon");
  authId = null;
  for (const fn of subscriptions) fn("SIGNED_OUT", null);
  for (const runtime of [first, second]) assert.equal(read(runtime).profile, null);
  authId = "account-b";
  saved = null;
  for (const fn of subscriptions) fn("SIGNED_IN", { user: { id: authId } });
  await settle();
  for (const runtime of [first, second]) {
    const value = read(runtime);
    assert.equal(value.user.id, "account-b");
    assert.equal(value.profile.preferences, null, "the next account never inherits the previous tenant's preferences");
    runtime.unmount();
  }
  const before = reads;
  notifyPreferencesSaved();
  await settle();
  assert.equal(reads, before, "unmounted consumers remove the listener");
});

test("only a confirmed preference save notifies profile consumers and refreshes recommendation rows", async () => {
  const runtime = hookRuntime();
  let result = { ok: true };
  let notifications = 0;
  let refreshes = 0;
  const { useRentalPreferencesForm } = compile("hooks/use-rental-preferences-form.ts", {
    react: runtime.react,
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "@heroui/react": { toast: { success() {}, danger() {} } },
    "@repo/utils": {},
    "@/lib/tenant-preferences": preferences,
    "@/app/(onboarding)/tenant/personalize/actions": { saveTenantPreferences: async () => result },
    "./use-user": { notifyPreferencesSaved: () => notifications++ },
  });
  const read = () => runtime.render(() => useRentalPreferencesForm(preferences.DEFAULT_TENANT_PREFERENCES));
  assert.equal(await read().save(), true);
  assert.equal(notifications, 1);
  assert.equal(refreshes, 1);
  result = { ok: false, error: "Not saved" };
  assert.equal(await read().save(), false);
  assert.equal(notifications, 1, "failed saves never publish draft preferences");
  assert.equal(refreshes, 1);
});
