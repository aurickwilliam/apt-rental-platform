import { supabase } from "@repo/supabase";

import { finishProfileRoute } from "./finishProfileRoute";
import { getMySuspensionStatus } from "./suspensionService";

// A confirmed email can end up with no profile row when sign-up is interrupted
// after the email code (app closed, network lost, insert refused). Signing in
// would otherwise dead-end, so such accounts continue at "finish your profile".

// A suspended account looks the same under RLS (its profile is hidden), so the
// suspension status is checked first.
export async function isProfileMissing(userId: string): Promise<boolean> {
  const suspension = await getMySuspensionStatus();
  if (suspension.suspended) return false;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  return data === null;
}

// The finish-profile screen creates the profile when none exists. The
// `profileMissing` param adds a way out (sign out) since the screen blocks back.
export function profileMissingRoute(email: string | undefined) {
  return finishProfileRoute({ email: email ?? "", profileMissing: true });
}
