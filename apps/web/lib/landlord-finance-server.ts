import { cache } from "react";
import { redirect } from "next/navigation";

import { getServerIdentity } from "@/lib/server-identity";

import { landlordFinanceAccessRedirect } from "@/lib/landlord-finance-access";

export interface LandlordFinanceViewer {
  /** Auth id — the JWT subject the finance RPCs see. */
  authUserId: string;
  /** Internal `public.users.id` — the owner every finance read scopes to. */
  ownerId: string;
}

/**
 * Server boundary for every Profit & planning route: signed in, holds the
 * landlord role, and active (never suspended). The report RPC and ledger RLS
 * stay the final authority; this keeps the page from rendering for anyone
 * without finance access. `cache` dedupes the lookup within one request.
 */
export const requireLandlordFinanceViewer = cache(async (): Promise<LandlordFinanceViewer> => {
  const { user, profile, error } = await getServerIdentity();
  if (!user) redirect("/sign-in");
  if (error) throw new Error(`Couldn't load your profile: ${error.message}`);
  if (!profile) redirect("/browse");

  const target = landlordFinanceAccessRedirect({
    authUserId: user.id,
    roles: profile.roles,
    isSuspended: profile.is_suspended ?? false,
  });
  if (target) redirect(target);

  return { authUserId: user.id, ownerId: profile.id };
});
