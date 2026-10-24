import { firstParam } from "@/utils/routeParams";

import { isPortal, type Portal } from "./portalPreference";

// The finish-profile screen completes the profile of an account that is
// already signed in: a first Google sign-in, a confirmed email whose sign-up
// was interrupted, or an incomplete profile opened from the profile tab.
export const FINISH_PROFILE_PATHNAME = "/(auth)/finish-profile";

interface FinishProfileParams {
  email?: string;
  // Role picked before sign-in; hides the role tab on the screen.
  userSide?: Portal;
  // Pre-selected role when the account has not picked one.
  suggestedRole?: Portal;
  firstName?: string;
  lastName?: string;
  // Adds a "Use a different account" way out, since the screen blocks back.
  profileMissing?: boolean;
}

// Expo Router params are strings, so undefined entries are dropped rather
// than serialized.
export function finishProfileRoute({ profileMissing, ...params }: FinishProfileParams) {
  const entries = Object.entries({
    ...params,
    ...(profileMissing ? { profileMissing: "1" } : {}),
  }).filter(([, value]) => value !== undefined);

  return {
    pathname: FINISH_PROFILE_PATHNAME,
    params: Object.fromEntries(entries) as Record<string, string>,
  } as const;
}

// Reads `useLocalSearchParams()` for the screen: array-or-string params
// collapse to one string, and the starting role comes from the explicit
// choice, then the suggestion, then tenant. `requestedRole` stays unvalidated
// so a tampered link is rejected at submit instead of silently ignored.
export function readFinishProfileParams(raw: Record<string, string | string[] | undefined>) {
  const requestedRole = firstParam(raw.userSide);
  const suggestedRole = firstParam(raw.suggestedRole);

  return {
    email: firstParam(raw.email) ?? "",
    firstName: firstParam(raw.firstName) ?? "",
    lastName: firstParam(raw.lastName) ?? "",
    requestedRole,
    initialRole: (isPortal(requestedRole)
      ? requestedRole
      : isPortal(suggestedRole)
        ? suggestedRole
        : "tenant") satisfies Portal,
    isProfileMissing: firstParam(raw.profileMissing) === "1",
  };
}
