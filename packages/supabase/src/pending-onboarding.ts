export interface PendingOnboardingProfile {
  roles: string[] | null;
  account_status: string | null;
  mobile_number: string | null;
}

// Single choke point for the "brand-new Google placeholder" check: the
// handle_new_user trigger inserts exactly roles=['tenant'],
// account_status='unverified', no mobile_number before a role is chosen.
// If this later becomes an explicit DB flag (e.g. onboarding_completed),
// swap the body here; all callers keep working.
export function isPendingOnboarding(
  profile: PendingOnboardingProfile | null | undefined,
): boolean {
  if (!profile) return false;
  const roles = profile.roles ?? [];
  return (
    roles.length === 1 &&
    roles[0] === "tenant" &&
    profile.account_status === "unverified" &&
    !profile.mobile_number
  );
}
