import { cookies } from "next/headers";

import { createClient } from "@repo/supabase/server";
import { readRecoveryMarker, RECOVERY_MARKER_COOKIE } from "@repo/supabase/password-recovery";

// The reset page is usable only with the session and marker a verified
// recovery code created (the middleware enforces the same rule).
export async function hasActiveRecoverySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const marker = readRecoveryMarker(cookieStore.get(RECOVERY_MARKER_COOKIE)?.value, Date.now());
  if (marker !== "active") return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user !== null;
}
