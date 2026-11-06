import { useState, useSyncExternalStore } from "react";
import { DEFAULT_TENANT_PREFERENCES } from "../../lib/tenant-preferences";

export const state = {
  persisted: { ...DEFAULT_TENANT_PREFERENCES, selectedCities: ["Navotas"], budgetMax: 14999, bedroomCount: "1-2 Bedrooms" },
  mode: "success", saves: 0, notifications: 0, refreshes: 0, revision: 0, listeners: new Set(), release: null,
};
let profile = { id: "profile-fixture", roles: ["tenant"], preferences: state.persisted };
function publish() { state.revision++; state.listeners.forEach(fn => fn()); }
export function useFixtureRevision() { useSyncExternalStore(fn => { state.listeners.add(fn); return () => state.listeners.delete(fn); }, () => state.revision); }
export function useUser() { useFixtureRevision(); return { user: { id: "auth-fixture" }, profile, loading: false }; }
export function notifyPreferencesSaved() {
  state.notifications++;
  profile = { ...profile, preferences: structuredClone(state.persisted) };
  publish();
}
export const usePathname = () => "/tenant/browse";
export const useRouter = () => ({ refresh() { state.refreshes++; publish(); } });
export function useTheme() { const [theme, setTheme] = useState("light"); return { theme, setTheme }; }
export async function createClient() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "auth-fixture" } } }) },
    from(table) {
      if (table !== "users") throw new Error("Unexpected fixture table");
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "profile-fixture", roles: ["tenant"] }, error: null }) }) }),
        update(payload) {
          const finish = async () => {
            state.saves++; publish();
            if (state.mode === "pending") await new Promise(resolve => { state.release = resolve; });
            if (state.mode === "throw") throw new Error("Fixture network failure");
            if (state.mode === "error") return { data: null, error: { message: "Fixture write refused" } };
            if (state.mode === "zero") return { data: null, error: null };
            state.persisted = structuredClone(payload.preferences); publish();
            return { data: { id: "profile-fixture" }, error: null };
          };
          return { eq: () => ({ then: (resolve, reject) => finish().then(resolve, reject), select: () => ({ maybeSingle: finish }) }) };
        },
      };
    },
  };
}
window.settingsFixture = state;
