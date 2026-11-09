export function status() { return sessionStorage.getItem("fixtureStatus") || "unverified"; }
export async function getVerificationPageState() {
  return { signedIn: true, accountStatus: status(), hasPending: sessionStorage.getItem("fixturePending") === "true" };
}
export async function createVerificationSession() {
  window.fixtureSessions = (window.fixtureSessions || 0) + 1;
  if (sessionStorage.getItem("fixtureSessionError")) throw new Error("Fixture request failure");
  return { ok: true, token: "a".repeat(43), expiresAt: new Date(Date.now() + 600000).toISOString() };
}
export async function claimVerificationSession(token) {
  window.fixtureClaims = [...(window.fixtureClaims || []), token];
  return { ok: true, userId: "fixture-user", verificationId: "fixture-verification", expiresAt: sessionStorage.getItem("fixtureExpiresAt") || new Date(Date.now() + 600000).toISOString() };
}
export async function submitVerificationSession() {
  if (!window.fixtureAllowSubmission) throw new Error("Fixture must not submit verification");
  window.fixtureSubmissions = (window.fixtureSubmissions || 0) + 1;
  return { ok: true };
}
export function createClient() {
  if (!window.fixtureAllowSubmission) throw new Error("No hosted writes in browser fixture");
  return { storage: { from: bucket => {
    if (bucket !== "user-verification") throw new Error("Unexpected fixture bucket");
    return {
      upload: async (path, blob) => {
        window.fixtureUploads = [...(window.fixtureUploads || []), { path, size: blob.size, type: blob.type }];
        return { error: null };
      },
      remove: async () => ({ error: null }),
    };
  } } };
}
export const createBrowserClient = createClient;
export async function submitDesktopVerification() { throw new Error("Fixture must not submit verification"); }
export async function getVerificationSessionStatus() { return { ok: true, status: "pending" }; }
export function useApplicationReadiness() {
  return {
    loading: false, error: null, isReady: false, isPassportIncomplete: true,
    issues: [{ code: "unverified", message: "Verify your identity before applying." }],
  };
}
export default function OutOfScopeChild() { return <p>Fixture desktop wizard / application guidelines</p>; }
export function formatPesoDisplay(value) { return `PHP ${value}`; }
