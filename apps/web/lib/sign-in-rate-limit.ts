// Helpers for the web sign-in brute-force guard. The failure windows
// themselves live in the database (`auth_throttle`, shared by every server
// instance and by mobile); see `@repo/utils` authThrottle.ts.

export const SIGN_IN_THROTTLE_MESSAGE =
  "Too many sign-in attempts. Please try again in a few minutes.";

/**
 * Client IP for rate limiting, not attribution: the first hop of
 * `x-forwarded-for` with `x-real-ip` as a fallback. Empty when neither is
 * present, and the IP bucket is then skipped. A proxy that does not overwrite
 * `x-forwarded-for` lets a caller pick this value, which is why the per-email
 * window (not spoofable) is the protection for a targeted account and the IP
 * window only slows password spraying.
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
  return candidate && /^[\w:.%[\]]{1,45}$/.test(candidate) ? candidate : null;
}
