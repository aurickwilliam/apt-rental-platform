export function usePathname() { return "/tenant/browse"; }
export function useUser() { return { profile: { roles: ["tenant"], preferences: {} }, loading: false }; }
export function useRentalPreferencesForm() { return { isSaving: false, isDirty: false, reset() {} }; }
export default function UnusedLink({ children }) { return children; }
