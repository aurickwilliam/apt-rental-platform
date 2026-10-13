// Web password recovery: the "recovery in progress" marker and the routing
// rules the middleware applies while a recovery session exists.
//
// verifyOtp({ type: "recovery" }) creates a full Auth session in the regular
// Supabase cookies. The marker (set before verifying) tells the middleware
// that this session may only be used on the reset page, so an unfinished reset
// is signed out instead of turning into a normal signed-in visit. It is a
// journey guard, not a security boundary: whoever can read the inbox already
// controls the account.
//
// No imports: the web node:test suite loads this file directly.

export const RECOVERY_MARKER_COOKIE = "apt-password-recovery";

// Same lifetime as the @supabase/ssr Auth cookies, so a recovery session can
// never outlast its marker and turn into a normal session. The age limit is
// enforced from the timestamp inside, never by letting the cookie expire.
export const RECOVERY_MARKER_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

// How long a verified recovery may stay unfinished before it counts as abandoned.
export const RECOVERY_SESSION_TTL_MS = 30 * 60 * 1000;

export const RECOVERY_START_PATH = "/forgot-password";
export const RECOVERY_RESET_PATH = "/forgot-password/reset-password";
export const RECOVERY_UPDATED_PATH = "/forgot-password/updated";
const SIGN_IN_PATH = "/sign-in";

export const RECOVERY_MARKER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: RECOVERY_MARKER_MAX_AGE_SECONDS,
} as const;

// Recovery responses carry a live Auth session; never let shared caches keep them.
export const RECOVERY_CACHE_CONTROL = "private, no-store";

export type RecoveryMarkerState = "none" | "active" | "stale";

export function createRecoveryMarkerValue(now: number): string {
  return String(now);
}

export function readRecoveryMarker(value: string | undefined, now: number): RecoveryMarkerState {
  if (value === undefined) return "none";
  if (!/^\d+$/.test(value)) return "stale";
  const startedAt = Number(value);
  const age = now - startedAt;
  if (age < 0 || age > RECOVERY_SESSION_TTL_MS) return "stale";
  return "active";
}

// Anything other than a top-level page load: Next.js router fetches (link
// prefetches and client-side navigations) and browser speculative loads.
// These must never end a recovery, because prefetches happen in the
// background while the user is still resetting. Next.js strips its own router
// headers (`rsc`, `next-router-prefetch`) before the middleware runs, so the
// browser's Sec-Fetch-Dest is the reliable signal. A router fetch answered
// with no content makes Next.js fall back to a full page load, which then
// gets the real decision.
export function isBackgroundRequest(getHeader: (name: string) => string | null): boolean {
  const purpose = getHeader("sec-purpose") ?? getHeader("purpose");
  if (purpose !== null && purpose.includes("prefetch")) return true;
  const destination = getHeader("sec-fetch-dest");
  return destination !== null && destination !== "document";
}

export function isRecoveryPath(pathname: string): boolean {
  return pathname === RECOVERY_START_PATH || pathname.startsWith(`${RECOVERY_START_PATH}/`);
}

export type RecoveryRouteDecision =
  // Not a recovery concern: run the normal middleware rules.
  | { action: "continue" }
  // A recovery session on the reset page: skip the normal rules (they would
  // send a signed-in user away from an auth page).
  | { action: "allow" }
  // Delete the marker, then run the normal middleware rules.
  | { action: "clear_marker" }
  // Answer a background request with no content, without touching the session.
  | { action: "no_content" }
  // Redirect without signing out.
  | { action: "redirect"; to: string; clearMarker: boolean }
  // Sign this browser out, delete the marker, then redirect.
  | { action: "end_session"; to: string };

export interface RecoveryRouteInput {
  marker: RecoveryMarkerState;
  hasUser: boolean;
  pathname: string;
  isBackgroundRequest: boolean;
}

export function recoveryRouteDecision({
  marker,
  hasUser,
  pathname,
  isBackgroundRequest,
}: RecoveryRouteInput): RecoveryRouteDecision {
  const onResetPage = pathname === RECOVERY_RESET_PATH;

  if (marker === "none") {
    return onResetPage
      ? { action: "redirect", to: RECOVERY_START_PATH, clearMarker: false }
      : { action: "continue" };
  }

  const resetInProgress = marker === "active" && hasUser;
  if (resetInProgress && onResetPage) return { action: "allow" };
  if (isBackgroundRequest) return { action: "no_content" };

  if (!hasUser) {
    return onResetPage
      ? { action: "redirect", to: RECOVERY_START_PATH, clearMarker: true }
      : { action: "clear_marker" };
  }

  return {
    action: "end_session",
    to: isRecoveryPath(pathname) ? RECOVERY_START_PATH : SIGN_IN_PATH,
  };
}

// Supabase Auth cookies (`sb-<ref>-auth-token`, plus `.0`, `.1` chunks and the
// PKCE `-code-verifier`). Deleted directly when signOut() cannot clear them.
export function isSupabaseAuthCookie(name: string): boolean {
  return /^sb-.+-auth-token/.test(name);
}
