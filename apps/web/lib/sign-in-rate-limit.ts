// Brute-force protection for the web sign-in server action.
//
// Pure decision logic so the rules stay node-tested (see
// `sign-in-rate-limit.test.mjs`); the action owns one in-memory store — this
// app runs on a single Next server process, and Supabase Auth keeps its own
// platform-level limits as the backstop. Failures are counted in a fixed
// window per normalized email AND per client IP, so rotating e-mail addresses
// against one address still trips the IP counter, while a shared office IP
// attacking one mailbox cannot wedge other users out of that IP forever.
//
// Blocked attempts return a generic message and never call Supabase, and the
// wording never depends on whether the account exists.

export const SIGN_IN_MAX_FAILURES = 5;

/** One failure window. With this locked, added failures stay inside the SAME window. */
export const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Deliberately identical for "account exists, password wrong" and "no such
 * account" — both are refused the same way while the window holds.
 */
export const SIGN_IN_THROTTLE_MESSAGE =
  "Too many sign-in attempts. Please try again in a few minutes.";

export interface SignInFailureWindow {
  failures: number;
  /** ms epoch of the first failure in this window. */
  windowStartedAt: number;
}

export type SignInBuckets = Map<string, SignInFailureWindow>;

export interface SignInThrottleDecision {
  blocked: boolean;
  /** Seconds until the current window releases; 0 when not blocked. */
  retryAfterSeconds: number;
}

/** One bucket: "email:<normalized>" or "ip:<client ip>". */
export function signInEmailKey(email: string): string {
  return `email:${normalizeSignInEmail(email)}`;
}

export function signInIpKey(ip: string): string {
  return `ip:${ip}`;
}

export function normalizeSignInEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Client IP for rate limiting, not attribution: the first hop of
 * `x-forwarded-for` (the visitor) with `x-real-ip` as a fallback. Empty when
 * neither is present — callers skip the IP bucket entirely rather than smear
 * failures over one shared key.
 */
export function clientIpFromHeaders(headers: Record<
  "x-forwarded-for" | "x-real-ip",
  string | string[] | null | undefined
>): string {
  const forwarded = firstKnownIp(headers["x-forwarded-for"]);
  if (forwarded) return forwarded;
  return firstKnownIp(headers["x-real-ip"]) ?? "";
}

function firstKnownIp(value: string | string[] | null | undefined): string | null {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  const candidate = entries[0]?.split(",")[0]?.trim();
  // Basic shape: up to four IPv4 octets or a colon-bearing IPv6. Garbage never
  // reaches Supabase either way — it only shapes the local key — so this is a
  // sanity filter, not validation.
  return candidate && /^[\w:.%[\]]{1,45}$/.test(candidate) ? candidate : null;
}

export function isSignInBlocked(
  buckets: SignInBuckets,
  key: string,
  now: number
): SignInThrottleDecision {
  const failures = buckets.get(key);
  if (!failures) return { blocked: false, retryAfterSeconds: 0 };

  const windowEndedAt = failures.windowStartedAt + SIGN_IN_WINDOW_MS;
  if (now >= windowEndedAt) return { blocked: false, retryAfterSeconds: 0 };
  if (failures.failures < SIGN_IN_MAX_FAILURES) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.ceil((windowEndedAt - now) / 1000),
  };
}

/**
 * Records one failed password attempt. A window that has already released
 * starts a fresh one from `now`; an open window tallies the failure into its
 * existing count, so `SIGN_IN_MAX_FAILURES` asks the visitor to wait out the
 * FIRST failure's window.
 */
export function recordSignInFailure(
  buckets: SignInBuckets,
  key: string,
  now: number
): void {
  const failures = buckets.get(key);
  if (!failures || now >= failures.windowStartedAt + SIGN_IN_WINDOW_MS) {
    buckets.set(key, { failures: 1, windowStartedAt: now });
    return;
  }
  failures.failures += 1;
}

export function clearSignInFailures(buckets: SignInBuckets, key: string): void {
  buckets.delete(key);
}

/**
 * Drops every window older than its whole lifetime plus the following window
 * (guarding a just-released key from being re-created), then — if retries
 * flooded memory — trims to `maxEntries`, Discarding oldest-inserted keys
 * first, so live keys outlast garbage.
 */
export function pruneSignInBuckets(
  buckets: SignInBuckets,
  now: number,
  maxEntries = 5_000
): void {
  const lifetimeMs = SIGN_IN_WINDOW_MS * 2;
  for (const [key, failures] of buckets) {
    if (now >= failures.windowStartedAt + lifetimeMs) buckets.delete(key);
  }
  for (const [key] of buckets) {
    if (buckets.size <= maxEntries) break;
    buckets.delete(key);
  }
}
