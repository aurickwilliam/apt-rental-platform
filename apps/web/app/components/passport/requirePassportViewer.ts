import { cache } from "react";
import { redirect } from "next/navigation";

import { getServerIdentity } from "@/lib/server-identity";

import { passportAccessRedirect } from "@/lib/passport-access";

export type PassportPortal = "tenant" | "landlord";

export const PASSPORT_PROFILE_HREF: Record<PassportPortal, string> = {
  tenant: "/tenant/profile",
  landlord: "/landlord/profile",
};

export interface PassportViewer {
  /** Internal `public.users.id` — passport rows and storage folders use it. */
  userId: string;
}

/**
 * Server guard for every APT Passport route: signed in, holds the portal's
 * role, and has a verified account. Runs in the route layout (so direct
 * links to add/detail are blocked too) and in each page to read the viewer;
 * `cache` dedupes the lookup within one request.
 */
export const requirePassportViewer = cache(async (portal: PassportPortal): Promise<PassportViewer> => {
  const { user, profile, error } = await getServerIdentity();
  if (!user) redirect("/sign-in");

  if (error) throw new Error(`Couldn't load your profile: ${error.message}`);
  if (!profile?.roles?.includes(portal)) redirect("/browse");

  const target = passportAccessRedirect(profile.account_status, PASSPORT_PROFILE_HREF[portal]);
  if (target) redirect(target);

  return { userId: profile.id };
});
