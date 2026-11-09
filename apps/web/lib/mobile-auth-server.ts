import "server-only";

import { createClient } from "@supabase/supabase-js";

// A Supabase client with no cookies and no stored session, for the mobile auth
// routes: it signs in or verifies a code, and the tokens go back to the phone in
// the JSON response instead of into a browser cookie. It uses the public anon key
// (what the phone itself would use); the service key stays in
// `lib/auth-throttle-server.ts`. Null when the public Supabase settings are missing.
export function createStatelessAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
