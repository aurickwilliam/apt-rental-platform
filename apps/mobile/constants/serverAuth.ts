// The web app's origin, where the mobile auth routes live (/api/auth/mobile/*):
// password sign-in and one-time-code checks go through them so the server counts
// every attempt (the same database windows as the website). The same public value
// the CAPTCHA widget uses. Unset or malformed means this build talks to Supabase
// directly (local development), with no server-side counting.
const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_URL ?? "";

// Production builds need https; development may use a plain-http LAN address.
const ORIGIN_PATTERN = __DEV__ ? /^https?:\/\/[^\s/]+\/?$/ : /^https:\/\/[^\s/]+\/?$/;

export const SERVER_AUTH_BASE_URL = ORIGIN_PATTERN.test(WEB_ORIGIN) ? WEB_ORIGIN.replace(/\/$/, "") : "";
