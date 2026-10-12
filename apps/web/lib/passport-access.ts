/** Only verified accounts hold a Passport (route guard and nav link). */
export function canViewPassport(accountStatus: string | null | undefined): boolean {
  return accountStatus === "verified";
}

/**
 * Where a user is sent instead of the APT Passport, or null when they may
 * enter. Only verified accounts hold a Passport: pending accounts return to
 * their profile (which explains the pending state); everyone else verifies.
 */
export function passportAccessRedirect(
  accountStatus: string | null | undefined,
  profileHref: string,
): string | null {
  if (canViewPassport(accountStatus)) return null;
  if (accountStatus === "pending") return profileHref;
  return "/verify";
}
