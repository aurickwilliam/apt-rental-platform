import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { AuthThrottleClient } from "@repo/utils";

// The brute-force counters can only be written with the service role
// (`public.auth_throttle_server`, 20261106130000_lock_down_auth_throttle.sql),
// so every web server action that records or clears a failure goes through this
// client. It is server-only: SUPABASE_SERVICE_ROLE_KEY is never a NEXT_PUBLIC_
// value and must never reach the browser, a log or a URL. It is used for the
// throttle RPCs and nothing else.
//
// Without the key the throttle fails open, like any other outage: sign-in and
// code checks still work and Supabase Auth's own limits and CAPTCHA still apply,
// but nothing is counted. Each throttle call logs "Auth throttle unavailable"
// (action and purpose, never the email or IP), so alert on that message.

let client: AuthThrottleClient | null = null;
let missingKeyLogged = false;

const unavailable: AuthThrottleClient = {
  rpc: async () => ({ data: null, error: { code: "service_key_missing" } }),
};

export function getAuthThrottleClient(): AuthThrottleClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    if (!missingKeyLogged) {
      missingKeyLogged = true;
      console.error("Auth throttle disabled: SUPABASE_SERVICE_ROLE_KEY or the Supabase URL is not set.");
    }
    return unavailable;
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) as unknown as AuthThrottleClient;
  return client;
}
