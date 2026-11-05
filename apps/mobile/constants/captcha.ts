// Cloudflare Turnstile for Supabase Auth's CAPTCHA protection. Both values are
// public: the site key identifies the widget, and the web origin is the
// hostname Turnstile checks against the widget's allowed domains (a WebView has
// no hostname of its own). Unset means the protection is off in this build, so
// the code can ship before it is switched on in Supabase.
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_URL ?? "";

// The key is embedded in the widget page, so only a plain key is accepted.
const SITE_KEY_PATTERN = /^[0-9A-Za-z_-]{8,64}$/;

export const CAPTCHA_SITE_KEY = SITE_KEY_PATTERN.test(SITE_KEY) ? SITE_KEY : "";
export const CAPTCHA_BASE_URL = /^https:\/\/[^\s/]+\/?$/.test(WEB_ORIGIN) ? WEB_ORIGIN : "";
export const CAPTCHA_ENABLED = CAPTCHA_SITE_KEY !== "" && CAPTCHA_BASE_URL !== "";
