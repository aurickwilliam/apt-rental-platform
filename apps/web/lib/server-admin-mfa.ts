import "server-only";

import { cache } from "react";
import { createClient } from "@repo/supabase/server";
import { toAssuranceLevel, type AssuranceLevel } from "./admin-mfa";

export interface AdminMfaState {
  currentLevel: AssuranceLevel;
  hasVerifiedFactor: boolean;
}

/**
 * React request-local only. The level comes from the verified token claims
 * (never the unverified session cookie). A failed read counts as the basic
 * level, so it can only ask for a code, never skip one.
 */
export const getAdminMfaState = cache(async (): Promise<AdminMfaState> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const currentLevel = toAssuranceLevel(claimsData?.claims?.aal);
  // aal2 can only be reached through a verified factor.
  if (currentLevel === "aal2") return { currentLevel, hasVerifiedFactor: true };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  return { currentLevel, hasVerifiedFactor: (factors?.totp.length ?? 0) > 0 };
});
