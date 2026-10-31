/**
 * `cacheControl` (seconds) for public image uploads whose storage path is unique and
 * never overwritten (timestamp/random/uuid names). Supabase's default is one hour, which
 * makes browsers and the CDN re-download the same photo every hour.
 * Never use it for a path that is replaced in place (e.g. a fixed `{userId}.jpg`).
 */
export const PUBLIC_IMAGE_CACHE_CONTROL = "31536000";
