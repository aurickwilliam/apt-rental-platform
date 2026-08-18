import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "@/service/auth/currentUserService";
import { CURRENT_USER_QUERY_KEY } from "@/utils/queryClient";

export { CURRENT_USER_QUERY_KEY } from "@/utils/queryClient";
export type { UserProfile } from "@/service/auth/currentUserService";

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
  });
}

export function useCurrentUserId(): string | null {
  const { data: currentUser } = useCurrentUser();

  return currentUser?.id ?? null;
}
