import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPendingOnboarding } from "@repo/supabase/pending-onboarding";
import { getServerIdentity } from "@/lib/server-identity";
import { PORTAL_COOKIE } from "@/lib/portal-preference";
import { policyHref, policyPortal } from "@/lib/policy-routes";
import type { RegistrationPolicy } from "@/lib/registration-policies";

export async function redirectSignedInPolicy(policy: RegistrationPolicy): Promise<void> {
  const { user, profile, error } = await getServerIdentity();
  // Legal text stays public during onboarding and unavailable/hidden-profile
  // states. Never invent a portal or create a sign-in/onboarding redirect loop.
  if (!user || !profile || error || profile.is_suspended || isPendingOnboarding(profile)) return;

  const selected = (await cookies()).get(PORTAL_COOKIE)?.value ?? null;
  const portal = policyPortal(profile.roles, selected);
  if (portal) redirect(policyHref(policy, portal));
}
