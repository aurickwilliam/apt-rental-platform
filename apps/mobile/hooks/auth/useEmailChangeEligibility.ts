import { useQuery } from "@tanstack/react-query";

import { getEmailChangeEligibility } from "@/service/auth/emailChangeService";

// Session-scoped like PASSWORD_SIGN_IN_STATUS_QUERY_KEY: clearQueryClient() on
// sign-in and sign-out drops it, so it never carries over between accounts.
export const EMAIL_CHANGE_ELIGIBILITY_QUERY_KEY = ["email-change-eligibility"] as const;

// Whether the signed-in account can change its email. Only email/password
// accounts without Google may; everything else stays disabled.
export function useEmailChangeEligibility() {
  return useQuery({
    queryKey: EMAIL_CHANGE_ELIGIBILITY_QUERY_KEY,
    queryFn: getEmailChangeEligibility,
  });
}
