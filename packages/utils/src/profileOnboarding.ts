interface OnboardingProfile {
  mobile_number?: string | null;
  account_status?: string | null;
}

// Whether a signed-in account with a profile row still has to finish
// onboarding. Every completed profile has a mobile number; an account that
// already left `unverified` (verified, rejected) is past onboarding even
// without one, matching the web complete-profile page.
export function needsProfileOnboarding(profile: OnboardingProfile): boolean {
  if (profile.mobile_number) return false;
  return (profile.account_status ?? "unverified") === "unverified";
}
