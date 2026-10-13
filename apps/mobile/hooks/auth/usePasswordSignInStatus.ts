import { useQuery } from "@tanstack/react-query";

import { getPasswordSignInStatus } from "@/service/auth/passwordChangeService";

// Session-scoped like CURRENT_USER_QUERY_KEY: clearQueryClient() on sign-in and
// sign-out drops it, so it never carries over between accounts.
export const PASSWORD_SIGN_IN_STATUS_QUERY_KEY = ["password-sign-in-status"] as const;

// Whether the signed-in account has a password it can change.
export function usePasswordSignInStatus() {
  return useQuery({
    queryKey: PASSWORD_SIGN_IN_STATUS_QUERY_KEY,
    queryFn: getPasswordSignInStatus,
  });
}
