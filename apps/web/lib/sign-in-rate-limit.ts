// Helpers for the web sign-in brute-force guard. The failure windows
// themselves live in the database (`auth_throttle`, shared by every server
// instance and by mobile); see `@repo/utils` authThrottle.ts.

export const SIGN_IN_THROTTLE_MESSAGE =
  "Too many sign-in attempts. Please try again in a few minutes.";

/**
 * Client IP for rate limiting, not attribution. Prefers the headers the hosting
 * platform sets itself (`x-vercel-forwarded-for`, then `x-real-ip`), which a
 * caller cannot override there, and only then the first hop of
 * `x-forwarded-for`. Empty when none is present, and the IP buckets are then
 * skipped. Off the platform (local dev, a proxy that forwards these headers
 * untouched) a caller can still pick the value, which is why the per-email
 * hourly ceiling (it never reads the IP) is the protection for a targeted
 * account and the IP windows only slow password spraying.
 */
export function clientIpFromHeaders(headers: Partial<Record<
  "x-vercel-forwarded-for" | "x-real-ip" | "x-forwarded-for",
  string | string[] | null | undefined
>>): string {
  return (
    firstKnownIp(headers["x-vercel-forwarded-for"]) ??
    firstKnownIp(headers["x-real-ip"]) ??
    firstKnownIp(headers["x-forwarded-for"]) ??
    ""
  );
}

function firstKnownIp(value: string | string[] | null | undefined): string | null {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  const candidate = entries[0]?.split(",")[0]?.trim();
  return candidate && /^[\w:.%[\]]{1,45}$/.test(candidate) ? candidate : null;
}
